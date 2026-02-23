import { Summary, Account, Category, Transaction, Budget } from "../types";

export const api = {
  async getSummary(): Promise<Summary> {
    const res = await fetch("/api/summary");
    return res.json();
  },

  async getAccounts(): Promise<Account[]> {
    const res = await fetch("/api/accounts");
    return res.json();
  },

  async addAccount(account: Omit<Account, "id">): Promise<{ id: number }> {
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    });
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch("/api/categories");
    return res.json();
  },

  async addCategory(category: Omit<Category, "id">): Promise<{ id: number }> {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    return res.json();
  },

  async getTransactions(filters: any = {}): Promise<Transaction[]> {
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/transactions?${params}`);
    return res.json();
  },

  async addTransaction(transaction: Omit<Transaction, "id">): Promise<{ id: number }> {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });
    return res.json();
  },

  async getBudgets(): Promise<Budget[]> {
    const res = await fetch("/api/budgets");
    return res.json();
  },

  async addBudget(budget: Omit<Budget, "id" | "spent">): Promise<{ id: number }> {
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(budget),
    });
    return res.json();
  },
};
