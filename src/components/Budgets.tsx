import React, { useState, useEffect } from "react";
import { 
  PieChart, 
  Plus, 
  AlertCircle, 
  CheckCircle2,
  TrendingUp,
  Target
} from "lucide-react";
import { api } from "../services/api";
import { Budget, Category } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { translations, Language } from "../i18n/translations";

interface BudgetsProps {
  currency: string;
  language: Language;
}

export default function Budgets({ currency, language }: BudgetsProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const t = translations[language];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [b, c] = await Promise.all([
      api.getBudgets(),
      api.getCategories()
    ]);
    setBudgets(b);
    setCategories(c);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t.budgetManagement}</h3>
          <p className="text-zinc-500 dark:text-zinc-400">{t.setLimits}</p>
        </div>
        <button 
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={20} />
          {t.setBudget}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget) => (
          <BudgetCard 
            key={budget.id} 
            budget={budget} 
            currency={currency} 
            t={t} 
            onEdit={() => {
              setEditingBudget(budget);
              setIsModalOpen(true);
            }}
          />
        ))}
        {budgets.length === 0 && (
          <div className="col-span-full bg-white dark:bg-zinc-900 p-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center transition-colors duration-300">
            <div className="bg-zinc-50 dark:bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={32} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t.noBudgets}</p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm">{t.startSettingBudget}</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-8 relative transition-colors duration-300">
            <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
              {editingBudget ? t.editBudget : t.setNewBudget}
            </h3>
            <BudgetForm 
              onClose={() => { 
                setIsModalOpen(false); 
                setEditingBudget(null);
                fetchData(); 
              }} 
              categories={categories}
              budget={editingBudget}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetCard({ budget, currency, t, onEdit }: { budget: Budget, currency: string, t: any, onEdit: () => void }) {
  const percent = Math.min(Math.round((budget.spent / budget.amount) * 100), 100);
  const isOver = budget.spent > budget.amount;
  const isNear = percent >= 80 && !isOver;

  return (
    <div 
      onClick={onEdit}
      className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-6 transition-colors duration-300 cursor-pointer hover:shadow-md group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            <PieChart size={24} />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{budget.category_name || t.globalBudget}</h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">
              {budget.period === 'monthly' ? t.monthly : budget.period === 'weekly' ? t.weekly : t.yearly}
            </p>
          </div>
        </div>
        {isOver ? (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg text-xs font-bold">
            <AlertCircle size={14} />
            {t.overBudget}
          </div>
        ) : isNear ? (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg text-xs font-bold">
            <AlertCircle size={14} />
            {t.warning}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg text-xs font-bold">
            <CheckCircle2 size={14} />
            {t.onTrack}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">{t.progress}</span>
          <span className={cn(
            "font-bold",
            isOver ? "text-red-600 dark:text-red-400" : isNear ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
          )}>{percent}%</span>
        </div>
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              isOver ? "bg-red-500" : isNear ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase mb-1">{t.spent}</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(budget.spent || 0, currency)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase mb-1">{t.budget}</p>
          <p className="text-xl font-bold text-zinc-400 dark:text-zinc-600">{formatCurrency(budget.amount, currency)}</p>
        </div>
      </div>
    </div>
  );
}

function BudgetForm({ onClose, categories, t, budget }: { onClose: () => void, categories: Category[], t: any, budget?: Budget | null }) {
  const [categoryId, setCategoryId] = useState(budget?.category_id?.toString() || "");
  const [amount, setAmount] = useState(budget?.amount?.toString() || "");
  const [period, setPeriod] = useState(budget?.period || "monthly");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        category_id: categoryId ? parseInt(categoryId) : null,
        amount: parseFloat(amount),
        period
      };

      if (budget?.id) {
        await api.updateBudget(budget.id, data);
      } else {
        await api.addBudget(data);
      }
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to save budget");
    }
  };

  const handleDelete = async () => {
    if (budget?.id && window.confirm(t.confirmDeleteBudget)) {
      try {
        await api.deleteBudget(budget.id);
        onClose();
      } catch (error: any) {
        alert(error.message || "Failed to delete budget");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.category}</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
        >
          <option value="">{t.globalAll}</option>
          {categories.filter(c => c.type === 'expense').map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.budgetAmount}</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.period}</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
        >
          <option value="monthly">{t.monthly}</option>
          <option value="weekly">{t.weekly}</option>
          <option value="yearly">{t.yearly}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 border border-black/5 dark:border-white/5 rounded-xl font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          {t.cancel}
        </button>
        {budget?.id && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            {t.delete}
          </button>
        )}
        <button
          type="submit"
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
        >
          {budget?.id ? t.save : t.setBudget}
        </button>
      </div>
    </form>
  );
}
