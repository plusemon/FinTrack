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
  Bell,
  Sun,
  Moon
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const t = translations[language];

  useEffect(() => {
    fetchSummary();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

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
      if (settings.theme) {
        setTheme(settings.theme as "light" | "dark");
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

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      await api.updateSetting("theme", newTheme);
    } catch (error) {
      console.error("Failed to update theme setting:", error);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300",
      theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-[#F8F9FA] text-[#1A1A1A]"
    )}>
      {/* Header */}
      <header className={cn(
        "h-16 border-b flex items-center justify-between px-6 shrink-0 z-10 transition-colors duration-300",
        theme === "dark" ? "bg-zinc-900 border-white/5" : "bg-white border-black/5"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={18} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-emerald-600">
            FinTrack
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className={cn(
              "p-2 rounded-xl transition-colors",
              theme === "dark" ? "text-zinc-400 hover:text-zinc-200 hover:bg-white/5" : "text-zinc-400 hover:text-zinc-600 hover:bg-black/5"
            )}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className={cn(
            "p-2 relative transition-colors",
            theme === "dark" ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-400 hover:text-zinc-600"
          )}>
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-black/5 dark:border-white/5 overflow-hidden">
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
              {activeView === "dashboard" && <Dashboard summary={summary} onRefresh={fetchSummary} currency={currency} language={language} onNavigate={setActiveView} />}
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
                    className={cn(
                      "p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-3 transition-all",
                      theme === "dark" ? "bg-zinc-900 border-white/5 hover:bg-zinc-800" : "bg-white border-black/5 hover:bg-zinc-50"
                    )}
                  >
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Wallet size={24} /></div>
                    <span className="font-bold">{t.accounts}</span>
                  </button>
                  <button 
                    onClick={() => setActiveView("categories")}
                    className={cn(
                      "p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-3 transition-all",
                      theme === "dark" ? "bg-zinc-900 border-white/5 hover:bg-zinc-800" : "bg-white border-black/5 hover:bg-zinc-50"
                    )}
                  >
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl"><Tags size={24} /></div>
                    <span className="font-bold">{t.categories}</span>
                  </button>
                  <button 
                    onClick={() => setActiveView("settings")}
                    className={cn(
                      "p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-3 transition-all",
                      theme === "dark" ? "bg-zinc-900 border-white/5 hover:bg-zinc-800" : "bg-white border-black/5 hover:bg-zinc-50"
                    )}
                  >
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl"><Settings size={24} /></div>
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
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 border-t px-4 pb-safe pt-2 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-colors duration-300",
        theme === "dark" ? "bg-zinc-900 border-white/5" : "bg-white border-black/5"
      )}>
        <div className="max-w-md mx-auto flex items-center justify-between h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 transition-all",
                activeView === item.id ? "text-emerald-600" : "text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300"
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
              activeView === "more" ? "text-emerald-600" : "text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300"
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
            className={cn(
              "rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative transition-colors duration-300",
              theme === "dark" ? "bg-zinc-900" : "bg-white"
            )}
          >
            <div className={cn(
              "w-12 h-1.5 rounded-full mx-auto mb-6 sm:hidden",
              theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
            )} />
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
