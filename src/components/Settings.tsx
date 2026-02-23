import React, { useState, useEffect } from "react";
import { Globe, CreditCard, Bell, Shield, Info, Languages } from "lucide-react";
import { api } from "../services/api";
import { translations, Language } from "../i18n/translations";

interface SettingsProps {
  onCurrencyChange: (currency: string) => void;
  currentCurrency: string;
  onLanguageChange: (language: Language) => void;
  currentLanguage: Language;
}

export default function Settings({ onCurrencyChange, currentCurrency, onLanguageChange, currentLanguage }: SettingsProps) {
  const [currency, setCurrency] = useState(currentCurrency);
  const [language, setLanguage] = useState(currentLanguage);
  const [isSaving, setIsSaving] = useState(false);

  const t = translations[language];

  const currencies = [
    { code: "BDT", name: "Bangladeshi Taka (TK)", symbol: "৳" },
    { code: "USD", name: "US Dollar ($)", symbol: "$" },
    { code: "EUR", name: "Euro (€)", symbol: "€" },
    { code: "GBP", name: "British Pound (£)", symbol: "£" },
    { code: "INR", name: "Indian Rupee (₹)", symbol: "₹" },
  ];

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    setIsSaving(true);
    try {
      await api.updateSetting("currency", newCurrency);
      onCurrencyChange(newCurrency);
    } catch (error) {
      console.error("Failed to update currency:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    setIsSaving(true);
    try {
      await api.updateSetting("language", newLang);
      onLanguageChange(newLang);
    } catch (error) {
      console.error("Failed to update language:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe size={20} className="text-emerald-600" />
            {t.regionalSettings}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-zinc-900">{t.currency}</p>
              <p className="text-sm text-zinc-500">Choose your preferred currency for display</p>
            </div>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              disabled={isSaving}
              className="bg-zinc-50 border border-black/5 rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-black/5">
            <div>
              <p className="font-bold text-zinc-900">{t.language}</p>
              <p className="text-sm text-zinc-500">Choose your preferred language</p>
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              disabled={isSaving}
              className="bg-zinc-50 border border-black/5 rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bangla)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bell size={20} className="text-emerald-600" />
            {t.notifications}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between opacity-50">
            <div>
              <p className="font-bold text-zinc-900">{t.dailyReminders}</p>
              <p className="text-sm text-zinc-500">Get notified to log your daily transactions</p>
            </div>
            <div className="w-12 h-6 bg-zinc-200 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between opacity-50">
            <div>
              <p className="font-bold text-zinc-900">{t.budgetAlerts}</p>
              <p className="text-sm text-zinc-500">Receive alerts when you exceed 80% of your budget</p>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield size={20} className="text-emerald-600" />
            {t.security}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
            <span className="font-bold text-zinc-900">{t.changePin}</span>
            <Info size={16} className="text-zinc-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
            <span className="font-bold text-zinc-900">{t.biometric}</span>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
