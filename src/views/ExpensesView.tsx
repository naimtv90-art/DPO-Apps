import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Expense } from '../types';
import { 
  Receipt, 
  Plus, 
  Search, 
  Tag, 
  Edit, 
  Trash2, 
  Calendar, 
  Download,
  Printer,
  X,
  RefreshCw 
} from 'lucide-react';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const ExpensesView: React.FC = () => {
  const { formatCurrency, currency, showToast, refreshKey, openModal } = useApp();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<{ category: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchExpenses = () => {
    setLoading(true);
    api.getExpenses({
      search,
      category: categoryFilter,
      startDate,
      endDate
    })
      .then(res => {
        setExpenses(res.expenses);
        setTotalAmount(res.totalAmount);
        setCategoryTotals(res.categoryTotals);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter, startDate, endDate, refreshKey]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.deleteExpense(deleteId);
      showToast('Expense record deleted successfully', 'success');
      setDeleteId(null);
      fetchExpenses();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return showToast('No expenses to export', 'warning');
    const headers = ['ID,Date,Name,Category,Amount (BDT),Notes'];
    const rows = expenses.map(e => `"${e.id}","${e.date}","${e.name.replace(/"/g, '""')}","${e.category}","${e.amount}","${(e.notes || '').replace(/"/g, '""')}"`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `milk_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Expenses exported to CSV', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-rose-600" />
            Business Expense Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track operational costs, delivery fuel, chilling electricity, salaries, and shop rent
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
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Total */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 col-span-2">
          <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">TOTAL EXPENSES</span>
          <span className="text-2xl font-black text-rose-700 dark:text-rose-400 tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
          <span className="text-[11px] text-rose-600/80 block mt-0.5">Deducted from gross profit</span>
        </div>

        {categoryTotals.slice(0, 4).map(cat => (
          <div key={cat.category} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{cat.category}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
              {formatCurrency(cat.total)}
            </span>
            <span className="text-[10px] text-slate-400">{cat.count} transactions</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3 no-print">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search expenses by name or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:border-rose-500"
        >
          <option value="">All Categories</option>
          <option value="Transport">Transport</option>
          <option value="Electricity">Electricity</option>
          <option value="Packaging">Packaging</option>
          <option value="Employee">Employee</option>
          <option value="Shop Rent">Shop Rent</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
        />

        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
        />

        {(search || categoryFilter || startDate || endDate) && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter(''); setStartDate(''); setEndDate(''); }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
            title="Reset Filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expenses Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Expense Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-center no-print">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-rose-600" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white tabular-nums">{e.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{e.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black tabular-nums text-rose-600 dark:text-rose-400">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{e.notes || '-'}</td>
                    <td className="py-3 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditExpense(e)}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(e.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Modals */}
      {(isAddModalOpen || editExpense) && (
        <AddExpenseModal
          isOpen={true}
          onClose={() => { setIsAddModalOpen(false); setEditExpense(null); }}
          expenseToEdit={editExpense}
          onSuccess={fetchExpenses}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Expense Entry"
        message="Are you sure you want to remove this expense record?"
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
};
