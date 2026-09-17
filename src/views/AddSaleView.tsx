import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Customer, MilkSale } from '../types';
import { ShoppingCart, Calculator, Calendar, User, Phone, MapPin, FileText, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const AddSaleView: React.FC = () => {
  const { settings, showToast, triggerRefresh, currency, formatCurrency, setActiveView } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [quantity, setQuantity] = useState('20');
  const [unit, setUnit] = useState<'Liter' | 'KG'>(settings.default_unit || 'Liter');
  const [sellingRate, setSellingRate] = useState(settings.default_selling_rate || '85');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Due' | 'Partial'>('Paid');
  const [notes, setNotes] = useState('');

  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getStock().then(res => setAvailableStock(res.availableStock)).catch(console.error);
    api.getCustomers().then(res => setCustomersList(res.customers)).catch(console.error);
    api.getRates().then(res => {
      if (res.latest?.selling_rate) {
        setSellingRate(String(res.latest.selling_rate));
      }
    }).catch(console.error);
  }, [settings]);

  const parsedQty = parseFloat(quantity) || 0;
  const parsedRate = parseFloat(sellingRate) || 0;
  const calculatedTotal = parsedQty * parsedRate;
  const isStockInsufficient = parsedQty > availableStock;

  const handleCustomerSelect = (idStr: string) => {
    setCustomerId(idStr);
    if (!idStr) {
      setCustomerName('');
      return;
    }
    const cust = customersList.find(c => String(c.id) === idStr);
    if (cust) {
      setCustomerName(cust.name);
      if (cust.phone) setCustomerPhone(cust.phone);
      if (cust.address) setCustomerAddress(cust.address);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return showToast('Please select a valid date', 'warning');
    if (parsedQty <= 0) return showToast('Quantity sold must be greater than 0', 'warning');
    if (parsedRate <= 0) return showToast('Selling rate must be greater than 0', 'warning');
    if (isStockInsufficient) {
      showToast(`Insufficient milk stock. Available stock: ${availableStock.toFixed(1)} ${unit}`, 'error');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<MilkSale> = {
        date,
        customer_id: customerId ? parseInt(customerId) : null,
        customer_name: customerName.trim() || 'Retail Cash Customer',
        quantity: parsedQty,
        unit,
        selling_rate: parsedRate,
        payment_status: paymentStatus,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        notes: notes.trim(),
      };

      await api.createSale(payload);
      showToast(`Sale of ${parsedQty} ${unit} recorded successfully!`, 'success');
      triggerRefresh();
      setActiveView('sales-history');
    } catch (err: any) {
      showToast(err.message || 'Failed to save sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-600 to-dairy-700 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">Add Milk Sale</h1>
            <p className="text-xs text-sky-100">Record customer milk distribution, retail sales & dues</p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('sales-history')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
        >
          <span>Sales History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Tank Stock Indicator Bar */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Available Tank Inventory:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm tabular-nums">
              {availableStock.toFixed(1)} {unit}
            </span>
          </div>
          {isStockInsufficient ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-lg">
              <AlertCircle className="w-4 h-4" /> Insufficient Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
              <CheckCircle className="w-4 h-4" /> Ready to Dispatch
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" /> Sale Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-600" /> Select Customer (Optional)
              </label>
              <select
                value={customerId}
                onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="">-- Direct Retail / Walk-in Customer --</option>
                {customersList.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.customer_type})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Customer Name
            </label>
            <input
              type="text"
              placeholder="e.g. Mirpur DOHS Club, Pallabi Cafe, Rafiqul Islam"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Milk Quantity Sold *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="20"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 dark:text-white text-sm font-bold tabular-nums focus:ring-2 outline-none transition ${
                  isStockInsufficient
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 focus:ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-sky-500/20 focus:border-sky-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="Liter">Liter (L)</option>
                <option value="KG">KG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Selling Rate per {unit} ({currency}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                placeholder="85"
                value={sellingRate}
                onChange={e => setSellingRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold tabular-nums focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          {/* Insufficient Stock Warning */}
          {isStockInsufficient && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>
                <strong>Insufficient Stock Warning:</strong> You entered {parsedQty} {unit}, but only {availableStock.toFixed(1)} {unit} is currently available in the storage tank. Transaction cannot proceed.
              </span>
            </div>
          )}

          {/* Calculation and Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 text-sm font-medium">
                <Calculator className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span>{parsedQty || 0} {unit} × {currency}{parsedRate || 0}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Sale:</span>
                <span className="text-xl font-black text-sky-700 dark:text-sky-300 tabular-nums">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="Paid">Paid (Cash / bKash / Card)</option>
                <option value="Due">Due (Receivable)</option>
                <option value="Partial">Partial Payment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Customer Phone
              </label>
              <input
                type="text"
                placeholder="017xxxxxxxx"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Delivery Address
              </label>
              <input
                type="text"
                placeholder="e.g. Mirpur 12, Pallabi, Kazipara"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Delivery Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 1L pack bottles, early morning delivery"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={loading || isStockInsufficient}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving Sale...' : 'Save Milk Sale Entry'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
