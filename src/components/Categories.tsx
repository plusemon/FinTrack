import React, { useState, useEffect } from "react";
import { 
  Tags, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Folder,
  FileText,
  MoreVertical,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { api } from "../services/api";
import { Category } from "../types";
import { cn } from "../lib/utils";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const data = await api.getCategories();
    setCategories(data);
  };

  const rootCategories = categories.filter(c => !c.parent_id && c.type === activeTab);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Categories</h3>
          <p className="text-zinc-500">Organize your transactions with custom categories.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={20} />
          New Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="flex border-b border-black/5">
          <button
            onClick={() => setActiveTab("expense")}
            className={cn(
              "flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all",
              activeTab === "expense" ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30" : "text-zinc-400 hover:bg-zinc-50"
            )}
          >
            <TrendingDown size={18} />
            Expense Categories
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={cn(
              "flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all",
              activeTab === "income" ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30" : "text-zinc-400 hover:bg-zinc-50"
            )}
          >
            <TrendingUp size={18} />
            Income Categories
          </button>
        </div>

        <div className="p-6 space-y-2">
          {rootCategories.map(category => (
            <CategoryItem 
              key={category.id} 
              category={category} 
              allCategories={categories} 
            />
          ))}
          {rootCategories.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              No categories found for this type.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <h3 className="text-xl font-bold mb-6">New Category</h3>
            <CategoryForm 
              onClose={() => { setIsModalOpen(false); fetchCategories(); }} 
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryItem({ category, allCategories }: { category: Category, allCategories: Category[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const subCategories = allCategories.filter(c => c.parent_id === category.id);
  const hasSub = subCategories.length > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-all group">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1 rounded-lg hover:bg-zinc-100 transition-colors",
              !hasSub && "invisible"
            )}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
            <Folder size={18} />
          </div>
          <span className="font-semibold text-zinc-900">{category.name}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
            <Plus size={16} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
      
      {isOpen && hasSub && (
        <div className="pl-12 space-y-1 border-l-2 border-zinc-100 ml-6">
          {subCategories.map(sub => (
            <div key={sub.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${sub.color}15`, color: sub.color }}>
                  <FileText size={14} />
                </div>
                <span className="text-sm font-medium text-zinc-600">{sub.name}</span>
              </div>
              <button className="p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600">
                <MoreVertical size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryForm({ onClose, categories }: { onClose: () => void, categories: Category[] }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [parentId, setParentId] = useState("");
  const [color, setColor] = useState("#10b981");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addCategory({
      name,
      type,
      parent_id: parentId ? parseInt(parentId) : null,
      icon: "Folder",
      color
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Category Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries"
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Type</label>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                type === t ? "bg-white shadow-sm text-emerald-600" : "text-zinc-50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Parent Category (Optional)</label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full p-3 bg-zinc-50 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">None (Root Category)</option>
          {categories.filter(c => c.type === type && !c.parent_id).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase">Theme Color</label>
        <div className="flex gap-2">
          {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#1a1a1a"].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                color === c ? "border-zinc-900 scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
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
          Create
        </button>
      </div>
    </form>
  );
}
