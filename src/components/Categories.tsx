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
import { translations, Language } from "../i18n/translations";

interface CategoriesProps {
  language: Language;
}

export default function Categories({ language }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const t = translations[language];

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
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t.categories}</h3>
          <p className="text-zinc-500 dark:text-zinc-400">{t.organizeCategories}</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={20} />
          {t.newCategory}
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="flex border-b border-black/5 dark:border-white/5">
          <button
            onClick={() => setActiveTab("expense")}
            className={cn(
              "flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all",
              activeTab === "expense" ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10" : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
          >
            <TrendingDown size={18} />
            {t.expenseCategories}
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={cn(
              "flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all",
              activeTab === "income" ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10" : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
          >
            <TrendingUp size={18} />
            {t.incomeCategories}
          </button>
        </div>

        <div className="p-6 space-y-2">
          {rootCategories.map(category => (
            <CategoryItem 
              key={category.id} 
              category={category} 
              allCategories={categories} 
              onEdit={(c) => {
                setEditingCategory(c);
                setIsModalOpen(true);
              }}
              onAddSub={() => {
                setEditingCategory({ parent_id: category.id, type: category.type } as Category);
                setIsModalOpen(true);
              }}
            />
          ))}
          {rootCategories.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              {t.noCategoriesFound}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-8 relative transition-colors duration-300">
            <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
              {editingCategory?.id ? t.editCategory : t.newCategory}
            </h3>
            <CategoryForm 
              onClose={() => { 
                setIsModalOpen(false); 
                setEditingCategory(null);
                fetchCategories(); 
              }} 
              categories={categories}
              category={editingCategory}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryItem({ category, allCategories, onEdit, onAddSub }: { category: Category, allCategories: Category[], onEdit: (c: Category) => void, onAddSub: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const subCategories = allCategories.filter(c => c.parent_id === category.id);
  const hasSub = subCategories.length > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all group">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-500 dark:text-zinc-400",
              !hasSub && "invisible"
            )}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
            <Folder size={18} />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{category.name}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onAddSub}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={() => onEdit(category)}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
      
      {isOpen && hasSub && (
        <div className="pl-12 space-y-1 border-l-2 border-zinc-100 dark:border-zinc-800 ml-6">
              {subCategories.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${sub.color}15`, color: sub.color }}>
                      <FileText size={14} />
                    </div>
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{sub.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      // Pass the subcategory to onEdit
                      onEdit(sub);
                    }}
                    className="p-1.5 text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}

function CategoryForm({ onClose, categories, t, category }: { onClose: () => void, categories: Category[], t: any, category?: Category | null }) {
  const [name, setName] = useState(category?.name || "");
  const [type, setType] = useState<"expense" | "income">(category?.type || "expense");
  const [parentId, setParentId] = useState(category?.parent_id?.toString() || "");
  const [color, setColor] = useState(category?.color || "#10b981");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name,
        type,
        parent_id: parentId ? parseInt(parentId) : null,
        icon: "Folder",
        color
      };

      if (category?.id) {
        await api.updateCategory(category.id, data);
      } else {
        await api.addCategory(data);
      }
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to save category");
    }
  };

  const handleDelete = async () => {
    if (category?.id && window.confirm(t.confirmDeleteCategory)) {
      try {
        await api.deleteCategory(category.id);
        onClose();
      } catch (error: any) {
        alert(error.message || "Failed to delete category");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.categoryName}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries"
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.type}</label>
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          {(["expense", "income"] as const).map((ty) => (
            <button
              key={ty}
              type="button"
              onClick={() => setType(ty)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                type === ty ? "bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              {ty === 'expense' ? t.expense : t.income}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.parentCategory}</label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
        >
          <option value="">{t.noneRoot}</option>
          {categories.filter(c => c.type === type && !c.parent_id && c.id !== category?.id).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.themeColor}</label>
        <div className="flex gap-2">
          {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#1a1a1a"].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                color === c ? "border-zinc-900 dark:border-zinc-100 scale-110" : "border-transparent"
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
          className="flex-1 py-3 border border-black/5 dark:border-white/5 rounded-xl font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          {t.cancel}
        </button>
        {category?.id && (
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
          {category?.id ? t.save : t.create}
        </button>
      </div>
    </form>
  );
}
