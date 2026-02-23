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
import { translations, Language } from "./i18n/translations";

// Components
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Accounts from "./components/Accounts";
import Categories from "./components/Categories";
import Budgets from "./components/Budgets";
import AIChat from "./components/AIChat";
import SettingsView from "./components/Settings";
import TransactionForm from "./components/TransactionForm";

type View = "dashboard" | "transactions" | "accounts" | "categories" | "budgets" | "ai-chat" | "more" | "settings";

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currency, setCurrency] = useState("BDT");
  const [language, setLanguage] = useState<Language>("en");

  const t = translations[language];

  useEffect(() => {
    fetchSummary();
    fetchSettings();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const settings = await api.getSettings();
      if (settings.currency) {
        setCurrency(settings.currency);
      }
      if (settings.language) {
        setLanguage(settings.language as Language);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const navItems = [
    { id: "dashboard", label: t.home, icon: LayoutDashboard },
    { id: "transactions", label: t.history, icon: ReceiptText },
    { id: "budgets", label: t.budgets, icon: PieChart },
    { id: "ai-chat", label: t.ai, icon: MessageSquare },
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
              {activeView === "more" ? t.menu : t[activeView as keyof typeof t] || activeView.replace("-", " ")}
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
              {activeView === "dashboard" && <Dashboard summary={summary} onRefresh={fetchSummary} currency={currency} language={language} />}
              {activeView === "transactions" && <Transactions currency={currency} language={language} />}
              {activeView === "accounts" && <Accounts currency={currency} language={language} />}
              {activeView === "categories" && <Categories language={language} />}
              {activeView === "budgets" && <Budgets currency={currency} language={language} />}
              {activeView === "ai-chat" && <AIChat language={language} />}
              {activeView === "settings" && <SettingsView currentCurrency={currency} onCurrencyChange={setCurrency} currentLanguage={language} onLanguageChange={setLanguage} />}
              {activeView === "more" && (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveView("accounts")}
                    className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-3 hover:bg-zinc-50 transition-all"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Wallet size={24} /></div>
                    <span className="font-bold">{t.accounts}</span>
                  </button>
                  <button 
                    onClick={() => setActiveView("categories")}
                    className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-3 hover:bg-zinc-50 transition-all"
                  >
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Tags size={24} /></div>
                    <span className="font-bold">{t.categories}</span>
                  </button>
                  <button 
                    onClick={() => setActiveView("settings")}
                    className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-3 hover:bg-zinc-50 transition-all"
                  >
                    <div className="p-3 bg-zinc-50 text-zinc-600 rounded-xl"><Settings size={24} /></div>
                    <span className="font-bold">{t.settings}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Quick Add Button */}
      <button
        onClick={() => setIsQuickAddOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-90 z-40"
      >
        <Plus size={28} />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-4 pb-safe pt-2 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto flex items-center justify-between h-16">
          {navItems.map((item) => (
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
            <span className="text-[10px] font-bold uppercase tracking-wider">{t.more}</span>
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
            <h3 className="text-xl font-bold mb-6">{t.quickTransaction}</h3>
            <TransactionForm 
              currency={currency}
              language={language}
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
