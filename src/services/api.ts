import { Summary, Account, Category, Transaction, Budget } from "../types";
import { db, auth } from "../lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

const getUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

// Base path helper
const getColRef = (colName: string) => collection(db, `users/${getUserId()}/${colName}`);
const getDocRef = (colName: string, id: string) => doc(db, `users/${getUserId()}/${colName}`, id);

export const api = {
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
    const data = { ...account, userId: getUserId() };
    const docRef = await addDoc(getColRef('accounts'), data);
    return { id: docRef.id };
  },

  async updateAccount(id: string, account: Omit<Account, "id">): Promise<{ success: boolean }> {
    await updateDoc(getDocRef('accounts', id), { ...account, userId: getUserId() });
    return { success: true };
  },

  async deleteAccount(id: string): Promise<{ success: boolean }> {
    await deleteDoc(getDocRef('accounts', id));
    return { success: true };
  },

  async getCategories(): Promise<Category[]> {
    const snapshot = await getDocs(getColRef('categories'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  },

  async addCategory(category: Omit<Category, "id">): Promise<{ id: string }> {
    const data = { ...category, userId: getUserId() };
    const docRef = await addDoc(getColRef('categories'), data);
    return { id: docRef.id };
  },

  async updateCategory(id: string, category: Omit<Category, "id">): Promise<{ success: boolean }> {
    await updateDoc(getDocRef('categories', id), { ...category, userId: getUserId() });
    return { success: true };
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
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
    const data = { ...transaction, userId: getUserId() };
    const docRef = await addDoc(getColRef('transactions'), data);
    return { id: docRef.id };
  },

  async updateTransaction(id: string, transaction: Omit<Transaction, "id">): Promise<{ success: boolean }> {
    await updateDoc(getDocRef('transactions', id), { ...transaction, userId: getUserId() });
    return { success: true };
  },

  async deleteTransaction(id: string): Promise<{ success: boolean }> {
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
    const data = { ...budget, userId: getUserId() };
    const docRef = await addDoc(getColRef('budgets'), data);
    return { id: docRef.id };
  },

  async updateBudget(id: string, budget: Omit<Budget, "id" | "spent">): Promise<{ success: boolean }> {
    await updateDoc(getDocRef('budgets', id), { ...budget, userId: getUserId() });
    return { success: true };
  },

  async deleteBudget(id: string): Promise<{ success: boolean }> {
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
    const settings = await this.getSettings() as any;
    settings[key] = value;
    settings.userId = getUserId();
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
    const docRef = getDocRef('settings', 'profile');
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.exists() ? docSnap.data() : {};
    await setDoc(docRef, { ...currentData, ...settings, userId: getUserId() });
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
    const docRef = getDocRef('settings', 'profile');
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.exists() ? docSnap.data() : {};
    await setDoc(docRef, { ...currentData, ...settings, userId: getUserId() });
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
    const userId = getUserId();
    const collections = ['accounts', 'categories', 'transactions', 'budgets'];
    
    for (const col of collections) {
      const snapshot = await getDocs(getColRef(col));
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }
  }
};
