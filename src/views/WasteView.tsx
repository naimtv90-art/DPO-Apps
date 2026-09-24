import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ProductWaste, WasteSummary, WasteReasonTotal } from '../types';
import { AddWasteModal } from '../components/modals/AddWasteModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { 
  Trash2, 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  Calendar, 
  DollarSign, 
  Boxes, 
  ArrowDownRight, 
  TrendingDown, 
  Edit, 
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';

export const WasteView: React.FC = () => {
  const { formatCurrency, currency, refreshKey, triggerRefresh, showToast, settings, openModal, setActiveView } = useApp();

  const [wasteList, setWasteList] = useState<ProductWaste[]>([]);
  const [summary, setSummary] = useState<WasteSummary>({
    totalQty: 0,
    totalLoss: 0,
    count: 0,
    todayQty: 0,
    todayLoss: 0
  });
  const [reasonTotals, setReasonTotals] = useState<WasteReasonTotal[]>([]);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [wasteToEdit, setWasteToEdit] = useState<ProductWaste | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductWaste | null>(null);

  const fetchWasteData = async () => {
    try {
      setLoading(true);
      const [wasteRes, stockRes] = await Promise.all([
        api.getWaste({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          reason: reasonFilter || undefined,
          search: search || undefined
        }),
        api.getStock()
      ]);

      if (wasteRes) {
        setWasteList(wasteRes.waste || []);
        setSummary(wasteRes.summary || { totalQty: 0, totalLoss: 0, count: 0, todayQty: 0, todayLoss: 0 });
        setReasonTotals(wasteRes.reasonTotals || []);
      }
      if (stockRes) {
        setAvailableStock(stockRes.availableStock || 0);
      }
    } catch (err: any) {
      console.error('Failed to load waste data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWasteData();
  }, [startDate, endDate, reasonFilter, search, refreshKey]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteWaste(itemToDelete.id);
      showToast('Waste record deleted and stock restored!', 'info');
      setItemToDelete(null);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete waste record', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-800 via-orange-800 to-rose-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Product Loss & Spoilage Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Product Waste Management / αªªαºüαªº αª¿αª╖αºìαªƒ/αªàαª¬αªÜαºƒ αªƒαºìαª░αºìαª»αª╛αªòαª┐αªé
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 max-w-xl font-medium">
            αªªαºüαªº αªòαºçαªƒαºç αª»αª╛αªôαºƒαª╛, αª¿αª╖αºìαªƒ αª╣αªôαºƒαª╛, αª¬αº£αºç αª»αª╛αªôαºƒαª╛ αª¼αª╛ αª¬αª░αª┐αª¼αª╣αª¿ αªòαºìαª╖αªñαª┐αª░ αª╣αª┐αª╕αª╛αª¼ αª░αª╛αªûαª╛ αªÅαª¼αªé αª╕αºìαªƒαªò αªÑαºçαªòαºç αª╕αºìαª¼αºƒαªéαªòαºìαª░αª┐αºƒαª¡αª╛αª¼αºç αª¼αª╛αªª αªªαºçαªôαºƒαª╛αÑñ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setWasteToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-xs hover:bg-amber-50 transition shadow-lg active:scale-95 group"
          >
            <PlusCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>+ Record Waste / αª¿αª╖αºìαªƒ αªÅαª¿αºìαªƒαºìαª░αª┐</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Inventory & Waste Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Wasted Milk */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>TOTAL WASTED MILK</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              {summary.totalQty.toFixed(1)}
            </span>
            <span className="ml-1 text-sm font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            {summary.count} loss incidents recorded
          </div>
        </div>

        {/* Total Estimated Loss (Money) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>ESTIMATED LOSS</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(summary.totalLoss)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Financial impact on net profit
          </div>
        </div>

        {/* Today's Waste */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>TODAY'S WASTE</span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {summary.todayQty.toFixed(1)}
            </span>
            <span className="ml-1 text-sm font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Today's loss: {formatCurrency(summary.todayLoss)}
          </div>
        </div>

        {/* Current Tank Stock */}
        <div 
          onClick={() => setActiveView('inventory')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-emerald-500 transition group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>AVAILABLE TANK BALANCE</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {availableStock.toFixed(1)}
            </span>
            <span className="ml-1 text-sm font-semibold text-slate-400">{settings.default_unit || 'L'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>After waste deduction</span>
            <span className="text-emerald-600 font-bold">View Stock ΓåÆ</span>
          </div>
        </div>

      </div>

      {/* Breakdown by Reason Cards */}
      {reasonTotals.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Wastage Breakdown by Reason / αª¿αª╖αºìαªƒαºçαª░ αªòαª╛αª░αªúαª¡αª┐αªñαºìαªñαª┐αªò αª¼αª┐αª╢αºìαª▓αºçαª╖αªú
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reasonTotals.map((r) => {
              const pct = summary.totalQty > 0 ? ((r.quantity / summary.totalQty) * 100).toFixed(1) : '0';
              return (
                <div key={r.reason} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1" title={r.reason}>
                      {r.reason}
                    </span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 shrink-0">
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                      {r.quantity.toFixed(1)} {settings.default_unit || 'L'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium tabular-nums">
                      {formatCurrency(r.loss)}
                    </span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wastage Ledger Table */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-amber-600" />
              Product Waste Incident Log
            </h3>
            <p className="text-xs text-slate-500">
              Complete history of spoiled, curdled or spilled milk
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reason or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 w-48"
              />
            </div>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              title="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              title="End Date"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reason (αª¿αª╖αºìαªƒαºçαª░ αªòαª╛αª░αªú)</th>
                <th className="py-2.5 px-3 text-right">Wasted Volume</th>
                <th className="py-2.5 px-3 text-right">Est. Loss Value</th>
                <th className="py-2.5 px-3">Remarks / Notes</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {wasteList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No product waste records found. Click "+ Record Waste" to log a loss.
                  </td>
                </tr>
              ) : (
                wasteList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                      {item.date}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        {item.reason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      -{item.quantity.toFixed(1)} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.estimated_loss)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={item.notes}>
                      {item.notes || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setWasteToEdit(item);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
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

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <AddWasteModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          wasteToEdit={wasteToEdit}
          onSuccess={fetchWasteData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Waste Record"
          message={`Are you sure you want to delete this waste record of ${itemToDelete.quantity} ${itemToDelete.unit}? Deleting it will add the volume back into your Available Stock balance.`}
          confirmText="Yes, Delete & Restore Stock"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleDelete}
          onClose={() => setItemToDelete(null)}
        />
      )}

    </div>
  );
};
