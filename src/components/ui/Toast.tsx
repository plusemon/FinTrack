import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    warning: <AlertCircle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const bgColors = {
    success: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30",
    error: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md ${bgColors[type]} transition-colors duration-300`}
    >
      {icons[type]}
      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{message}</p>
      <button 
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-zinc-400"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
