import { Summary, Account, Category, Transaction, Budget, PartnerRelationship, UserProfile } from "../types";
import { db, auth } from "../lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

let activePartnerId: string | null = null;
let activePartnerPermission: PartnerRelationship["permission"] | null = null;

const getAuthUid = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

const getEffectiveUserId = () => activePartnerId ?? getAuthUid();

// Base path helper
const getColRef = (colName: string) => collection(db, `users/${getEffectiveUserId()}/${colName}`);
const getDocRef = (colName: string, id: string) => doc(db, `users/${getEffectiveUserId()}/${colName}`, id);

const assertCanWrite = () => {
  if (!activePartnerId) return;
  if (activePartnerPermission !== "write") {
    throw new Error("No write permission in partner context");
  }
};

const getPartnerDocPath = (ownerId: string, partnerId: string) =>
  doc(db, `users/${ownerId}/partners`, partnerId);

const getSharedDocPath = (partnerId: string, ownerId: string) =>
  doc(db, `users/${partnerId}/sharedWithMe`, ownerId);

export const api = {
  // Viewing context
  setViewContext(ownerId: string | null, permission?: PartnerRelationship["permission"]) {
    activePartnerId = ownerId;
    activePartnerPermission = ownerId ? (permission ?? "read") : null;
  },

  getViewContext() {
    return { ownerId: activePartnerId, permission: activePartnerPermission };
  },

  isPartnerContext() {
    return !!activePartnerId;
  },

  // User profile index for email lookup
  async ensureUserProfile(): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    await setDoc(
      doc(db, "userProfiles", user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  },

  async findUserByEmail(email: string): Promise<UserProfile | null> {
    const q = query(collection(db, "userProfiles"), where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile;
  },

  // Partner invitations
  async sendPartnerInvite(partnerEmail: string): Promise<void> {
    const owner = auth.currentUser;
    if (!owner || !owner.email) throw new Error("Owner not authenticated");

    const normalizedEmail = partnerEmail.trim().toLowerCase();
    if (normalizedEmail === owner.email.toLowerCase()) {
      throw new Error("Cannot invite yourself");
    }

    const partner = await this.findUserByEmail(normalizedEmail);
    if (!partner) throw new Error("User not found");

    const ownerId = owner.uid;
    const partnerId = partner.uid;
    const now = new Date().toISOString();

    const ownerData: Omit<PartnerRelationship, "id"> = {
      ownerId,
      ownerEmail: owner.email,
      ownerName: owner.displayName || "",
      ownerPhotoURL: owner.photoURL || "",
      partnerId,
      partnerEmail: partner.email,
      partnerName: partner.displayName || "",
      partnerPhotoURL: partner.photoURL || "",
      status: "pending",
      permission: "write",
      createdAt: now,
    };

    const partnerData: Omit<PartnerRelationship, "id"> = {
      ...ownerData,
    };

    await setDoc(getPartnerDocPath(ownerId, partnerId), ownerData);
    await setDoc(getSharedDocPath(partnerId, ownerId), partnerData);
  },

  async acceptPartnerInvite(ownerId: string): Promise<void> {
    const partner = auth.currentUser;
    if (!partner) throw new Error("Not authenticated");

    const partnerId = partner.uid;
    const now = new Date().toISOString();

    await updateDoc(getPartnerDocPath(ownerId, partnerId), { status: "accepted", acceptedAt: now });
    await updateDoc(getSharedDocPath(partnerId, ownerId), { status: "accepted", acceptedAt: now });
  },

  async declinePartnerInvite(ownerId: string): Promise<void> {
    const partner = auth.currentUser;
    if (!partner) throw new Error("Not authenticated");

    const partnerId = partner.uid;
    await updateDoc(getPartnerDocPath(ownerId, partnerId), { status: "revoked" });
    await updateDoc(getSharedDocPath(partnerId, ownerId), { status: "revoked" });
  },

  async revokePartnerAccess(partnerId: string): Promise<void> {
    const owner = auth.currentUser;
    if (!owner) throw new Error("Not authenticated");

    const ownerId = owner.uid;
    await updateDoc(getPartnerDocPath(ownerId, partnerId), { status: "revoked" });
    await updateDoc(getSharedDocPath(partnerId, ownerId), { status: "revoked" });
  },

  async getMyPartners(): Promise<PartnerRelationship[]> {
    const ownerId = getAuthUid();
    const snapshot = await getDocs(collection(db, `users/${ownerId}/partners`));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as PartnerRelationship))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getSharedWithMe(): Promise<PartnerRelationship[]> {
    const partnerId = getAuthUid();
    const snapshot = await getDocs(collection(db, `users/${partnerId}/sharedWithMe`));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as PartnerRelationship))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getPartnerRelationship(ownerId: string): Promise<PartnerRelationship | null> {
    const partnerId = getAuthUid();
    const snap = await getDoc(getPartnerDocPath(ownerId, partnerId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as PartnerRelationship;
  },

  async getSummary(): Promise<Summary> {
    const accounts = await this.getAccounts();
    const transactions = await this.getTransactions();

    const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);
    const currentMonth = new Date().toISOString().slice(0, 7);

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach(t => {
      if (t.date.startsWith(currentMonth)) {
        if (t.type === 'income') monthlyIncome += t.amount;
        if (t.type === 'expense' || (t.type === 'due' && t.status === 'paid')) {
          monthlyExpense += t.amount;
        }
      }
    });

    return { totalBalance, monthlyIncome, monthlyExpense };
  },

  async getAccounts(): Promise<Account[]> {
    const snapshot = await getDocs(getColRef('accounts'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  },

  async addAccount(account: Omit<Account, "id">): Promise<{ id: string }> {
    assertCanWrite();
    const data = { ...account, userId: getEffectiveUserId() };
    const docRef = await addDoc(getColRef('accounts'), data);
    return { id: docRef.id };
  },

  async updateAccount(id: string, account: Omit<Account, "id">): Promise<{ success: boolean }> {
    assertCanWrite();
    await updateDoc(getDocRef('accounts', id), { ...account, userId: getEffectiveUserId() });
    return { success: true };
  },

  async deleteAccount(id: string): Promise<{ success: boolean }> {
    assertCanWrite();
    await deleteDoc(getDocRef('accounts', id));
    return { success: true };
  },

  async getCategories(): Promise<Category[]> {
    const snapshot = await getDocs(getColRef('categories'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  },

  async addCategory(category: Omit<Category, "id">): Promise<{ id: string }> {
    assertCanWrite();
    const data = { ...category, userId: getEffectiveUserId() };
    const docRef = await addDoc(getColRef('categories'), data);
    return { id: docRef.id };
  },

  async updateCategory(id: string, category: Omit<Category, "id">): Promise<{ success: boolean }> {
    assertCanWrite();
    await updateDoc(getDocRef('categories', id), { ...category, userId: getEffectiveUserId() });
    return { success: true };
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    assertCanWrite();
    await deleteDoc(getDocRef('categories', id));
    return { success: true };
  },

  async getTransactions(filters: { limit?: number; startDate?: string; endDate?: string } = {}): Promise<Transaction[]> {
    const { limit = 100, startDate, endDate } = filters;
    const snapshot = await getDocs(getColRef('transactions'));
    let transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

    if (startDate) {
      transactions = transactions.filter(t => t.date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter(t => t.date <= endDate);
    }

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return transactions.slice(0, limit);
  },

  async addTransaction(transaction: Omit<Transaction, "id">): Promise<{ id: string }> {
    assertCanWrite();
    const data = { ...transaction, userId: getEffectiveUserId() };
    const docRef = await addDoc(getColRef('transactions'), data);
    return { id: docRef.id };
  },

  async updateTransaction(id: string, transaction: Omit<Transaction, "id">): Promise<{ success: boolean }> {
    assertCanWrite();
    await updateDoc(getDocRef('transactions', id), { ...transaction, userId: getEffectiveUserId() });
    return { success: true };
  },

  async deleteTransaction(id: string): Promise<{ success: boolean }> {
    assertCanWrite();
    await deleteDoc(getDocRef('transactions', id));
    return { success: true };
  },

  async getBudgets(): Promise<Budget[]> {
    const snapshot = await getDocs(getColRef('budgets'));
    const budgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
    const transactions = await this.getTransactions();

    const getPeriodRange = (period: string) => {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);

      switch (period) {
        case 'weekly':
          start.setDate(now.getDate() - now.getDay());
          end.setDate(start.getDate() + 6);
          break;
        case 'monthly':
          start.setDate(1);
          end.setMonth(start.getMonth() + 1, 0);
          break;
        case 'yearly':
          start.setMonth(0, 1);
          end.setMonth(11, 31);
          break;
        default:
          start.setDate(1);
          end.setMonth(start.getMonth() + 1, 0);
      }
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    return budgets.map(budget => {
      const { start, end } = getPeriodRange(budget.period);
      let spent = 0;
      transactions.forEach(t => {
        if (t.date >= start && t.date <= end && t.type === 'expense' && (!budget.category_id || t.category_id === budget.category_id)) {
          spent += t.amount;
        }
      });
      return { ...budget, spent };
    });
  },

  async addBudget(budget: Omit<Budget, "id" | "spent">): Promise<{ id: string }> {
    assertCanWrite();
    const data = { ...budget, userId: getEffectiveUserId() };
    const docRef = await addDoc(getColRef('budgets'), data);
    return { id: docRef.id };
  },

  async updateBudget(id: string, budget: Omit<Budget, "id" | "spent">): Promise<{ success: boolean }> {
    assertCanWrite();
    await updateDoc(getDocRef('budgets', id), { ...budget, userId: getEffectiveUserId() });
    return { success: true };
  },

  async deleteBudget(id: string): Promise<{ success: boolean }> {
    assertCanWrite();
    await deleteDoc(getDocRef('budgets', id));
    return { success: true };
  },

  async checkBudgetAlerts(): Promise<{ exceeded: Budget[]; warning: Budget[] }> {
    const budgets = await this.getBudgets();
    const exceeded: Budget[] = [];
    const warning: Budget[] = [];

    for (const budget of budgets) {
      if (budget.amount > 0) {
        const percentage = (budget.spent / budget.amount) * 100;
        if (percentage >= 100) {
          exceeded.push(budget);
        } else if (percentage >= 80) {
          warning.push(budget);
        }
      }
    }

    return { exceeded, warning };
  },

  async getSettings(): Promise<Record<string, string>> {
    try {
      const docRef = getDocRef('settings', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          currency: data.currency,
          theme: data.theme,
          language: data.language
        };
      }
      return { currency: "BDT", theme: "light" };
    } catch {
      return { currency: "BDT", theme: "light" };
    }
  },

  async updateSetting(key: string, value: string): Promise<{ success: boolean }> {
    if (activePartnerId) throw new Error("Cannot change settings in partner context");
    const settings = await this.getSettings() as any;
    settings[key] = value;
    settings.userId = getAuthUid();
    await setDoc(getDocRef('settings', 'profile'), settings);
    return { success: true };
  },

  async getNotificationSettings(): Promise<{
    dailyReminderEnabled: boolean;
    reminderTime: string;
    budgetAlertsEnabled: boolean;
  }> {
    try {
      const docRef = getDocRef('settings', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          dailyReminderEnabled: data.dailyReminderEnabled || false,
          reminderTime: data.reminderTime || "20:00",
          budgetAlertsEnabled: data.budgetAlertsEnabled ?? true,
        };
      }
      return { dailyReminderEnabled: false, reminderTime: "20:00", budgetAlertsEnabled: true };
    } catch {
      return { dailyReminderEnabled: false, reminderTime: "20:00", budgetAlertsEnabled: true };
    }
  },

  async updateNotificationSettings(settings: {
    dailyReminderEnabled?: boolean;
    reminderTime?: string;
    budgetAlertsEnabled?: boolean;
  }): Promise<{ success: boolean }> {
    if (activePartnerId) throw new Error("Cannot change settings in partner context");
    const docRef = getDocRef('settings', 'profile');
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.exists() ? docSnap.data() : {};
    await setDoc(docRef, { ...currentData, ...settings, userId: getAuthUid() });
    return { success: true };
  },

  async getSecuritySettings(): Promise<{
    pinEnabled: boolean;
    biometricEnabled: boolean;
  }> {
    try {
      const docRef = getDocRef('settings', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          pinEnabled: !!data.pinHash,
          biometricEnabled: data.biometricEnabled || false,
        };
      }
      return { pinEnabled: false, biometricEnabled: false };
    } catch {
      return { pinEnabled: false, biometricEnabled: false };
    }
  },

  async updateSecuritySettings(settings: {
    pinHash?: string;
    biometricEnabled?: boolean;
  }): Promise<{ success: boolean }> {
    if (activePartnerId) throw new Error("Cannot change settings in partner context");
    const docRef = getDocRef('settings', 'profile');
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.exists() ? docSnap.data() : {};
    await setDoc(docRef, { ...currentData, ...settings, userId: getAuthUid() });
    return { success: true };
  },

  async verifyPin(pin: string): Promise<boolean> {
    try {
      const docRef = getDocRef('settings', 'profile');
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || !docSnap.data().pinHash) {
        return false;
      }
      const storedHash = docSnap.data().pinHash;
      const pinHash = await this.hashPin(pin);
      return pinHash === storedHash;
    } catch {
      return false;
    }
  },

  async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async initializeDefaultData(): Promise<void> {
    if (activePartnerId) return;
    const accounts = await this.getAccounts();
    if (accounts.length > 0) return;

    const defaultAccount = {
      name: "Cash",
      type: "cash",
      balance: 0,
      icon: "cash",
      color: "#10b981"
    };
    await this.addAccount(defaultAccount);

    const expenseCategories = [
      { name: "Food", color: "#f59e0b" },
      { name: "Transport", color: "#3b82f6" },
      { name: "Shopping", color: "#8b5cf6" },
      { name: "Bills", color: "#ef4444" },
      { name: "Entertainment", color: "#ec4899" },
      { name: "Health", color: "#10b981" },
      { name: "Other", color: "#6b7280" }
    ];

    for (const cat of expenseCategories) {
      await this.addCategory({
        name: cat.name,
        type: "expense",
        parent_id: null,
        icon: "Folder",
        color: cat.color
      });
    }

    const incomeCategories = [
      { name: "Salary", color: "#10b981" },
      { name: "Business", color: "#3b82f6" },
      { name: "Investment", color: "#8b5cf6" },
      { name: "Gift", color: "#f59e0b" },
      { name: "Other", color: "#6b7280" }
    ];

    for (const cat of incomeCategories) {
      await this.addCategory({
        name: cat.name,
        type: "income",
        parent_id: null,
        icon: "Folder",
        color: cat.color
      });
    }
  },

  async resetAllData(): Promise<void> {
    if (activePartnerId) throw new Error("Cannot reset partner data");
    const userId = getAuthUid();
    const collections = ['accounts', 'categories', 'transactions', 'budgets'];

    for (const col of collections) {
      const snapshot = await getDocs(collection(db, `users/${userId}/${col}`));
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }
  }
};
