import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = "danger"
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transition-colors duration-300"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${
                variant === "danger" ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                variant === "warning" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
                "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              }`}>
                <AlertTriangle size={24} />
              </div>
              <button 
                onClick={onCancel}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{title}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              {message}
            </p>
          </div>
          
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-zinc-200 dark:border-white/5 rounded-xl font-bold text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                variant === "danger" ? "bg-red-600 hover:bg-red-700" :
                variant === "warning" ? "bg-amber-600 hover:bg-amber-700" :
                "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
