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
  Moon,
  Shield,
  Fingerprint
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

import { useAuth } from "./lib/AuthContext";

type View = "dashboard" | "transactions" | "accounts" | "categories" | "budgets" | "ai-chat" | "more" | "settings";

export default function App() {
  const { user, loading, signInWithGoogle, logOut } = useAuth();
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currency, setCurrency] = useState("BDT");
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (user) {
      fetchSummary();
      fetchSettings();
      loadSecuritySettings();
      api.initializeDefaultData();
    }
  }, [user]);

  const loadSecuritySettings = async () => {
    try {
      const settings = await api.getSecuritySettings();
      setPinEnabled(settings.pinEnabled);
      setBiometricEnabled(settings.biometricEnabled);
      if (!settings.pinEnabled) {
        setIsPinVerified(true);
      }
    } catch (error) {
      console.error("Failed to load security settings:", error);
      setIsPinVerified(true);
    }
  };

  const handlePinVerify = async () => {
    if (pinInput.length < 4) {
      setPinError(t.pinIncorrect || "Incorrect PIN");
      return;
    }
    setIsVerifyingPin(true);
    setPinError("");
    try {
      const isValid = await api.verifyPin(pinInput);
      if (isValid) {
        setIsPinVerified(true);
        setPinInput("");
      } else {
        setPinError(t.pinIncorrect || "Incorrect PIN");
      }
    } catch (error) {
      console.error("Failed to verify PIN:", error);
      setPinError("Failed to verify PIN");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        const credential = await (window.PublicKeyCredential as any).get({
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          userVerification: "required",
        });
        if (credential) {
          setIsPinVerified(true);
        }
      } catch (error) {
        console.error("Biometric auth failed:", error);
      }
    }
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const fetchSummary = async () => {
    if(!user) return;
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  const fetchSettings = async () => {
    if(!user) return;
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
    if(user) {
      try {
        await api.updateSetting("theme", newTheme);
      } catch (error) {
        console.error("Failed to update theme setting:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "flex flex-col h-screen font-sans items-center justify-center transition-colors duration-300",
        theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-[#F8F9FA] text-[#1A1A1A]"
      )}>
        <TrendingUp size={48} className="text-emerald-600 animate-pulse mb-4" />
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn(
        "flex flex-col h-screen font-sans items-center justify-center p-6 text-center transition-colors duration-300",
        theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-[#F8F9FA] text-[#1A1A1A]"
      )}>
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-600/20">
          <TrendingUp size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">FinTrack AI</h1>
        <p className="text-zinc-500 mb-8 max-w-sm">
          Track your finances, analyze your spending, and achieve your financial goals.
        </p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all font-bold group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-zinc-900 dark:text-zinc-100">Continue with Google</span>
        </button>
      </div>
    );
  }

  if (pinEnabled && !isPinVerified) {
    return (
      <div className={cn(
        "flex flex-col h-screen font-sans items-center justify-center p-6 text-center transition-colors duration-300",
        theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-[#F8F9FA] text-[#1A1A1A]"
      )}>
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-600/20">
          <Shield size={32} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{t.enterYourPin || "Enter your PIN"}</h1>
        <p className="text-zinc-500 mb-8 max-w-sm">
          {t.enterPin || "Enter your PIN to unlock FinTrack"}
        </p>
        
        <div className="w-full max-w-xs space-y-4">
          <input
            type="password"
            maxLength={6}
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value.replace(/\D/g, ''));
              setPinError("");
            }}
            onKeyDown={(e) => e.key === 'Enter' && handlePinVerify()}
            className="w-full px-6 py-4 text-center text-2xl tracking-[0.5em] bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none focus:border-emerald-500 transition-colors"
            placeholder="••••"
            autoFocus
          />
          
          {pinError && (
            <p className="text-red-500 text-sm">{pinError}</p>
          )}
          
          <button
            onClick={handlePinVerify}
            disabled={isVerifyingPin || pinInput.length < 4}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isVerifyingPin ? "..." : (t.unlock || "Unlock")}
          </button>
          
          {biometricEnabled && (
            <button
              onClick={handleBiometricAuth}
              className="w-full py-3 flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              <Fingerprint size={24} />
              <span>{t.biometricPrompt || "Use biometric"}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300",
      theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-[#F8F9FA] text-[#1A1A1A]"
    )}>
      {/* Header */}
      <header className={cn(
        "h-16 border-b flex items-center justify-between px-6 shrink-0 z-10 transition-colors duration-300",
        theme === "dark" ? "bg-zinc-900 border-white/5" : "bg-white border-zinc-200"
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
          <button 
            onClick={() => setActiveView("settings")}
            className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all focus:outline-none"
          >
            <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
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
                      theme === "dark" ? "bg-zinc-900 border-white/5 hover:bg-zinc-800" : "bg-white border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Wallet size={24} /></div>
                    <span className="font-bold">{t.accounts}</span>
                  </button>
                  <button 
                    onClick={() => setActiveView("categories")}
                    className={cn(
                      "p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-3 transition-all",
                      theme === "dark" ? "bg-zinc-900 border-white/5 hover:bg-zinc-800" : "bg-white border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl"><Tags size={24} /></div>
                    <span className="font-bold">{t.categories}</span>
                  </button>
                  <button 
                    onClick={() => setActiveView("settings")}
                    className={cn(
                      "p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-3 transition-all",
                      theme === "dark" ? "bg-zinc-900 border-white/5 hover:bg-zinc-800" : "bg-white border-zinc-200 hover:bg-zinc-50"
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
        theme === "dark" ? "bg-zinc-900 border-white/5" : "bg-white border-zinc-200"
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
