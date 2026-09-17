import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MilkRate } from '../types';
import { TrendingUp, Plus, Calendar, ShieldCheck, History, ArrowRight } from 'lucide-react';
import { RateUpdateModal } from '../components/modals/RateUpdateModal';

export const RatesView: React.FC = () => {
  const { formatCurrency, currency, refreshKey, openModal } = useApp();
  const [rates, setRates] = useState<MilkRate[]>([]);
  const [latestRate, setLatestRate] = useState<MilkRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const fetchRates = () => {
    setLoading(true);
    api.getRates()
      .then(res => {
        setRates(res.rates);
        setLatestRate(res.latest);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRates();
  }, [refreshKey]);

  const pRate = latestRate?.purchase_rate || 60;
  const sRate = latestRate?.selling_rate || 85;
  const profitMarginPerUnit = sRate - pRate;
  const marginPercentage = sRate > 0 ? ((profitMarginPerUnit / sRate) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Milk Rate Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set baseline purchase and selling rates for automated suggestion on new transactions
          </p>
        </div>

        <button
          onClick={() => setIsUpdateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Update Standard Rates</span>
        </button>
      </div>

      {/* Current Active Rates Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Active Purchase Rate */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Current Standard Purchase Rate
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
              {currency}{pRate}
            </span>
            <span className="text-sm font-semibold text-slate-400">/{latestRate?.unit || 'Liter'}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Suggested for new purchase entries from suppliers
          </p>
        </div>

        {/* Active Selling Rate */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Current Standard Selling Rate
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
              {currency}{sRate}
            </span>
            <span className="text-sm font-semibold text-slate-400">/{latestRate?.unit || 'Liter'}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Suggested for customer delivery and retail distribution
          </p>
        </div>

        {/* Calculated Spread / Margin */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-100">
            Target Standard Spread
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tabular-nums">
              +{currency}{profitMarginPerUnit}
            </span>
            <span className="text-sm font-semibold text-purple-200">/{latestRate?.unit || 'Liter'} ({marginPercentage.toFixed(1)}%)</span>
          </div>
          <p className="mt-2 text-xs text-purple-100/90">
            Expected gross margin per unit at current rates
          </p>
        </div>

      </div>

      {/* Historical Invariance Note */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>Historical Integrity Protected:</strong> Whenever you change current rates, existing historical purchases and sales permanently retain their original recorded rates so your financial ledgers remain 100% accurate.
        </p>
      </div>

      {/* Rate History Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" /> Rate Revision Timeline
          </h3>
          <span className="text-xs text-slate-400">{rates.length} changes logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Effective Date</th>
                <th className="py-3 px-4 text-right">Purchase Rate</th>
                <th className="py-3 px-4 text-right">Selling Rate</th>
                <th className="py-3 px-4 text-right">Unit Spread</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Reason / Market Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rates.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white tabular-nums">
                    {r.date} {idx === 0 && <span className="ml-2 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-full font-bold">Active</span>}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {currency}{r.purchase_rate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    {currency}{r.selling_rate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                    +{currency}{r.selling_rate - r.purchase_rate}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                    {r.unit}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {r.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RateUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={fetchRates}
      />

    </div>
  );
};
