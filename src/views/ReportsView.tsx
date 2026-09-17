import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ReportData } from '../types';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  TrendingUp, 
  Boxes, 
  ShoppingBag, 
  ShoppingCart, 
  DollarSign, 
  Percent,
  Layers,
  PieChart as PieIcon,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const EXPENSE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'];

export const ReportsView: React.FC = () => {
  const { settings, formatCurrency, currency, showToast, refreshKey } = useApp();

  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = () => {
    setLoading(true);
    api.getReports({
      type: periodType,
      startDate: periodType === 'custom' ? startDate : undefined,
      endDate: periodType === 'custom' ? endDate : undefined,
    })
      .then(res => setReport(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [periodType, startDate, endDate, refreshKey]);

  const handleExportCSV = () => {
    if (!report) return;

    const headers = ['Date,Purchased (L),Purchase Cost (BDT),Sold (L),Sales Revenue (BDT),COGS (BDT),Gross Profit (BDT),Expenses (BDT),Net Profit (BDT)'];
    const rows = report.breakdown.map(d => 
      `"${d.date}","${d.purchasedQty}","${d.purchaseCost}","${d.soldQty}","${d.salesRevenue}","${d.cogs}","${d.grossProfit}","${d.expenses}","${d.netProfit}"`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${periodType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report data exported to CSV', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Financial & Stock Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed business performance, inventory flow & profitability statements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setPeriodType('daily')}
            className={`px-4 py-2 rounded-lg transition ${periodType === 'daily' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
          >
            Today (Daily)
          </button>
          <button
            onClick={() => setPeriodType('weekly')}
            className={`px-4 py-2 rounded-lg transition ${periodType === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
          >
            Last 7 Days (Weekly)
          </button>
          <button
            onClick={() => setPeriodType('monthly')}
            className={`px-4 py-2 rounded-lg transition ${periodType === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
          >
            Last 30 Days (Monthly)
          </button>
          <button
            onClick={() => setPeriodType('custom')}
            className={`px-4 py-2 rounded-lg transition ${periodType === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
          >
            Custom Range
          </button>
        </div>

        {periodType === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
          </div>
        )}

        {report && (
          <span className="text-xs text-slate-400 font-medium">
            Active Period: {report.period.startDate} to {report.period.endDate}
          </span>
        )}
      </div>

      {loading || !report ? (
        <div className="p-12 text-center text-slate-400 animate-pulse">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-indigo-600" />
          Generating comprehensive business report...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 4 Report Overview Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Purchase Summary */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Purchase Summary
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {report.purchaseSummary.totalQty.toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Cost: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(report.purchaseSummary.totalCost)}</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Avg Rate: {currency}{report.purchaseSummary.avgRate.toFixed(2)}/L</span>
                <span>{report.purchaseSummary.orderCount} Orders</span>
              </div>
            </div>

            {/* 2. Sales Summary */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Sales Summary
                </span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {report.salesSummary.totalQty.toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Revenue: <strong className="text-sky-600 dark:text-sky-400 tabular-nums">{formatCurrency(report.salesSummary.totalRevenue)}</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Avg Rate: {currency}{report.salesSummary.avgRate.toFixed(2)}/L</span>
                <span>{report.salesSummary.orderCount} Orders</span>
              </div>
            </div>

            {/* 3. Profit Summary */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Profit Statement
                </span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(report.profitSummary.grossProfit)}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Net Profit: <strong className="text-slate-900 dark:text-white tabular-nums">{formatCurrency(report.profitSummary.netProfit)}</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Margin: {report.profitSummary.grossMargin}%</span>
                <span>COGS: {formatCurrency(report.profitSummary.cogs)}</span>
              </div>
            </div>

            {/* 4. Stock Flow Statement */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Stock Reconciliation
                </span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {report.stock.closingStock.toFixed(1)} <span className="text-xs font-normal text-slate-400">L Closing</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Opening: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{report.stock.openingStock.toFixed(1)} L</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>+{report.stock.purchased} in</span>
                <span>-{report.stock.sold} out</span>
              </div>
            </div>

          </div>

          {/* Interactive Report Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Revenue vs Cost Breakdown */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Period Revenue & Profit Trajectory
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.breakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.substring(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area type="monotone" dataKey="salesRevenue" name="Sales Revenue" fill="#e0f2fe" stroke="#0284c7" strokeWidth={2} />
                    <Area type="monotone" dataKey="grossProfit" name="Gross Profit" fill="#d1fae5" stroke="#10b981" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Expenses by Category */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Expense Category Breakdown
              </h3>
              {report.expenseBreakdown.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  No expenses recorded in this period.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.expenseBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {report.expenseBreakdown.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={EXPENSE_COLORS[idx % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Breakdown Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Detailed Date-Wise Financial Statement
              </h3>
              <span className="text-xs text-slate-400">{report.breakdown.length} days analyzed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Purchased</th>
                    <th className="py-3 px-4 text-right">Purchase Cost</th>
                    <th className="py-3 px-4 text-right">Sold</th>
                    <th className="py-3 px-4 text-right">Sales Revenue</th>
                    <th className="py-3 px-4 text-right">COGS</th>
                    <th className="py-3 px-4 text-right">Gross Profit</th>
                    <th className="py-3 px-4 text-right">Expenses</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.breakdown.map(d => (
                    <tr key={d.date} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white tabular-nums">{d.date}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{d.purchasedQty} L</td>
                      <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(d.purchaseCost)}</td>
                      <td className="py-3 px-4 text-right font-bold text-sky-600 dark:text-sky-400 tabular-nums">{d.soldQty} L</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(d.salesRevenue)}</td>
                      <td className="py-3 px-4 text-right text-slate-500 tabular-nums">{formatCurrency(d.cogs)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(d.grossProfit)}</td>
                      <td className="py-3 px-4 text-right text-rose-500 tabular-nums font-semibold">{formatCurrency(d.expenses)}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{formatCurrency(d.netProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
