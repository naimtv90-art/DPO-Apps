import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Customer, MilkSale } from '../../types';
import { X, Users, ShoppingCart, Calendar, Phone, MapPin } from 'lucide-react';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
}

export const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  onClose,
  customerId
}) => {
  const { formatCurrency, currency } = useApp();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<MilkSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !customerId) return;
    setLoading(true);
    api.getCustomerHistory(customerId)
      .then(res => {
        setCustomer(res.customer);
        setSales(res.sales);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, customerId]);

  if (!isOpen || !customerId) return null;

  const totalQty = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalSpent = sales.reduce((sum, s) => sum + s.total_sale, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">{customer?.name || 'Customer'}</h3>
              <p className="text-xs text-blue-100">Client Order & Purchase History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Quick Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Type</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{customer?.customer_type}</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Orders</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{sales.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Milk Bought</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{totalQty.toFixed(1)} L</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Spend</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalSpent)}</span>
          </div>
        </div>

        {/* Sales Table */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-center py-6 text-xs text-slate-500">Loading order history...</p>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No sales records found for this customer.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2">Date</th>
                  <th className="py-2">Quantity</th>
                  <th className="py-2">Rate</th>
                  <th className="py-2">Total Amount</th>
                  <th className="py-2">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{s.date}</td>
                    <td className="py-2.5 font-semibold tabular-nums text-slate-900 dark:text-white">{s.quantity} {s.unit}</td>
                    <td className="py-2.5 tabular-nums text-slate-600 dark:text-slate-300">{currency}{s.selling_rate}</td>
                    <td className="py-2.5 font-bold tabular-nums text-sky-600 dark:text-sky-400">{formatCurrency(s.total_sale)}</td>
                    <td className="py-2.5">
                      {s.payment_status === 'Partial' ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 w-fit">
                            Partial
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                            জমা: {formatCurrency(s.paid_amount ?? 0)}
                          </span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold tabular-nums">
                            বকেয়া: {formatCurrency(s.due_amount ?? (s.total_sale - (s.paid_amount ?? 0)))}
                          </span>
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {s.payment_status}
                        </span>
                      )}
                    </td>
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
