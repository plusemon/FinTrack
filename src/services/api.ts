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

  async getTransactions(filters: any = {}): Promise<Transaction[]> {
    const snapshot = await getDocs(getColRef('transactions'));
    let transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    // Sort descending by date
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return transactions;
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
    
    // Calculate spent
    return budgets.map(budget => {
      let spent = 0;
      transactions.forEach(t => {
        if (t.type === 'expense' && (!budget.category_id || t.category_id === budget.category_id)) {
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
  }
};
