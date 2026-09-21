import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StockData } from '../types';
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Trash2,
  Calendar
} from 'lucide-react';

export const StockView: React.FC = () => {
  const { 
    formatCurrency, 
    currency, 
    settings, 
    openModal, 
    refreshKey, 
    setActiveView 
  } = useApp();

  const initialCleanStock: StockData = {
    totalPurchased: 0,
    totalSold: 0,
    totalWasted: 0,
    totalWasteLoss: 0,
    availableStock: 0,
    todayPurchase: 0,
    todaySale: 0,
    todayWaste: 0,
    todayRemaining: 0,
    weightedAvgCost: 0,
    movements: []
  };

  const [stockData, setStockData] = useState<StockData>(initialCleanStock);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getStock()
      .then(res => {
        if (res && res.availableStock !== undefined) {
          setStockData(res);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const isLowStock = stockData.availableStock < 25;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* Top Banner with Stock Health Meter */}
      <div className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition ${
        isLowStock 
          ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700' 
          : 'bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-700'
      }`}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
            {isLowStock ? <AlertTriangle className="w-3.5 h-3.5 text-amber-200" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
            <span>{isLowStock ? 'Low Stock Alert' : 'Stock Optimal'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Milk Inventory & Stock Management</h1>
          <p className="text-xs sm:text-sm opacity-90 max-w-xl font-medium">
            Real-time balance: <code className="bg-black/20 px-2 py-0.5 rounded font-mono text-xs">Tank Balance = Purchased − Sold − Waste</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openModal('ADD_PURCHASE')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-50 transition shadow-lg active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>+ Purchase</span>
          </button>
          <button
            onClick={() => openModal('ADD_SALE')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs transition border border-white/20 active:scale-95"
          >
            <MinusCircle className="w-4 h-4 text-sky-200" />
            <span>+ Sell</span>
          </button>
          <button
            onClick={() => openModal('ADD_WASTE')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-md active:scale-95"
          >
            <Trash2 className="w-4 h-4 text-amber-100" />
            <span>+ Log Waste</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Inventory Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Available Stock */}
        <div className="col-span-2 sm:col-span-1 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>AVAILABLE TANK STOCK</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stockData.availableStock.toFixed(1)}
            </span>
            <span className="ml-1 text-sm font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Weighted Cost:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{currency}{stockData.weightedAvgCost.toFixed(1)}/L</span>
          </div>
        </div>

        {/* Today's Purchase */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>TODAY'S PURCHASE</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{stockData.todayPurchase}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Inflow from suppliers
          </div>
        </div>

        {/* Today's Sale */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>TODAY'S SALE</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 tabular-nums">
              -{stockData.todaySale}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Outflow to customers
          </div>
        </div>

        {/* Today's Waste */}
        <div 
          onClick={() => setActiveView('waste')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-amber-500 transition group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>TODAY'S WASTE</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 group-hover:scale-110 transition-transform">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              -{(stockData.todayWaste || 0).toFixed(1)}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Total: {(stockData.totalWasted || 0).toFixed(1)}L</span>
            <span className="text-amber-600 font-bold">Waste View →</span>
          </div>
        </div>

        {/* Today's Remaining */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>TODAY'S REMAINING</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
              {stockData.todayRemaining > 0 ? `+${stockData.todayRemaining.toFixed(1)}` : stockData.todayRemaining.toFixed(1)}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Net flow today
          </div>
        </div>

      </div>

      {/* All Time Flow Equation Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Cumulative Milk Flow Equation (হিসাবের সমীকরণ)
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-1 w-full">
            <span className="text-[11px] text-slate-400 block font-medium">Total Milk Purchased</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stockData.totalPurchased.toFixed(1)} {settings.default_unit || 'L'}
            </span>
          </div>

          <span className="text-xl font-black text-slate-400 shrink-0">−</span>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-1 w-full">
            <span className="text-[11px] text-slate-400 block font-medium">Total Milk Sold</span>
            <span className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums">
              {stockData.totalSold.toFixed(1)} {settings.default_unit || 'L'}
            </span>
          </div>

          <span className="text-xl font-black text-slate-400 shrink-0">−</span>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-1 w-full">
            <span className="text-[11px] text-slate-400 block font-medium">Total Product Waste</span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              {(stockData.totalWasted || 0).toFixed(1)} {settings.default_unit || 'L'}
            </span>
          </div>

          <span className="text-xl font-black text-slate-400 shrink-0">=</span>

          <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-md flex-1 w-full">
            <span className="text-[11px] text-emerald-100 block font-bold">Current Tank Balance</span>
            <span className="text-xl font-black tabular-nums">
              {stockData.availableStock.toFixed(1)} {settings.default_unit || 'L'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Movement Timeline */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Milk Stock Inflow, Outflow & Waste Movement Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chronological ledger of transactions impacting current milk volume
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Party / Reason</th>
                <th className="py-3 px-3 text-right">Volume Impact</th>
                <th className="py-3 px-3 text-right">Rate</th>
                <th className="py-3 px-3 text-right">Total ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stockData.movements.map((m, idx) => (
                <tr key={`${m.type}-${m.id}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    {m.type === 'PURCHASE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <ArrowDownLeft className="w-3 h-3" /> Inflow (Purchase)
                      </span>
                    ) : m.type === 'SALE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        <ArrowUpRight className="w-3 h-3" /> Outflow (Sale)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        <Trash2 className="w-3 h-3" /> Loss (Waste)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 tabular-nums">{m.date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{m.party_name}</td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums">
                    <span className={m.type === 'PURCHASE' ? 'text-emerald-600' : m.type === 'SALE' ? 'text-sky-600' : 'text-rose-600'}>
                      {m.type === 'PURCHASE' ? `+${m.quantity}` : `-${m.quantity}`} {m.unit}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                    {m.type === 'WASTE' ? '-' : `${currency}${m.rate}`}
                  </td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">{formatCurrency(m.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
