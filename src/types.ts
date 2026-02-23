export type TransactionType = "income" | "expense" | "transfer" | "due";

export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  icon: string;
  color: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  type: "income" | "expense";
  icon: string;
  color: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  date: string;
  category_id: number | null;
  category_name?: string;
  account_id: number;
  account_name?: string;
  to_account_id: number | null;
  notes: string;
  status: "paid" | "unpaid";
  due_date?: string;
}

export interface Budget {
  id: number;
  category_id: number | null;
  category_name?: string;
  amount: number;
  spent: number;
  period: string;
}

export interface Summary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}
