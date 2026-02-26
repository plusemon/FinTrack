import React from "react";
import { 
  X, 
  Edit2, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction } from "../types";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import { translations, Language } from "../i18n/translations";

interface TransactionDetailsProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tr: Transaction) => void;
  onDelete: (id: number) => void;
  currency: string;
  language: Language;
}

export default function TransactionDetails({ 
  transaction, 
  onClose, 
  onEdit, 
  onDelete, 
  currency, 
  language 
}: TransactionDetailsProps) {
  const t = translations[language];

  if (!transaction) return null;

  return (
    <AnimatePresence>
      {transaction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative transition-colors duration-300"
          >
            <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t.transactionDetails}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
              >
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center py-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-1">{t.amount}</p>
                <p className={cn(
                  "text-4xl font-black tracking-tight",
                  transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : 
                  (transaction.type === 'expense' || transaction.type === 'due') ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                )}>
                  {(transaction.type === 'expense' || transaction.type === 'due') ? "-" : transaction.type === 'income' ? "+" : ""}{formatCurrency(transaction.amount, currency)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t.date}</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(transaction.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t.category}</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{transaction.category_name || (transaction.type === 'due' ? t.creditPurchase : t.transfer)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t.account}</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{transaction.account_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t.status}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      transaction.status === 'paid' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    )}>
                      {transaction.status === 'paid' ? t.paid : t.unpaid}
                    </span>
                  </div>
                </div>
                {transaction.type === 'due' && transaction.due_date && (
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t.dueDate}</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(transaction.due_date)}</p>
                  </div>
                )}
                {transaction.notes && (
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t.notes}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">{transaction.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-black/5 dark:border-white/5">
                <button
                  onClick={() => onEdit(transaction)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <Edit2 size={18} />
                  {t.editTransaction}
                </button>
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  <Trash2 size={18} />
                  {t.delete}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
