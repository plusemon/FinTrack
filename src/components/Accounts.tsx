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

interface AccountsProps {
  currency: string;
  language: Language;
}

export default function Accounts({ currency, language }: AccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const t = translations[language];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const data = await api.getAccounts();
    setAccounts(data);
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
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCard({ account, currency, t, onEdit }: { account: Account, currency: string, t: any, onEdit: () => void }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
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

      <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 flex items-end justify-between">
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

function AccountForm({ onClose, t, account }: { onClose: () => void, t: any, account?: Account | null }) {
  const [name, setName] = useState(account?.name || "");
  const [type, setType] = useState(account?.type || "cash");
  const [balance, setBalance] = useState(account?.balance?.toString() || "");
  const [color, setColor] = useState(account?.color || "#10b981");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        await api.addAccount(data);
      }
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to save account");
    }
  };

  const handleDelete = async () => {
    if (account && window.confirm(t.confirmDeleteAccount)) {
      try {
        await api.deleteAccount(account.id);
        onClose();
      } catch (error: any) {
        alert(error.message || "Failed to delete account");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.accountName}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chase Bank"
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.accountType}</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
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
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.themeColor}</label>
        <div className="flex gap-2">
          {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#1a1a1a"].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                color === c ? "border-zinc-900 dark:border-zinc-100 scale-110" : "border-transparent"
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
          className="flex-1 py-3 border border-black/5 dark:border-white/5 rounded-xl font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          {t.cancel}
        </button>
        {account && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            {t.delete}
          </button>
        )}
        <button
          type="submit"
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
        >
          {account ? t.save : t.create}
        </button>
      </div>
    </form>
  );
}
