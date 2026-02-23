import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  ArrowRightLeft,
  Clock,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Summary, Transaction } from "../types";
import { api } from "../services/api";
import { formatCurrency, formatDate, cn } from "../lib/utils";

interface DashboardProps {
  summary: Summary | null;
  onRefresh: () => void;
  currency: string;
}

export default function Dashboard({ summary, onRefresh, currency }: DashboardProps) {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const transactions = await api.getTransactions({ limit: 5 });
      setRecentTransactions(transactions.slice(0, 5));

      // Mock chart data for trends (last 7 days)
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      const trendData = days.map(day => {
        const dayTransactions = transactions.filter(t => t.date === day);
        return {
          name: day.slice(5),
          income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
          expense: dayTransactions.filter(t => t.type === 'expense' || (t.type === 'due' && t.status === 'paid')).reduce((sum, t) => sum + t.amount, 0),
        };
      });
      setChartData(trendData);

      // Category distribution
      const categories = await api.getCategories();
      const distribution = categories
        .filter(c => c.type === 'expense')
        .map(c => {
          const amount = transactions
            .filter(t => t.category_id === c.id && (t.type === 'expense' || (t.type === 'due' && t.status === 'paid')))
            .reduce((sum, t) => sum + t.amount, 0);
          return { name: c.name, value: amount, color: c.color };
        })
        .filter(d => d.value > 0);
      setCategoryData(distribution);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        <div className="col-span-2 md:col-span-1">
          <SummaryCard 
            title="Total Balance" 
            value={summary?.totalBalance || 0} 
            icon={Wallet} 
            color="emerald" 
            currency={currency}
          />
        </div>
        <SummaryCard 
          title="Income" 
          value={summary?.monthlyIncome || 0} 
          icon={TrendingUp} 
          color="blue" 
          trend="+12%"
          currency={currency}
        />
        <SummaryCard 
          title="Expense" 
          value={summary?.monthlyExpense || 0} 
          icon={TrendingDown} 
          color="amber" 
          trend="-5%"
          currency={currency}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Trends */}
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600" />
            Financial Trends
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-emerald-600" />
            Spending by Category
          </h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 1, color: '#f1f5f9' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-2">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-600">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-emerald-600" />
            Recent Transactions
          </h3>
          <button className="text-emerald-600 text-sm font-medium hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {recentTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition-colors border border-transparent hover:border-black/5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  t.type === 'income' ? "bg-emerald-50 text-emerald-600" : 
                  t.type === 'expense' ? "bg-red-50 text-red-600" : 
                  t.type === 'due' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>
                  {t.type === 'income' ? <ArrowDownLeft size={20} /> : 
                   t.type === 'expense' ? <ArrowUpRight size={20} /> : 
                   t.type === 'due' ? <Clock size={20} /> : <ArrowRightLeft size={20} />}
                </div>
                <div>
                  <p className="font-semibold">{t.category_name || (t.type === 'due' ? "Credit Purchase" : "Transfer")}</p>
                  <p className="text-xs text-zinc-400">
                    {formatDate(t.date)} • {t.account_name}
                    {t.type === 'due' && (
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase",
                        t.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {t.status}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className={cn(
                "font-bold",
                t.type === 'income' ? "text-emerald-600" : 
                (t.type === 'expense' || t.type === 'due') ? "text-red-600" : "text-blue-600"
              )}>
                {(t.type === 'expense' || t.type === 'due') ? "-" : t.type === 'income' ? "+" : ""}{formatCurrency(t.amount, currency)}
              </p>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              No recent transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color, trend, currency }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-black/5 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={cn("p-2 sm:p-3 rounded-xl", colors[color])}>
          <Icon size={20} className="sm:w-6 sm:h-6" />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full",
            trend.startsWith('+') ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-zinc-500 text-xs sm:text-sm font-medium">{title}</p>
      <p className="text-lg sm:text-2xl font-bold mt-1 tracking-tight">{formatCurrency(value, currency)}</p>
    </div>
  );
}
