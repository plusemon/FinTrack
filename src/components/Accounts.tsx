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

interface AccountsProps {
  currency: string;
}

export default function Accounts({ currency }: AccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <h3 className="text-2xl font-bold tracking-tight">Financial Accounts</h3>
          <p className="text-zinc-500">Manage your wallets, bank accounts, and cards.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} currency={currency} />
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <h3 className="text-xl font-bold mb-6">New Account</h3>
            <AccountForm onClose={() => { setIsModalOpen(false); fetchAccounts(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCard({ account, currency }: { account: Account, currency: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-8">
        <div className="p-4 rounded-2xl" style={{ backgroundColor: `${account.color}15`, color: account.color }}>
          {account.type === 'bank' ? <Banknote size={28} /> : 
           account.type === 'card' ? <CreditCard size={28} /> : <Wallet size={28} />}
        </div>
        <button className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-lg transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
      
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-zinc-900">{account.name}</h4>
        <p className="text-zinc-400 text-sm capitalize">{account.type} Account</p>
      </div>

      <div className="mt-6 pt-6 border-t border-black/5 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Current Balance</p>
          <p className="text-2xl font-black tracking-tight">{formatCurrency(account.balance, currency)}</p>
        </div>
        <div className="flex gap-1">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft size={14} />
          </div>
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#10b981");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addAccount({
      name,
      type,
      balance: parseFloat(balance) || 0,
      icon: type,
      color
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Account Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chase Bank"
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Account Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="cash">Cash / Wallet</option>
          <option value="bank">Bank Account</option>
          <option value="card">Credit Card</option>
          <option value="investment">Investment</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Initial Balance</label>
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0.00"
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Theme Color</label>
        <div className="flex gap-2">
          {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#1a1a1a"].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                color === c ? "border-zinc-900 scale-110" : "border-transparent"
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
          className="flex-1 py-3 border border-black/5 rounded-xl font-bold text-zinc-500 hover:bg-zinc-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
        >
          Create
        </button>
      </div>
    </form>
  );
}
