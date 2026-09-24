import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MilkSale } from '../types';
import { 
  ShoppingCart, 
  Search, 
  Download, 
  Printer, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { AddSaleModal } from '../components/modals/AddSaleModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const SalesHistoryView: React.FC = () => {
  const { formatCurrency, currency, showToast, triggerRefresh, refreshKey, openModal } = useApp();

  const [sales, setSales] = useState<MilkSale[]>([]);
  const [summary, setSummary] = useState({ totalQty: 0, totalSale: 0, count: 0, paidCount: 0, dueCount: 0, partialCount: 0, avgRate: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');

  // Modals
  const [editSale, setEditSale] = useState<MilkSale | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewSale, setViewSale] = useState<MilkSale | null>(null);

  const fetchSales = () => {
    setLoading(true);
    api.getSales({
      search,
      startDate,
      endDate,
      customer: customerFilter,
      paymentStatus: paymentFilter,
      unit: unitFilter,
    })
      .then(res => {
        setSales(res.sales);
        setSummary(res.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, [search, startDate, endDate, customerFilter, paymentFilter, unitFilter, refreshKey]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.deleteSale(deleteId);
      showToast('Sale record deleted and milk stock restored', 'success');
      setDeleteId(null);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete sale', 'error');
    }
  };

  const handleExportCSV = () => {
    if (sales.length === 0) {
      showToast('No sales records to export', 'warning');
      return;
    }

    const headers = ['ID,Date,Customer Name,Quantity,Unit,Selling Rate (BDT),Total Sale (BDT),Paid Amount (BDT),Due Amount (BDT),Payment Status,Phone,Address,Notes'];
    const rows = sales.map(s => {
      const paid = s.paid_amount !== undefined ? s.paid_amount : (s.payment_status === 'Paid' ? s.total_sale : 0);
      const due = s.due_amount !== undefined ? s.due_amount : (s.payment_status === 'Due' ? s.total_sale : (s.payment_status === 'Partial' ? Math.max(0, s.total_sale - paid) : 0));
      return `"${s.id}","${s.date}","${s.customer_name.replace(/"/g, '""')}","${s.quantity}","${s.unit}","${s.selling_rate}","${s.total_sale}","${paid}","${due}","${s.payment_status}","${(s.customer_phone || '').replace(/"/g, '""')}","${(s.customer_address || '').replace(/"/g, '""')}","${(s.notes || '').replace(/"/g, '""')}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `milk_sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales ledger exported to CSV', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setCustomerFilter('');
    setPaymentFilter('');
    setUnitFilter('');
  };

  const uniqueCustomers = Array.from(new Set(sales.map(s => s.customer_name))).filter(Boolean);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-sky-600" />
            Milk Sales History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Customer deliveries, distribution revenue, and payment status tracker
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
            onClick={() => openModal('ADD_SALE')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Sale</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, phone, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 font-medium"
            >
              <option value="">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Due">Due</option>
              <option value="Partial">Partial</option>
            </select>
          </div>

          {/* Customer Filter / Clear */}
          <div className="flex items-center gap-2">
            <select
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
            >
              <option value="">All Customers</option>
              {uniqueCustomers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {(search || startDate || endDate || customerFilter || paymentFilter || unitFilter) && (
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
        <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60">
          <span className="text-[11px] text-sky-800 dark:text-sky-300 font-semibold block">Total Milk Sold</span>
          <span className="text-xl font-black text-sky-900 dark:text-white tabular-nums">
            {summary.totalQty.toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60">
          <span className="text-[11px] text-sky-800 dark:text-sky-300 font-semibold block">Total Sales Revenue</span>
          <span className="text-xl font-black text-sky-900 dark:text-white tabular-nums">
            {formatCurrency(summary.totalSale)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Avg Selling Rate</span>
          <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {currency}{summary.avgRate.toFixed(2)} <span className="text-xs font-normal text-slate-400">/L</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Sales Orders</span>
            <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{summary.count}</span>
          </div>
          <div className="text-right text-[10px] space-y-0.5">
            <span className="block text-emerald-600 font-bold">{summary.paidCount} Paid</span>
            <span className="block text-rose-500 font-bold">{summary.dueCount} Due</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Quantity</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4 text-right">Selling Rate</th>
                <th className="py-3.5 px-4 text-right">Total Sale</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-center no-print">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-sky-600" />
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales records match your search criteria.
                  </td>
                </tr>
              ) : (
                sales.map(s => (
                  <tr 
                    key={s.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition group"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white tabular-nums">
                      {s.date}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <div>
                        <span>{s.customer_name}</span>
                        {s.notes && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">{s.notes}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-right tabular-nums">
                      {s.quantity}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                        {s.unit}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                      {currency}{s.selling_rate}
                    </td>

                    <td className="py-3 px-4 text-right font-black tabular-nums text-sky-600 dark:text-sky-400 text-sm">
                      {formatCurrency(s.total_sale)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {s.payment_status === 'Partial' ? (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3 h-3" />
                            Partial
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                            জমা: {formatCurrency(s.paid_amount ?? 0)}
                          </span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black tabular-nums">
                            বকেয়া: {formatCurrency(s.due_amount ?? (s.total_sale - (s.paid_amount ?? 0)))}
                          </span>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {s.payment_status === 'Paid' && <CheckCircle className="w-3 h-3" />}
                          {s.payment_status === 'Due' && <AlertTriangle className="w-3 h-3" />}
                          {s.payment_status}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewSale(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditSale(s)}
                          className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60"
                          title="Edit Entry"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteId(s.id)}
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
            {sales.length > 0 && (
              <tfoot>
                <tr className="bg-sky-50/50 dark:bg-sky-950/30 border-t-2 border-sky-500/30 font-bold text-slate-900 dark:text-white">
                  <td colSpan={2} className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                    Grand Total ({summary.count} entries)
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-sky-900 dark:text-sky-300 text-base font-black">
                    {summary.totalQty.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">Total L</td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-xs text-slate-500">
                    Avg: {currency}{summary.avgRate.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-sky-700 dark:text-sky-300 text-base font-black">
                    {formatCurrency(summary.totalSale)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 no-print text-center text-xs text-slate-500">
                    {summary.paidCount} Paid / {summary.dueCount} Due
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Edit Sale Modal */}
      {editSale && (
        <AddSaleModal
          isOpen={true}
          onClose={() => setEditSale(null)}
          saleToEdit={editSale}
          onSuccess={fetchSales}
        />
      )}

      {/* View Detail Modal */}
      {viewSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Milk Sale Details</h3>
              <button onClick={() => setViewSale(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewSale.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewSale.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewSale.customer_phone || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Address:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewSale.customer_address || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity Sold:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">{viewSale.quantity} {viewSale.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selling Rate:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currency}{viewSale.selling_rate}/{viewSale.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span className={`font-bold ${
                  viewSale.payment_status === 'Paid'
                    ? 'text-emerald-600'
                    : viewSale.payment_status === 'Due'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}>
                  {viewSale.payment_status}
                </span>
              </div>
              {viewSale.payment_status === 'Partial' && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>পরিশোধিত টাকা (Paid):</span>
                    <span>{formatCurrency(viewSale.paid_amount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 dark:text-rose-400 font-bold">
                    <span>বকেয়া পরিমাণ (Due):</span>
                    <span>{formatCurrency(viewSale.due_amount ?? (viewSale.total_sale - (viewSale.paid_amount ?? 0)))}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Total Sale Amount:</span>
                <span className="font-black text-sky-600 dark:text-sky-400 text-base">{formatCurrency(viewSale.total_sale)}</span>
              </div>
              {viewSale.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Notes:</span>
                  <p className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{viewSale.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setViewSale(null)}
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
        title="Delete Milk Sale Entry"
        message="Are you sure you want to delete this sale entry? The sold quantity will be returned to your available milk stock."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
};
