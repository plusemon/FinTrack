import React, { useState, useEffect } from "react";
import { Globe, CreditCard, Bell, Shield, Info, Languages, LogOut, Trash2, X, Fingerprint } from "lucide-react";
import { api } from "../services/api";
import { translations, Language } from "../i18n/translations";
import { useAuth } from "../lib/AuthContext";
import { deleteUserAccount, db } from "../lib/firebase";
import { doc } from "firebase/firestore";
import ConfirmDialog from "./ui/ConfirmDialog";
import Toast, { ToastType } from "./ui/Toast";

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (val: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

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
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const { user, logOut } = useAuth();

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(true);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'change' | 'remove'>('set');
  const [pinInput, setPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isPinLoading, setIsPinLoading] = useState(false);

  const t = translations[language];

  useEffect(() => {
    loadNotificationSettings();
    loadSecuritySettings();
    checkBiometricSupport();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await api.getNotificationSettings();
      setDailyReminderEnabled(settings.dailyReminderEnabled);
      setReminderTime(settings.reminderTime);
      setBudgetAlertsEnabled(settings.budgetAlertsEnabled);
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const settings = await api.getSecuritySettings();
      setPinEnabled(settings.pinEnabled);
      setBiometricEnabled(settings.biometricEnabled);
    } catch (error) {
      console.error("Failed to load security settings:", error);
    }
  };

  const checkBiometricSupport = async () => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        const available = await (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable?.();
        setBiometricSupported(available);
      } catch {
        setBiometricSupported(false);
      }
    } else {
      setBiometricSupported(false);
    }
  };

  const handleDailyReminderToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setToast({ message: t.notificationPermissionDenied || "Notification permission denied", type: "error" });
        return;
      }
    }
    setDailyReminderEnabled(enabled);
    setIsSaving(true);
    try {
      await api.updateNotificationSettings({ dailyReminderEnabled: enabled });
    } catch (error) {
      console.error("Failed to update daily reminder setting:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReminderTimeChange = async (time: string) => {
    setReminderTime(time);
    setIsSaving(true);
    try {
      await api.updateNotificationSettings({ reminderTime: time });
    } catch (error) {
      console.error("Failed to update reminder time:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBudgetAlertsToggle = async (enabled: boolean) => {
    setBudgetAlertsEnabled(enabled);
    setIsSaving(true);
    try {
      await api.updateNotificationSettings({ budgetAlertsEnabled: enabled });
    } catch (error) {
      console.error("Failed to update budget alerts setting:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled && !biometricSupported) {
      setToast({ message: t.biometricNotSupported || "Biometric not supported on this device", type: "error" });
      return;
    }
    setBiometricEnabled(enabled);
    setIsSaving(true);
    try {
      await api.updateSecuritySettings({ biometricEnabled: enabled });
      setToast({ message: enabled ? (t.biometricEnabled || "Biometric enabled") : (t.biometricDisabled || "Biometric disabled"), type: "success" });
    } catch (error) {
      console.error("Failed to update biometric setting:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pinMode === 'remove') {
      setIsPinLoading(true);
      try {
        const docRef = doc(db, `users/${user?.uid}/settings`, 'profile');
        await import("firebase/firestore").then(f => f.getDoc(docRef)).then(async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            await import("firebase/firestore").then(f => f.setDoc(docRef, { ...data, pinHash: null }, { merge: true }));
          }
        });
        setPinEnabled(false);
        setShowPinModal(false);
        setToast({ message: t.pinRemoved || "PIN removed", type: "success" });
      } catch (error) {
        console.error("Failed to remove PIN:", error);
        setPinError("Failed to remove PIN");
      } finally {
        setIsPinLoading(false);
      }
      return;
    }

    if (pinInput.length < 4 || pinInput.length > 6) {
      setPinError("PIN must be 4-6 digits");
      return;
    }
    if (pinInput !== confirmPinInput) {
      setPinError(t.pinMismatch || "PINs do not match");
      return;
    }

    setIsPinLoading(true);
    try {
      const pinHash = await api.hashPin(pinInput);
      await api.updateSecuritySettings({ pinHash });
      setPinEnabled(true);
      setShowPinModal(false);
      setPinInput("");
      setConfirmPinInput("");
      setToast({ message: t.pinSet || "PIN set successfully", type: "success" });
    } catch (error) {
      console.error("Failed to set PIN:", error);
      setPinError("Failed to set PIN");
    } finally {
      setIsPinLoading(false);
    }
  };

  const openPinModal = (mode: 'set' | 'change' | 'remove') => {
    setPinMode(mode);
    setPinInput("");
    setConfirmPinInput("");
    setPinError("");
    setShowPinModal(true);
  };

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

  const handleDeleteAccount = async () => {
    setIsResetting(true);
    try {
      await api.resetAllData();
      await deleteUserAccount();
      setToast({ message: t.accountDeleted || "Account deleted successfully", type: "success" });
    } catch (error: any) {
      setToast({ message: error.message || "Failed to delete account", type: "error" });
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Globe size={20} className="text-emerald-600 dark:text-emerald-400" />
            {t.regionalSettings}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">{t.currency}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose your preferred currency for display</p>
            </div>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              disabled={isSaving}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/5">
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">{t.language}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose your preferred language</p>
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              disabled={isSaving}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bangla)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Bell size={20} className="text-emerald-600 dark:text-emerald-400" />
            {t.notifications}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">{t.dailyReminders}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Get notified to log your daily transactions</p>
            </div>
            <Toggle enabled={dailyReminderEnabled} onChange={handleDailyReminderToggle} disabled={isSaving} />
          </div>
          {dailyReminderEnabled && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{t.reminderTime}:</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => handleReminderTimeChange(e.target.value)}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">{t.budgetAlerts}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Receive alerts when you exceed 80% of your budget</p>
            </div>
            <Toggle enabled={budgetAlertsEnabled} onChange={handleBudgetAlertsToggle} disabled={isSaving} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />
            {t.security}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <button 
            onClick={() => openPinModal(pinEnabled ? 'change' : 'set')}
            className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{pinEnabled ? t.changePin : t.setPin}</span>
            <Info size={16} className="text-zinc-400 dark:text-zinc-500" />
          </button>
          {pinEnabled && (
            <button 
              onClick={() => openPinModal('remove')}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <span className="font-bold text-red-600 dark:text-red-400">{t.removePin}</span>
              <Info size={16} className="text-red-400 dark:text-red-500" />
            </button>
          )}
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Fingerprint size={20} className="text-zinc-500 dark:text-zinc-400" />
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{t.biometric}</p>
                {!biometricSupported && <p className="text-xs text-red-500">{t.biometricNotSupported}</p>}
              </div>
            </div>
            <Toggle enabled={biometricEnabled} onChange={handleBiometricToggle} disabled={!biometricSupported || isSaving} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-red-200 dark:border-red-900/30">
          <h3 className="text-lg font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 size={20} />
            {t.dangerZone || "Danger Zone"}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            {t.deleteAccountWarning || "This will permanently delete your account and all associated data."}
          </p>
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-colors"
          >
            <Trash2 size={20} />
            {t.deleteAccount || "Delete Account"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <span className="w-8 h-8 rounded-full overflow-hidden inline-block mr-2">
              <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </span>
            Account
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="mb-4">
            <p className="font-bold text-zinc-900 dark:text-zinc-100">{user?.displayName}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
          </div>
          <button 
            onClick={logOut}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 font-bold transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {pinMode === 'set' ? t.setPin : pinMode === 'change' ? t.changePin : t.removePin}
              </h3>
              <button onClick={() => setShowPinModal(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            {pinMode === 'remove' ? (
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">{t.confirmRemovePin}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPinModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handlePinSubmit}
                    disabled={isPinLoading}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700"
                  >
                    {isPinLoading ? "..." : t.delete}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {pinMode === 'change' ? t.enterPin : t.setPin}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="****"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.confirmPin}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="****"
                  />
                </div>
                {pinError && <p className="text-red-500 text-sm">{pinError}</p>}
                <button
                  onClick={handlePinSubmit}
                  disabled={isPinLoading || pinInput.length < 4}
                  className="w-full py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPinLoading ? "..." : t.save}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={showResetConfirm}
        title={t.deleteAccount || "Delete Account"}
        message={t.confirmDeleteAccount || "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."}
        confirmText={isResetting ? "..." : t.delete}
        cancelText={t.cancel}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowResetConfirm(false)}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
