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

interface BudgetsProps {
  currency: string;
}

export default function Budgets({ currency }: BudgetsProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <h3 className="text-2xl font-bold tracking-tight">Budget Management</h3>
          <p className="text-zinc-500">Set spending limits and track your progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={20} />
          Set Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} currency={currency} />
        ))}
        {budgets.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-zinc-200 text-center">
            <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={32} className="text-zinc-300" />
            </div>
            <p className="text-zinc-500 font-medium">No budgets set yet</p>
            <p className="text-zinc-400 text-sm">Start by setting a monthly limit for a category</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <h3 className="text-xl font-bold mb-6">Set New Budget</h3>
            <BudgetForm 
              onClose={() => { setIsModalOpen(false); fetchData(); }} 
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetCard({ budget, currency }: { budget: Budget, currency: string }) {
  const percent = Math.min(Math.round((budget.spent / budget.amount) * 100), 100);
  const isOver = budget.spent > budget.amount;
  const isNear = percent >= 80 && !isOver;

  return (
    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-50 text-zinc-600">
            <PieChart size={24} />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900">{budget.category_name || "Global Budget"}</h4>
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">{budget.period}</p>
          </div>
        </div>
        {isOver ? (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold">
            <AlertCircle size={14} />
            Over Budget
          </div>
        ) : isNear ? (
          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs font-bold">
            <AlertCircle size={14} />
            Warning
          </div>
        ) : (
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
            <CheckCircle2 size={14} />
            On Track
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 font-medium">Progress</span>
          <span className={cn(
            "font-bold",
            isOver ? "text-red-600" : isNear ? "text-amber-600" : "text-emerald-600"
          )}>{percent}%</span>
        </div>
        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
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
          <p className="text-xs text-zinc-400 font-bold uppercase mb-1">Spent</p>
          <p className="text-xl font-bold">{formatCurrency(budget.spent || 0, currency)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400 font-bold uppercase mb-1">Budget</p>
          <p className="text-xl font-bold text-zinc-400">{formatCurrency(budget.amount, currency)}</p>
        </div>
      </div>
    </div>
  );
}

function BudgetForm({ onClose, categories }: { onClose: () => void, categories: Category[] }) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addBudget({
      category_id: categoryId ? parseInt(categoryId) : null,
      amount: parseFloat(amount),
      period
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Global (All Categories)</option>
          {categories.filter(c => c.type === 'expense').map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Budget Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Period</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 border border-black/5 rounded-xl font-bold text-zinc-500 hover:bg-zinc-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
        >
          Set Budget
        </button>
      </div>
    </form>
  );
}
