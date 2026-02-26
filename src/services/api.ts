import { Summary, Account, Category, Transaction, Budget } from "../types";

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
};

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
    return handleResponse(res);
  },

  async updateAccount(id: number, account: Omit<Account, "id">): Promise<{ success: boolean }> {
    const res = await fetch(`/api/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    });
    return handleResponse(res);
  },

  async deleteAccount(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/accounts/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
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
    return handleResponse(res);
  },

  async updateCategory(id: number, category: Omit<Category, "id">): Promise<{ success: boolean }> {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    return handleResponse(res);
  },

  async deleteCategory(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
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
    return handleResponse(res);
  },

  async updateTransaction(id: number, transaction: Omit<Transaction, "id">): Promise<{ success: boolean }> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });
    return handleResponse(res);
  },

  async deleteTransaction(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
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
    return handleResponse(res);
  },

  async updateBudget(id: number, budget: Omit<Budget, "id" | "spent">): Promise<{ success: boolean }> {
    const res = await fetch(`/api/budgets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(budget),
    });
    return handleResponse(res);
  },

  async deleteBudget(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/budgets/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  async getSettings(): Promise<Record<string, string>> {
    const res = await fetch("/api/settings");
    return res.json();
  },

  async updateSetting(key: string, value: string): Promise<{ success: boolean }> {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return handleResponse(res);
  },
};
