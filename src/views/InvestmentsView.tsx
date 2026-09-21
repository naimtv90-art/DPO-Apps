import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { PartnerInvestment, PartnerSummary, Partner } from '../types';
import { AddInvestmentModal } from '../components/modals/AddInvestmentModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { 
  Briefcase, 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  PieChart as PieChartIcon, 
  Users, 
  ArrowUpRight, 
  TrendingUp, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  CreditCard,
  Building,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const InvestmentsView: React.FC = () => {
  const { formatCurrency, currency, refreshKey, triggerRefresh, showToast } = useApp();

  const [investments, setInvestments] = useState<PartnerInvestment[]>([]);
  const [partnerSummaries, setPartnerSummaries] = useState<PartnerSummary[]>([]);
  const [totalInvested, setTotalInvested] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<PartnerInvestment | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PartnerInvestment | null>(null);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const res = await api.getInvestments({
        partner: selectedPartner || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined
      });
      if (res) {
        setInvestments(res.investments || []);
        setTotalInvested(res.totalInvested || 0);
        setPartnerSummaries(res.partnerSummaries || []);
      }
    } catch (err: any) {
      console.error('Failed to load partner investments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [selectedPartner, startDate, endDate, search, refreshKey]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteInvestment(itemToDelete.id);
      showToast('Investment record deleted successfully', 'info');
      setItemToDelete(null);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete investment', 'error');
    }
  };

  // Pie chart data for equity shares
  const pieData = partnerSummaries
    .filter(p => p.total_invested > 0)
    .map(p => ({
      name: p.name,
      value: p.total_invested,
      percentage: p.share_percentage
    }));

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4 Partner Equity & Capital Pool</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Partner Investment Management / পার্টনার ইনভেস্টমেন্ট
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl font-medium">
            ব্যবসায়ের ৪ জন পার্টনারের মূলধন বিনিয়োগ, ব্যক্তিগত ইনভেস্টমেন্টের হিসেব এবং শতকরা ইকুইটি শেয়ার ট্র্যাকিং।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setInvestmentToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-xs hover:bg-blue-50 transition shadow-lg active:scale-95 group"
          >
            <PlusCircle className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>+ Add Investment / নতুন ইনভেস্ট</span>
          </button>
        </div>
      </div>

      {/* 4 Partner Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            4 Partners Capital Distribution / পার্টনারদের মূলধন
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Total Capital: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(totalInvested)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {partnerSummaries.map((partner, idx) => {
            const color = COLORS[idx % COLORS.length];
            return (
              <div 
                key={partner.id || partner.name}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-500 transition"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: color }} />
                
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Partner {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1" title={partner.name}>
                      {partner.name}
                    </h3>
                  </div>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[11px] font-black shrink-0"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {partner.share_percentage}%
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(partner.total_invested)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(5, partner.share_percentage)}%`, backgroundColor: color }}
                  />
                </div>

                <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{partner.entry_count} Contributions</span>
                  <span className="text-slate-400 truncate max-w-[120px]">{partner.role || 'Partner'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Equity Share Pie Chart */}
        <div className="lg:col-span-1 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                Equity Share Ratio
              </h3>
              <span className="text-[11px] text-slate-400">Ownership %</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-time equity share based on total capital investment contributions.
            </p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatCurrency(val), 'Invested']}
                  />
                  <Legend 
                    formatter={(val, entry: any) => `${val} (${entry.payload.percentage}%)`}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8">
                No investment data recorded yet.
              </div>
            )}
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-800 dark:text-blue-300 font-medium">
            💡 Total Active Capital Pool: <strong>{formatCurrency(totalInvested)}</strong>
          </div>
        </div>

        {/* Investment Transactions Ledger */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Investment Transactions Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Chronological record of partner capital entries
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search notes/partner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                  />
                </div>

                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-medium"
                >
                  <option value="">All Partners</option>
                  {partnerSummaries.map(p => (
                    <option key={p.id || p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Partner</th>
                    <th className="py-2.5 px-3">Type & Method</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {investments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No investment transactions found. Click "+ Add Investment" to record a partner deposit.
                      </td>
                    </tr>
                  ) : (
                    investments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                          {inv.date}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {inv.partner_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {inv.investment_type}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {inv.payment_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-blue-600 dark:text-blue-400 tabular-nums">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={inv.notes}>
                          {inv.notes || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setInvestmentToEdit(inv);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(inv)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <AddInvestmentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          investmentToEdit={investmentToEdit}
          onSuccess={fetchInvestments}
        />
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Investment Record"
          message={`Are you sure you want to delete this investment record of ${formatCurrency(itemToDelete.amount)} from ${itemToDelete.partner_name}?`}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleDelete}
          onClose={() => setItemToDelete(null)}
        />
      )}

    </div>
  );
};
