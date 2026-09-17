import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MilkPurchase } from '../types';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  X,
  RefreshCw
} from 'lucide-react';
import { AddPurchaseModal } from '../components/modals/AddPurchaseModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const PurchaseHistoryView: React.FC = () => {
  const { formatCurrency, currency, showToast, triggerRefresh, refreshKey, openModal } = useApp();

  const [purchases, setPurchases] = useState<MilkPurchase[]>([]);
  const [summary, setSummary] = useState({ totalQty: 0, totalCost: 0, count: 0, avgRate: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');

  // Modals
  const [editPurchase, setEditPurchase] = useState<MilkPurchase | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewPurchase, setViewPurchase] = useState<MilkPurchase | null>(null);

  const fetchPurchases = () => {
    setLoading(true);
    api.getPurchases({
      search,
      startDate,
      endDate,
      supplier: supplierFilter,
      unit: unitFilter,
    })
      .then(res => {
        setPurchases(res.purchases);
        setSummary(res.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPurchases();
  }, [search, startDate, endDate, supplierFilter, unitFilter, refreshKey]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.deletePurchase(deleteId);
      showToast('Purchase record deleted successfully', 'success');
      setDeleteId(null);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete purchase', 'error');
    }
  };

  const handleExportCSV = () => {
    if (purchases.length === 0) {
      showToast('No records to export', 'warning');
      return;
    }

    const headers = ['ID,Date,Supplier Name,Quantity,Unit,Purchase Rate (BDT),Total Cost (BDT),Phone,Address,Notes'];
    const rows = purchases.map(p => 
      `"${p.id}","${p.date}","${p.supplier_name.replace(/"/g, '""')}","${p.quantity}","${p.unit}","${p.purchase_rate}","${p.total_cost}","${(p.supplier_phone || '').replace(/"/g, '""')}","${(p.supplier_address || '').replace(/"/g, '""')}","${(p.notes || '').replace(/"/g, '""')}"`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `milk_purchases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Purchase ledger exported to CSV', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setSupplierFilter('');
    setUnitFilter('');
  };

  // Get list of unique suppliers for filter dropdown
  const uniqueSuppliers = Array.from(new Set(purchases.map(p => p.supplier_name))).filter(Boolean);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            Milk Purchase History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete daily milk purchasing ledger, supplier invoices & totals
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
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => openModal('ADD_PURCHASE')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Purchase</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search supplier, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            >
              <option value="">All Suppliers</option>
              {uniqueSuppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Unit Filter */}
          <div className="flex items-center gap-2">
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            >
              <option value="">All Units</option>
              <option value="Liter">Liter (L)</option>
              <option value="KG">KG</option>
            </select>

            {(search || startDate || endDate || supplierFilter || unitFilter) && (
              <button
                onClick={clearFilters}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title="Clear Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold block">Total Purchased</span>
          <span className="text-xl font-black text-emerald-900 dark:text-white tabular-nums">
            {summary.totalQty.toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold block">Total Purchase Cost</span>
          <span className="text-xl font-black text-emerald-900 dark:text-white tabular-nums">
            {formatCurrency(summary.totalCost)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Average Rate</span>
          <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {currency}{summary.avgRate.toFixed(2)} <span className="text-xs font-normal text-slate-400">/L</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Total Deliveries</span>
          <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {summary.count} <span className="text-xs font-normal text-slate-400">Invoices</span>
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Supplier / Farm</th>
                <th className="py-3.5 px-4 text-right">Quantity</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4 text-right">Rate</th>
                <th className="py-3.5 px-4 text-right">Total Cost</th>
                <th className="py-3.5 px-4 text-center no-print">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
                    Loading purchase records...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No purchase records match your search criteria.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr 
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition group"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white tabular-nums">
                      {p.date}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <div>
                        <span>{p.supplier_name}</span>
                        {p.notes && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">{p.notes}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-right tabular-nums">
                      {p.quantity}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                        {p.unit}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                      {currency}{p.purchase_rate}
                    </td>

                    <td className="py-3 px-4 text-right font-black tabular-nums text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(p.total_cost)}
                    </td>

                    <td className="py-3 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewPurchase(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditPurchase(p)}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                          title="Edit Entry"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Footer Row */}
            {purchases.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50/50 dark:bg-emerald-950/30 border-t-2 border-emerald-500/30 font-bold text-slate-900 dark:text-white">
                  <td colSpan={2} className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Grand Total ({summary.count} entries)
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-900 dark:text-emerald-300 text-base font-black">
                    {summary.totalQty.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">Total L</td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-xs text-slate-500">
                    Avg: {currency}{summary.avgRate.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-700 dark:text-emerald-300 text-base font-black">
                    {formatCurrency(summary.totalCost)}
                  </td>
                  <td className="py-3.5 px-4 no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Edit Purchase Modal */}
      {editPurchase && (
        <AddPurchaseModal
          isOpen={true}
          onClose={() => setEditPurchase(null)}
          purchaseToEdit={editPurchase}
          onSuccess={fetchPurchases}
        />
      )}

      {/* View Detail Modal */}
      {viewPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Purchase Details</h3>
              <button onClick={() => setViewPurchase(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewPurchase.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Supplier:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewPurchase.supplier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewPurchase.supplier_phone || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Address:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewPurchase.supplier_address || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{viewPurchase.quantity} {viewPurchase.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purchase Rate:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currency}{viewPurchase.purchase_rate}/{viewPurchase.unit}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Total Purchase Cost:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(viewPurchase.total_cost)}</span>
              </div>
              {viewPurchase.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Notes:</span>
                  <p className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{viewPurchase.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setViewPurchase(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Milk Purchase"
        message="Are you sure you want to delete this purchase entry? This will recalculate stock and financial metrics automatically."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
};
