import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DailySummaryRow } from '../types';
import { 
  CalendarCheck, 
  Search, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  Layers, 
  RefreshCw,
  X 
} from 'lucide-react';

export const DailySummaryView: React.FC = () => {
  const { formatCurrency, currency, showToast, refreshKey } = useApp();

  const [dailyData, setDailyData] = useState<DailySummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchDailySummary = () => {
    setLoading(true);
    api.getDailySummary({ startDate, endDate })
      .then(res => setDailyData(res.dailyData))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDailySummary();
  }, [startDate, endDate, refreshKey]);

  const handleExportCSV = () => {
    if (dailyData.length === 0) {
      showToast('No daily records to export', 'warning');
      return;
    }

    const headers = ['Date,Purchased (L),Purchase Cost (BDT),Sold (L),Sales Revenue (BDT),Remaining Daily (L),COGS (BDT),Gross Profit (BDT),Expenses (BDT),Net Profit (BDT),Avg Purchase Rate,Avg Selling Rate,Gross Margin %'];
    const rows = dailyData.map(d => 
      `"${d.date}","${d.purchasedQty}","${d.purchaseCost}","${d.soldQty}","${d.salesRevenue}","${d.remaining}","${d.cogs}","${d.grossProfit}","${d.expenses}","${d.netProfit}","${d.avgPurchaseRate.toFixed(2)}","${d.avgSellingRate.toFixed(2)}","${d.grossMargin}%"`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daily_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Daily summary exported to CSV', 'success');
  };

  // Totals for the summary header/footer
  const grandPurchased = dailyData.reduce((sum, d) => sum + d.purchasedQty, 0);
  const grandPurchaseCost = dailyData.reduce((sum, d) => sum + d.purchaseCost, 0);
  const grandSold = dailyData.reduce((sum, d) => sum + d.soldQty, 0);
  const grandSalesRevenue = dailyData.reduce((sum, d) => sum + d.salesRevenue, 0);
  const grandCOGS = dailyData.reduce((sum, d) => sum + d.cogs, 0);
  const grandGrossProfit = dailyData.reduce((sum, d) => sum + d.grossProfit, 0);
  const grandExpenses = dailyData.reduce((sum, d) => sum + d.expenses, 0);
  const grandNetProfit = dailyData.reduce((sum, d) => sum + d.netProfit, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-teal-600" />
            Daily Business Summary
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete day-by-day ledger with milk inflow, sales revenue, COGS, and profit calculations
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
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">From Date:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">To Date:</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
          />
        </div>

        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
            title="Reset date filter"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block">PERIOD PURCHASE</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {grandPurchased.toFixed(1)} L
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 tabular-nums">{formatCurrency(grandPurchaseCost)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block">PERIOD SALES REVENUE</span>
          <span className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums">
            {formatCurrency(grandSalesRevenue)}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 tabular-nums">{grandSold.toFixed(1)} L sold</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block">PERIOD GROSS PROFIT</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(grandGrossProfit)}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5 tabular-nums">COGS: {formatCurrency(grandCOGS)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md">
          <span className="text-[11px] font-bold text-emerald-100 block">PERIOD NET PROFIT</span>
          <span className="text-xl font-black tabular-nums">
            {formatCurrency(grandNetProfit)}
          </span>
          <span className="text-xs text-emerald-100 block mt-0.5 tabular-nums">Expenses: {formatCurrency(grandExpenses)}</span>
        </div>
      </div>

      {/* Main Daily Summary Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Purchased</th>
                <th className="py-3 px-3 text-right">Purchase Cost</th>
                <th className="py-3 px-3 text-right">Sold</th>
                <th className="py-3 px-3 text-right">Sales Revenue</th>
                <th className="py-3 px-3 text-right">Remaining</th>
                <th className="py-3 px-3 text-right">COGS</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-3 text-right">Exp.</th>
                <th className="py-3 px-3 text-right">Net Profit</th>
                <th className="py-3 px-3 text-right">Avg Rates</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-teal-600" />
                    Loading daily summaries...
                  </td>
                </tr>
              ) : dailyData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No records found for the selected dates.
                  </td>
                </tr>
              ) : (
                dailyData.map(d => (
                  <tr key={d.date} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white tabular-nums">
                      {d.date}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {d.purchasedQty > 0 ? `${d.purchasedQty} L` : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {d.purchaseCost > 0 ? formatCurrency(d.purchaseCost) : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                      {d.soldQty > 0 ? `${d.soldQty} L` : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {d.salesRevenue > 0 ? formatCurrency(d.salesRevenue) : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
                      {d.remaining > 0 ? `+${d.remaining} L` : `${d.remaining} L`}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-500 tabular-nums">
                      {formatCurrency(d.cogs)}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(d.grossProfit)}
                    </td>

                    <td className="py-3 px-3 text-right text-rose-500 tabular-nums font-semibold">
                      {d.expenses > 0 ? formatCurrency(d.expenses) : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                      {formatCurrency(d.netProfit)}
                    </td>

                    <td className="py-3 px-3 text-right text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      P: {currency}{d.avgPurchaseRate.toFixed(1)} / S: {currency}{d.avgSellingRate.toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {dailyData.length > 0 && (
              <tfoot>
                <tr className="bg-teal-50/50 dark:bg-teal-950/30 border-t-2 border-teal-500/30 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <td className="py-3 px-3 text-xs uppercase font-bold text-teal-800 dark:text-teal-300">
                    Grand Total
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-black">
                    {grandPurchased.toFixed(1)} L
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {formatCurrency(grandPurchaseCost)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-sky-700 dark:text-sky-300 font-black">
                    {grandSold.toFixed(1)} L
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {formatCurrency(grandSalesRevenue)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-purple-600 font-black">
                    {(grandPurchased - grandSold).toFixed(1)} L
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {formatCurrency(grandCOGS)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-black">
                    {formatCurrency(grandGrossProfit)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-rose-600 font-black">
                    {formatCurrency(grandExpenses)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-black text-base">
                    {formatCurrency(grandNetProfit)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};
