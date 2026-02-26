import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Clock, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  ReceiptText,
  ChevronDown,
  Calendar,
  Tag,
  CreditCard
} from "lucide-react";
import { Transaction, Category, Account } from "../types";
import { api } from "../services/api";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import { translations, Language } from "../i18n/translations";
import TransactionDetails from "./TransactionDetails";
import TransactionForm from "./TransactionForm";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

interface TransactionsProps {
  currency: string;
  language: Language;
}

export default function Transactions({ currency, language }: TransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const t = translations[language];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [tr, cat, acc] = await Promise.all([
      api.getTransactions(),
      api.getCategories(),
      api.getAccounts()
    ]);
    setTransactions(tr);
    setCategories(cat);
    setAccounts(acc);
  };

  const filteredTransactions = transactions.filter(tr => {
    const matchesSearch = (tr.notes?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (tr.category_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || tr.type === filterType;
    const matchesCategory = filterCategory === "all" || tr.category_id?.toString() === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t.transactions}</h3>
          <p className="text-zinc-500 dark:text-zinc-400">{t.viewAndManageTransactions}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder={t.searchTransactions}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all"
            >
              <option value="all">{t.allTypes}</option>
              <option value="income">{t.income}</option>
              <option value="expense">{t.expense}</option>
              <option value="transfer">{t.transfer}</option>
              <option value="due">{t.due}</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all"
            >
              <option value="all">{t.allCategories}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden transition-colors duration-300">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-black/5 dark:border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.category}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.account}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t.notes}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">{t.amount}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredTransactions.map((tr) => (
                <tr 
                  key={tr.id} 
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                  onClick={() => setSelectedTransaction(tr)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">{formatDate(tr.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tr.type === 'income' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : 
                        tr.type === 'expense' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : 
                        tr.type === 'due' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      )}>
                        {tr.type === 'income' ? <ArrowDownLeft size={14} /> : 
                         tr.type === 'expense' ? <ArrowUpRight size={14} /> : 
                         tr.type === 'due' ? <Clock size={14} /> : <ArrowRightLeft size={14} />}
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{tr.category_name || (tr.type === 'due' ? t.creditPurchase : t.transfer)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                    {tr.account_name}
                    {tr.type === 'due' && (
                      <span className={cn(
                        "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        tr.status === 'paid' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      )}>
                        {tr.status === 'paid' ? t.paid : t.unpaid}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-500 max-w-xs truncate">{tr.notes || "-"}</td>
                  <td className={cn(
                    "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                    tr.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : 
                    (tr.type === 'expense' || tr.type === 'due') ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
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
                          className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title={t.markAsPaid}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingTransaction(tr); }}
                        className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
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
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
        <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
          {filteredTransactions.map((tr) => (
            <div 
              key={tr.id} 
              className="p-4 flex items-center justify-between active:bg-zinc-50 dark:active:bg-zinc-800 transition-colors cursor-pointer"
              onClick={() => setSelectedTransaction(tr)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  tr.type === 'income' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : 
                  tr.type === 'expense' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : 
                  tr.type === 'due' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}>
                  {tr.type === 'income' ? <ArrowDownLeft size={20} /> : 
                   tr.type === 'expense' ? <ArrowUpRight size={20} /> : 
                   tr.type === 'due' ? <Clock size={20} /> : <ArrowRightLeft size={20} />}
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{tr.category_name || (tr.type === 'due' ? t.creditPurchase : t.transfer)}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatDate(tr.date)} • {tr.account_name}
                    {tr.type === 'due' && (
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase",
                        tr.status === 'paid' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
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
                  tr.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : 
                  (tr.type === 'expense' || tr.type === 'due') ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
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
                      className="p-1 text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingTransaction(tr); }}
                    className="p-1 text-zinc-300 dark:text-zinc-600 hover:text-emerald-600 dark:hover:text-emerald-400"
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
                    className="p-1 text-zinc-300 dark:text-zinc-600 hover:text-red-600 dark:hover:text-red-400"
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
            <div className="bg-zinc-50 dark:bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptText size={32} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t.noTransactions}</p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm">{t.tryAdjusting}</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <TransactionDetails 
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onEdit={(tr) => {
          setEditingTransaction(tr);
          setSelectedTransaction(null);
        }}
        onDelete={(id) => {
          if (window.confirm(t.confirmDelete)) {
            api.deleteTransaction(id).then(() => {
              setSelectedTransaction(null);
              fetchData();
            });
          }
        }}
        currency={currency}
        language={language}
      />

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative transition-colors duration-300"
            >
              <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t.editTransaction}</h3>
                <button 
                  onClick={() => setEditingTransaction(null)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hidden sm:block"
                >
                  <X size={20} className="text-zinc-500" />
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
