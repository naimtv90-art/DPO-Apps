import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DashboardStats, ChartDataPoint } from '../types';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Boxes, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  MinusCircle, 
  Calendar,
  Sparkles,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { 
    settings, 
    formatCurrency, 
    currency, 
    openModal, 
    refreshKey, 
    setActiveView 
  } = useApp();

  const initialCleanStats: DashboardStats = {
    today: {
      purchaseQty: 0,
      purchaseCost: 0,
      salesQty: 0,
      salesRevenue: 0,
      remaining: 0,
      cogs: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0
    },
    month: {
      purchaseQty: 0,
      purchaseCost: 0,
      salesQty: 0,
      salesRevenue: 0,
      remaining: 0,
      cogs: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0
    },
    allTime: {
      totalPurchased: 0,
      totalSold: 0,
      totalPurchaseCost: 0,
      totalSalesRevenue: 0,
      totalCOGS: 0,
      totalGrossProfit: 0,
      totalExpenses: 0,
      totalNetProfit: 0,
      weightedAvgCost: 0,
      avgSellingRate: 0,
      grossMargin: 0,
      profitPerLiter: 0
    },
    currentStock: 0,
    recentPurchases: [],
    recentSales: [],
    recentExpenses: [],
    charts: []
  };

  const [stats, setStats] = useState<DashboardStats>(initialCleanStats);
  const [loading, setLoading] = useState(false);
  const [chartFilter, setChartFilter] = useState<'7days' | '30days' | 'thisMonth' | 'all'>('7days');

  useEffect(() => {
    api.getDashboardStats()
      .then(res => {
        if (res && res.today) {
          setStats(res);
        }
      })
      .catch(() => {
        // Keeps initialDemoStats seamlessly
      });
  }, [refreshKey]);

  // Filter chart data points
  const getFilteredCharts = (): ChartDataPoint[] => {
    if (!stats.charts || stats.charts.length === 0) return [];
    if (chartFilter === '7days') return stats.charts.slice(-7);
    if (chartFilter === '30days') return stats.charts.slice(-30);
    if (chartFilter === 'thisMonth') {
      const currentMonth = new Date().toISOString().substring(0, 7);
      return stats.charts.filter(c => c.date.startsWith(currentMonth));
    }
    return stats.charts;
  };

  const chartData = getFilteredCharts();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING 👋';
    if (hour < 17) return 'GOOD AFTERNOON ☀️';
    return 'GOOD EVENING 🌙';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/60 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-400/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{getGreeting()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {settings.business_name || 'Dairy Pure & Organic'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl font-medium">
              Daily Milk Business Overview • {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => openModal('ADD_PURCHASE')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition shadow-lg active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Add Purchase</span>
            </button>
            <button
              onClick={() => openModal('ADD_SALE')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-lg border border-teal-400/30 active:scale-95"
            >
              <MinusCircle className="w-4 h-4 text-teal-200" />
              <span>Add Sale</span>
            </button>
            <button
              onClick={() => openModal('ADD_EXPENSE')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 font-semibold text-xs transition border border-emerald-500/30 active:scale-95"
            >
              <Receipt className="w-4 h-4 text-rose-300" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S CORE METRICS ROW */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" /> Today's Operations
          </h2>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
            Live Calculations
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Today's Purchase */}
          <div 
            onClick={() => setActiveView('purchase-history')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Today's Purchase</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {stats.today.purchaseQty} <span className="text-sm font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Total Cost:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {formatCurrency(stats.today.purchaseCost)}
              </span>
            </div>
          </div>

          {/* Card 2: Today's Sales */}
          <div 
            onClick={() => setActiveView('sales-history')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Today's Sales</span>
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {stats.today.salesQty} <span className="text-sm font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Total Revenue:</span>
              <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                {formatCurrency(stats.today.salesRevenue)}
              </span>
            </div>
          </div>

          {/* Card 3: Current Milk Stock */}
          <div 
            onClick={() => setActiveView('inventory')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Current Stock</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {stats.currentStock.toFixed(1)} <span className="text-sm font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                In Tank
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Today's Remaining:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {stats.today.remaining} {settings.default_unit || 'L'}
              </span>
            </div>
          </div>

          {/* Card 4: Today's Profit */}
          <div 
            onClick={() => setActiveView('daily-summary')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Today's Profit</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(stats.today.grossProfit)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Net after Exp:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {formatCurrency(stats.today.netProfit)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* MONTHLY & CUMULATIVE SNAPSHOT ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Monthly Purchase</span>
          <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {stats.month.purchaseQty} {settings.default_unit || 'L'}
          </p>
          <span className="text-[10px] text-slate-400 block tabular-nums">{formatCurrency(stats.month.purchaseCost)}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Monthly Sales</span>
          <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {stats.month.salesQty} {settings.default_unit || 'L'}
          </p>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold block tabular-nums">{formatCurrency(stats.month.salesRevenue)}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Month Net Profit</span>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {formatCurrency(stats.month.netProfit)}
          </p>
          <span className="text-[10px] text-slate-400 block">After expenses</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Avg Purchase Rate</span>
          <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {currency}{stats.allTime.weightedAvgCost.toFixed(1)} <span className="text-xs text-slate-400">/{settings.default_unit || 'L'}</span>
          </p>
          <span className="text-[10px] text-slate-400 block">Weighted avg cost</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Avg Selling Rate</span>
          <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {currency}{stats.allTime.avgSellingRate.toFixed(1)} <span className="text-xs text-slate-400">/{settings.default_unit || 'L'}</span>
          </p>
          <span className="text-[10px] text-slate-400 block">Across all sales</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Gross Margin %</span>
          <p className="text-base font-bold text-purple-600 dark:text-purple-400 tabular-nums mt-0.5">
            {stats.allTime.grossMargin.toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-400 block tabular-nums">৳{stats.allTime.profitPerLiter.toFixed(1)}/{settings.default_unit || 'L'} profit</span>
        </div>
      </div>

      {/* INTERACTIVE CHARTS SECTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Milk Movement & Financial Trends
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparative visualization of daily milk purchases, sales, and profits
            </p>
          </div>

          {/* Time Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setChartFilter('7days')}
              className={`px-3 py-1.5 rounded-lg transition ${chartFilter === '7days' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setChartFilter('30days')}
              className={`px-3 py-1.5 rounded-lg transition ${chartFilter === '30days' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setChartFilter('thisMonth')}
              className={`px-3 py-1.5 rounded-lg transition ${chartFilter === 'thisMonth' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setChartFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${chartFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Milk Quantity Purchase vs Sale */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Milk Volume (Purchased vs Sold in Liters)
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => val.substring(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      border: 'none', 
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="purchaseQty" name="Purchased (L)" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="salesQty" name="Sold (L)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Revenue, Cost & Profit */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Revenue & Profit Trends ({currency})
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => val.substring(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      border: 'none', 
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="salesRevenue" name="Sales Revenue" fill="#e0f2fe" stroke="#0284c7" strokeWidth={2} />
                  <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* RECENT ACTIVITY 3-COLUMN WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Recent Purchases */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" /> Recent Purchases
              </h3>
              <button
                onClick={() => setActiveView('purchase-history')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {stats.recentPurchases.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                      {p.supplier_name}
                    </p>
                    <span className="text-[10px] text-slate-400">{p.date} • {p.quantity} {p.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(p.total_cost)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">@{currency}{p.purchase_rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => openModal('ADD_PURCHASE')}
            className="w-full mt-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs transition"
          >
            + New Milk Purchase
          </button>
        </div>

        {/* Recent Sales */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-sky-600" /> Recent Sales
              </h3>
              <button
                onClick={() => setActiveView('sales-history')}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {stats.recentSales.slice(0, 4).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                      {s.customer_name}
                    </p>
                    <span className="text-[10px] text-slate-400">{s.date} • {s.quantity} {s.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                      {formatCurrency(s.total_sale)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">@{currency}{s.selling_rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => openModal('ADD_SALE')}
            className="w-full mt-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold text-xs transition"
          >
            + Record Milk Sale
          </button>
        </div>

        {/* Recent Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" /> Recent Expenses
              </h3>
              <button
                onClick={() => setActiveView('expenses')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {stats.recentExpenses.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No expenses recorded recently</p>
              ) : (
                stats.recentExpenses.slice(0, 4).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                        {e.name}
                      </p>
                      <span className="text-[10px] text-slate-400">{e.date} • {e.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => openModal('ADD_EXPENSE')}
            className="w-full mt-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold text-xs transition"
          >
            + Add Expense
          </button>
        </div>

      </div>

    </div>
  );
};
