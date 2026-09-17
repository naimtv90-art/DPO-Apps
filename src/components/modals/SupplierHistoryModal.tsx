import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Supplier, MilkPurchase } from '../../types';
import { X, Truck } from 'lucide-react';

interface SupplierHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: number | null;
}

export const SupplierHistoryModal: React.FC<SupplierHistoryModalProps> = ({
  isOpen,
  onClose,
  supplierId
}) => {
  const { formatCurrency, currency } = useApp();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<MilkPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !supplierId) return;
    setLoading(true);
    api.getSupplierHistory(supplierId)
      .then(res => {
        setSupplier(res.supplier);
        setPurchases(res.purchases);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, supplierId]);

  if (!isOpen || !supplierId) return null;

  const totalQty = purchases.reduce((sum, p) => sum + p.quantity, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.total_cost, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">{supplier?.name || 'Dairy Supplier'}</h3>
              <p className="text-xs text-emerald-100">Milk Supply & Purchase Invoices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supplier Quick Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Deliveries</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{purchases.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Milk Supplied</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{totalQty.toFixed(1)} L</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Paid Out</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalPaid)}</span>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-center py-6 text-xs text-slate-500">Loading supply history...</p>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No purchase records found for this supplier.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2">Date</th>
                  <th className="py-2">Quantity</th>
                  <th className="py-2">Rate</th>
                  <th className="py-2">Total Paid</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{p.date}</td>
                    <td className="py-2.5 font-semibold tabular-nums text-slate-900 dark:text-white">{p.quantity} {p.unit}</td>
                    <td className="py-2.5 tabular-nums text-slate-600 dark:text-slate-300">{currency}{p.purchase_rate}</td>
                    <td className="py-2.5 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(p.total_cost)}</td>
                    <td className="py-2.5 text-slate-500 max-w-[150px] truncate">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
