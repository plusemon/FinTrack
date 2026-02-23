import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ReceiptText, 
  Wallet, 
  Tags, 
  PieChart, 
  MessageSquare, 
  Plus,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Settings,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "./lib/utils";
import { api } from "./services/api";
import { Summary, Transaction, Account, Category, Budget } from "./types";

// Components
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Accounts from "./components/Accounts";
import Categories from "./components/Categories";
import Budgets from "./components/Budgets";
import AIChat from "./components/AIChat";

type View = "dashboard" | "transactions" | "accounts" | "categories" | "budgets" | "ai-chat" | "more";

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "transactions", label: "History", icon: ReceiptText },
    { id: "budgets", label: "Budgets", icon: PieChart },
    { id: "ai-chat", label: "AI", icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={18} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-emerald-600">
            FinTrack
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 text-zinc-400 hover:text-zinc-600 relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-200 border border-black/5 overflow-hidden">
            <img src="https://picsum.photos/seed/user/100/100" alt="User" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <header className="mb-6">
            <h2 className="text-2xl font-bold capitalize">
              {activeView === "more" ? "Menu" : activeView.replace("-", " ")}
            </h2>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === "dashboard" && <Dashboard summary={summary} onRefresh={fetchSummary} />}
              {activeView === "transactions" && <Transactions />}
              {activeView === "accounts" && <Accounts />}
              {activeView === "categories" && <Categories />}
              {activeView === "budgets" && <Budgets />}
              {activeView === "ai-chat" && <AIChat />}
              {activeView === "more" && (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveView("accounts")}
                    className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-3 hover:bg-zinc-50 transition-all"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Wallet size={24} /></div>
                    <span className="font-bold">Accounts</span>
                  </button>
                  <button 
                    onClick={() => setActiveView("categories")}
                    className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-3 hover:bg-zinc-50 transition-all"
                  >
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Tags size={24} /></div>
                    <span className="font-bold">Categories</span>
                  </button>
                  <button className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-3 hover:bg-zinc-50 transition-all opacity-50">
                    <div className="p-3 bg-zinc-50 text-zinc-600 rounded-xl"><Settings size={24} /></div>
                    <span className="font-bold">Settings</span>
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-4 pb-safe pt-2 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto flex items-center justify-between h-16">
          {navItems.slice(0, 2).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 transition-all",
                activeView === item.id ? "text-emerald-600" : "text-zinc-400"
              )}
            >
              <item.icon size={22} className={activeView === item.id ? "scale-110" : ""} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}

          {/* Quick Add FAB */}
          <div className="relative -top-6 px-2">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-90"
            >
              <Plus size={28} />
            </button>
          </div>

          {navItems.slice(2).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 transition-all",
                activeView === item.id ? "text-emerald-600" : "text-zinc-400"
              )}
            >
              <item.icon size={22} className={activeView === item.id ? "scale-110" : ""} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}

          {/* More Menu Trigger */}
          <button 
            onClick={() => setActiveView("more")}
            className={cn(
              "flex flex-col items-center justify-center flex-1 gap-1 transition-all",
              activeView === "more" ? "text-emerald-600" : "text-zinc-400"
            )}
          >
            <Menu size={22} className={activeView === "more" ? "scale-110" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-wider">More</span>
          </button>
        </div>
      </nav>

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative"
          >
            <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6 sm:hidden" />
            <button 
              onClick={() => setIsQuickAddOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full hidden sm:block"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">Quick Transaction</h3>
            <QuickAddForm 
              onClose={() => {
                setIsQuickAddOpen(false);
                fetchSummary();
              }} 
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function QuickAddForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getAccounts().then(setAccounts);
    api.getCategories().then(setCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId || (type !== 'transfer' && !categoryId)) return;

    await api.addTransaction({
      type,
      amount: parseFloat(amount),
      date,
      category_id: type === 'transfer' ? null : parseInt(categoryId),
      account_id: parseInt(accountId),
      to_account_id: type === 'transfer' ? parseInt(toAccountId) : null,
      notes
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex bg-zinc-100 p-1 rounded-xl">
        {(["expense", "income", "transfer"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all",
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

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase">Account</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          required
        >
          <option value="">Select Account</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>)}
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
            {categories.filter(c => c.type === type).map(c => (
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

      <button
        type="submit"
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md"
      >
        Save Transaction
      </button>
    </form>
  );
}
