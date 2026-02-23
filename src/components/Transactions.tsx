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
  ReceiptText
} from "lucide-react";
import { api } from "../services/api";
import { Transaction, Account, Category } from "../types";
import { formatCurrency, formatDate, cn } from "../lib/utils";

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    accountId: "",
    categoryId: "",
    startDate: "",
    endDate: ""
  });

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
              placeholder="Search transactions..."
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
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors font-medium">
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            className="p-2 bg-zinc-50 border border-black/5 rounded-lg text-sm outline-none"
          >
            <option value="">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="p-2 bg-zinc-50 border border-black/5 rounded-lg text-sm outline-none"
          >
            <option value="">All Categories</option>
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
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">{formatDate(t.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        t.type === 'income' ? "bg-emerald-50 text-emerald-600" : 
                        t.type === 'expense' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {t.type === 'income' ? <ArrowDownLeft size={14} /> : 
                         t.type === 'expense' ? <ArrowUpRight size={14} /> : <ArrowRightLeft size={14} />}
                      </div>
                      <span className="font-medium text-zinc-900">{t.category_name || "Transfer"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">{t.account_name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{t.notes || "-"}</td>
                  <td className={cn(
                    "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                    t.type === 'income' ? "text-emerald-600" : t.type === 'expense' ? "text-red-600" : "text-blue-600"
                  )}>
                    {t.type === 'expense' ? "-" : t.type === 'income' ? "+" : ""}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          {filteredTransactions.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between active:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  t.type === 'income' ? "bg-emerald-50 text-emerald-600" : 
                  t.type === 'expense' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                )}>
                  {t.type === 'income' ? <ArrowDownLeft size={20} /> : 
                   t.type === 'expense' ? <ArrowUpRight size={20} /> : <ArrowRightLeft size={20} />}
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{t.category_name || "Transfer"}</p>
                  <p className="text-xs text-zinc-400">{formatDate(t.date)} • {t.account_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  t.type === 'income' ? "text-emerald-600" : t.type === 'expense' ? "text-red-600" : "text-blue-600"
                )}>
                  {t.type === 'expense' ? "-" : t.type === 'income' ? "+" : ""}{formatCurrency(t.amount)}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <button className="p-1 text-zinc-300"><Edit2 size={14} /></button>
                  <button className="p-1 text-zinc-300"><Trash2 size={14} /></button>
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
            <p className="text-zinc-500 font-medium">No transactions found</p>
            <p className="text-zinc-400 text-sm">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
