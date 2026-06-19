export type TransactionType = "income" | "expense" | "transfer" | "due";

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  type: "income" | "expense";
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category_id: string | null;
  category_name?: string;
  account_id: string;
  account_name?: string;
  to_account_id: string | null;
  to_account_name?: string;
  notes: string;
  status: "paid" | "unpaid";
  due_date?: string;
}

export interface Budget {
  id: string;
  category_id: string | null;
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

export type PartnerStatus = "pending" | "accepted" | "revoked";
export type PartnerPermission = "read" | "write";

export interface PartnerRelationship {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  ownerPhotoURL?: string;
  partnerId: string;
  partnerEmail?: string;
  partnerName?: string;
  partnerPhotoURL?: string;
  status: PartnerStatus;
  permission: PartnerPermission;
  createdAt: string;
  acceptedAt?: string;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  updatedAt: string;
}

export type NotificationType =
  | "partner_invite"
  | "partner_accept"
  | "partner_revoke"
  | "budget_warning"
  | "budget_exceeded"
  | "daily_reminder";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
