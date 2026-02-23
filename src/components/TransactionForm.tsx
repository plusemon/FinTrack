import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Account, Category, Transaction } from "../types";
import { cn, formatCurrency } from "../lib/utils";

interface TransactionFormProps {
  onClose: () => void;
  currency: string;
  transaction?: Transaction; // If provided, we are in edit mode
}

export default function TransactionForm({ onClose, currency, transaction }: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense" | "transfer" | "due">(transaction?.type || "expense");
  const [amount, setAmount] = useState(transaction?.amount.toString() || "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id?.toString() || "");
  const [accountId, setAccountId] = useState(transaction?.account_id.toString() || "");
  const [toAccountId, setToAccountId] = useState(transaction?.to_account_id?.toString() || "");
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState(transaction?.notes || "");
  const [status, setStatus] = useState<"paid" | "unpaid">(transaction?.status || "paid");
  const [dueDate, setDueDate] = useState(transaction?.due_date || "");
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getAccounts().then(setAccounts);
    api.getCategories().then(setCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId || (type !== 'transfer' && !categoryId)) return;

    const transactionData = {
      type,
      amount: parseFloat(amount),
      date,
      category_id: type === 'transfer' ? null : parseInt(categoryId),
      account_id: parseInt(accountId),
      to_account_id: type === 'transfer' ? parseInt(toAccountId) : null,
      notes,
      status,
      due_date: type === 'due' ? dueDate : null
    };

    if (transaction?.id) {
      await api.updateTransaction(transaction.id, transactionData);
    } else {
      await api.addTransaction(transactionData);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (transaction?.id && window.confirm("Are you sure you want to delete this transaction?")) {
      await api.deleteTransaction(transaction.id);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex bg-zinc-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {(["expense", "income", "transfer", "due"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              if (t === 'due') setStatus('unpaid');
              else setStatus('paid');
            }}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap",
              type === t ? "bg-white shadow-sm text-emerald-600" : "text-zinc-500"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          />
        </div>
      </div>

      {type === 'due' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "paid" | "unpaid")}
              className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 uppercase">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              required={type === 'due'}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase">Account</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          required
        >
          <option value="">Select Account</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, currency)})</option>)}
        </select>
      </div>

      {type === 'transfer' ? (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase">To Account</label>
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          >
            <option value="">Select Destination Account</option>
            {accounts.filter(a => a.id.toString() !== accountId).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          >
            <option value="">Select Category</option>
            {categories.filter(c => c.type === (type === 'due' ? 'expense' : type)).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-20 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-4 border border-black/5 rounded-xl font-bold text-zinc-500 hover:bg-zinc-50 transition-all"
        >
          Cancel
        </button>
        {transaction?.id && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all"
          >
            Delete
          </button>
        )}
        <button
          type="submit"
          className="flex-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md"
        >
          {transaction?.id ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
}
