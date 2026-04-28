import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  CreditCard, 
  Banknote, 
  Plus, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { api } from "../services/api";
import { Account } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { translations, Language } from "../i18n/translations";
import ConfirmDialog from "./ui/ConfirmDialog";
import Toast, { ToastType } from "./ui/Toast";
import LoadingOverlay from "./ui/LoadingOverlay";

interface AccountsProps {
  currency: string;
  language: Language;
}

export default function Accounts({ currency, language }: AccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

  const t = translations[language];

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAccounts();
      setAccounts(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t.financialAccounts}</h3>
          <p className="text-zinc-500 dark:text-zinc-400">{t.manageAccounts}</p>
        </div>
        <button 
          onClick={() => {
            setEditingAccount(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={20} />
          {t.addAccount}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <AccountCard 
            key={account.id} 
            account={account} 
            currency={currency} 
            t={t} 
            onEdit={() => {
              setEditingAccount(account);
              setIsModalOpen(true);
            }}
          />
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-8 relative transition-colors duration-300">
            <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
              {editingAccount ? t.editAccount : t.newAccount}
            </h3>
            <AccountForm 
              t={t} 
              account={editingAccount}
              onClose={() => { 
                setIsModalOpen(false); 
                setEditingAccount(null);
                fetchAccounts(); 
              }} 
              onToast={showToast}
            />
          </div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

function AccountCard({ account, currency, t, onEdit }: { account: Account, currency: string, t: any, onEdit: () => void }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-8">
        <div className="p-4 rounded-2xl" style={{ backgroundColor: `${account.color}15`, color: account.color }}>
          {account.type === 'bank' ? <Banknote size={28} /> : 
           account.type === 'card' ? <CreditCard size={28} /> : <Wallet size={28} />}
        </div>
        <button 
          onClick={onEdit}
          className="p-2 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <MoreVertical size={20} />
        </button>
      </div>
      
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{account.name}</h4>
        <p className="text-zinc-400 dark:text-zinc-500 text-sm capitalize">
          {account.type === 'bank' ? t.bankAccount : 
           account.type === 'card' ? t.creditCard : 
           account.type === 'investment' ? t.investment : t.cashWallet}
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/5 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t.currentBalance}</p>
          <p className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{formatCurrency(account.balance, currency)}</p>
        </div>
        <div className="flex gap-1">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft size={14} />
          </div>
          <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountForm({ onClose, t, account, onToast }: { onClose: () => void, t: any, account?: Account | null, onToast: (m: string, ty?: ToastType) => void }) {
  const [name, setName] = useState(account?.name || "");
  const [type, setType] = useState(account?.type || "cash");
  const [balance, setBalance] = useState(account?.balance?.toString() || "");
  const [color, setColor] = useState(account?.color || "#10b981");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const data = {
        name,
        type,
        balance: parseFloat(balance) || 0,
        icon: type,
        color
      };

      if (account) {
        await api.updateAccount(account.id, data);
        onToast(t.accountUpdated || "Account updated successfully");
      } else {
        await api.addAccount(data);
        onToast(t.accountCreated || "Account created successfully");
      }
      onClose();
    } catch (error: any) {
      onToast(error.message || "Failed to save account", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    setIsDeleting(true);
    try {
      await api.deleteAccount(account.id);
      onToast(t.accountDeleted || "Account deleted successfully");
      onClose();
    } catch (error: any) {
      onToast(error.message || "Failed to delete account", "error");
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.accountName}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chase Bank"
            disabled={isProcessing || isDeleting}
            className="w-full p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.accountType}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isProcessing || isDeleting}
            className="w-full p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
          >
            <option value="cash">{t.cashWallet}</option>
            <option value="bank">{t.bankAccount}</option>
            <option value="card">{t.creditCard}</option>
            <option value="investment">{t.investment}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.initialBalance}</label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            disabled={isProcessing || isDeleting}
            className="w-full p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.themeColor}</label>
          <div className="flex gap-2">
            {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#1a1a1a"].map(c => (
              <button
                key={c}
                type="button"
                disabled={isProcessing || isDeleting}
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  color === c ? "border-zinc-900 dark:border-zinc-100 scale-110" : "border-transparent",
                  (isProcessing || isDeleting) && "opacity-50 cursor-not-allowed"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing || isDeleting}
            className="flex-1 py-3 border border-zinc-200 dark:border-white/5 rounded-xl font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.cancel}
          </button>
          {account && (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isProcessing || isDeleting}
              className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.delete}
            </button>
          )}
          <button
            type="submit"
            disabled={isProcessing || isDeleting}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md disabled:opacity-70"
          >
            {account ? t.save : t.create}
          </button>
        </div>
      </form>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title={t.deleteAccount || "Delete Account"}
        message={t.confirmDeleteAccount || "Are you sure you want to delete this account? All associated transactions will be permanently removed."}
        confirmText={isDeleting ? "..." : t.delete}
        cancelText={t.cancel}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
