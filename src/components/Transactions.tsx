import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Download,
  Trash2,
  Edit2,
  ReceiptText,
  Clock,
  CheckCircle2
} from "lucide-react";
import { api } from "../services/api";
import { Transaction, Account, Category } from "../types";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import TransactionForm from "./TransactionForm";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { translations, Language } from "../i18n/translations";

interface TransactionsProps {
  currency: string;
  language: Language;
}

export default function Transactions({ currency, language }: TransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    accountId: "",
    categoryId: "",
    startDate: "",
    endDate: ""
  });

  const t = translations[language];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    const [t, a, c] = await Promise.all([
      api.getTransactions(filters),
      api.getAccounts(),
      api.getCategories()
    ]);
    setTransactions(t);
    setAccounts(a);
    setCategories(c);
  };

  const filteredTransactions = transactions.filter(t => 
    t.notes?.toLowerCase().includes(search.toLowerCase()) ||
    t.category_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.account_name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ["Date", "Type", "Category", "Account", "Amount", "Notes"];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      t.category_name || "N/A",
      t.account_name,
      t.amount,
      t.notes || ""
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-black/5 rounded-xl hover:bg-zinc-50 transition-colors font-medium text-zinc-600"
            >
              <Download size={18} />
              {t.export}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors font-medium">
              <Filter size={18} />
              {t.filters}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            className="p-2 bg-zinc-50 border border-black/5 rounded-lg text-sm outline-none"
          >
            <option value="">{t.allAccounts}</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="p-2 bg-zinc-50 border border-black/5 rounded-lg text-sm outline-none"
          >
            <option value="">{t.allCategories}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="p-2 bg-zinc-50 border border-black/5 rounded-lg text-sm outline-none"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="p-2 bg-zinc-50 border border-black/5 rounded-lg text-sm outline-none"
          />
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-black/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.category}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.account}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.notes}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">{t.amount}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredTransactions.map((tr) => (
                <tr 
                  key={tr.id} 
                  className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                  onClick={() => setEditingTransaction(tr)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">{formatDate(tr.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tr.type === 'income' ? "bg-emerald-50 text-emerald-600" : 
                        tr.type === 'expense' ? "bg-red-50 text-red-600" : 
                        tr.type === 'due' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {tr.type === 'income' ? <ArrowDownLeft size={14} /> : 
                         tr.type === 'expense' ? <ArrowUpRight size={14} /> : 
                         tr.type === 'due' ? <Clock size={14} /> : <ArrowRightLeft size={14} />}
                      </div>
                      <span className="font-medium text-zinc-900">{tr.category_name || (tr.type === 'due' ? t.creditPurchase : t.transfer)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                    {tr.account_name}
                    {tr.type === 'due' && (
                      <span className={cn(
                        "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        tr.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {tr.status === 'paid' ? t.paid : t.unpaid}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{tr.notes || "-"}</td>
                  <td className={cn(
                    "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                    tr.type === 'income' ? "text-emerald-600" : 
                    (tr.type === 'expense' || tr.type === 'due') ? "text-red-600" : "text-blue-600"
                  )}>
                    {(tr.type === 'expense' || tr.type === 'due') ? "-" : tr.type === 'income' ? "+" : ""}{formatCurrency(tr.amount, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tr.type === 'due' && tr.status === 'unpaid' && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            api.updateTransaction(tr.id, { ...tr, status: 'paid' }).then(fetchData);
                          }}
                          className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title={t.markAsPaid}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingTransaction(tr); }}
                        className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (window.confirm(t.confirmDelete)) {
                            api.deleteTransaction(tr.id).then(fetchData);
                          }
                        }}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-black/5">
          {filteredTransactions.map((tr) => (
            <div 
              key={tr.id} 
              className="p-4 flex items-center justify-between active:bg-zinc-50 transition-colors cursor-pointer"
              onClick={() => setEditingTransaction(tr)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  tr.type === 'income' ? "bg-emerald-50 text-emerald-600" : 
                  tr.type === 'expense' ? "bg-red-50 text-red-600" : 
                  tr.type === 'due' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>
                  {tr.type === 'income' ? <ArrowDownLeft size={20} /> : 
                   tr.type === 'expense' ? <ArrowUpRight size={20} /> : 
                   tr.type === 'due' ? <Clock size={20} /> : <ArrowRightLeft size={20} />}
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{tr.category_name || (tr.type === 'due' ? t.creditPurchase : t.transfer)}</p>
                  <p className="text-xs text-zinc-400">
                    {formatDate(tr.date)} • {tr.account_name}
                    {tr.type === 'due' && (
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase",
                        tr.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {tr.status === 'paid' ? t.paid : t.unpaid}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  tr.type === 'income' ? "text-emerald-600" : 
                  (tr.type === 'expense' || tr.type === 'due') ? "text-red-600" : "text-blue-600"
                )}>
                  {(tr.type === 'expense' || tr.type === 'due') ? "-" : tr.type === 'income' ? "+" : ""}{formatCurrency(tr.amount, currency)}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  {tr.type === 'due' && tr.status === 'unpaid' && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        api.updateTransaction(tr.id, { ...tr, status: 'paid' }).then(fetchData);
                      }}
                      className="p-1 text-emerald-600"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingTransaction(tr); }}
                    className="p-1 text-zinc-300 hover:text-emerald-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (window.confirm(t.confirmDelete)) {
                        api.deleteTransaction(tr.id).then(fetchData);
                      }
                    }}
                    className="p-1 text-zinc-300 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptText size={32} className="text-zinc-300" />
            </div>
            <p className="text-zinc-500 font-medium">{t.noTransactions}</p>
            <p className="text-zinc-400 text-sm">{t.tryAdjusting}</p>
          </div>
        )}
      </div>
      {/* Edit Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative"
            >
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{t.editTransaction}</h3>
                <button 
                  onClick={() => setEditingTransaction(null)}
                  className="p-2 hover:bg-black/5 rounded-full hidden sm:block"
                >
                  <X size={20} />
                </button>
              </div>
              <TransactionForm 
                currency={currency}
                language={language}
                transaction={editingTransaction}
                onClose={() => {
                  setEditingTransaction(null);
                  fetchData();
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
