import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { MilkSale, Customer } from '../../types';
import { X, ShoppingCart, Calculator, User, Calendar, MapPin, Phone, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleToEdit?: MilkSale | null;
  onSuccess?: () => void;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({
  isOpen,
  onClose,
  saleToEdit,
  onSuccess
}) => {
  const { settings, showToast, triggerRefresh, currency, formatCurrency } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [quantity, setQuantity] = useState<string>('20');
  const [unit, setUnit] = useState<'Liter' | 'KG'>(settings.default_unit || 'Liter');
  const [sellingRate, setSellingRate] = useState<string>(settings.default_selling_rate || '85');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Due' | 'Partial'>('Paid');
  const [notes, setNotes] = useState('');
  
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch stock
    api.getStock().then(res => {
      let stock = res.availableStock;
      if (saleToEdit) {
        stock += saleToEdit.quantity; // add back the sale being edited
      }
      setAvailableStock(stock);
    }).catch(console.error);

    // Fetch customers
    api.getCustomers().then(res => setCustomersList(res.customers)).catch(console.error);

    if (saleToEdit) {
      setDate(saleToEdit.date);
      setCustomerId(saleToEdit.customer_id ? String(saleToEdit.customer_id) : '');
      setCustomerName(saleToEdit.customer_name || '');
      setCustomerPhone(saleToEdit.customer_phone || '');
      setCustomerAddress(saleToEdit.customer_address || '');
      setQuantity(String(saleToEdit.quantity));
      setUnit(saleToEdit.unit);
      setSellingRate(String(saleToEdit.selling_rate));
      setPaymentStatus(saleToEdit.payment_status);
      setNotes(saleToEdit.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setQuantity('20');
      setUnit(settings.default_unit || 'Liter');
      setPaymentStatus('Paid');
      setNotes('');

      // Fetch latest selling rate
      api.getRates().then(res => {
        if (res.latest?.selling_rate) {
          setSellingRate(String(res.latest.selling_rate));
        }
      }).catch(console.error);
    }
  }, [isOpen, saleToEdit, settings]);

  if (!isOpen) return null;

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
    if (!date) {
      showToast('Please select a valid date', 'warning');
      return;
    }
    if (parsedQty <= 0) {
      showToast('Quantity sold must be greater than 0', 'warning');
      return;
    }
    if (parsedRate <= 0) {
      showToast('Selling rate must be greater than 0', 'warning');
      return;
    }
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

      if (saleToEdit) {
        await api.updateSale(saleToEdit.id, payload);
        showToast('Milk sale updated successfully', 'success');
      } else {
        await api.createSale(payload);
        showToast(`Sold ${parsedQty} ${unit} at ${currency}${parsedRate}/${unit} recorded!`, 'success');
      }

      triggerRefresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save milk sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-dairy-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {saleToEdit ? 'Edit Milk Sale' : 'Add Milk Sale'}
              </h3>
              <p className="text-xs text-sky-100">
                Record milk delivery/retail sale to customer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stock Status Badge */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span>Available in Tank:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {availableStock.toFixed(1)} {unit}
            </span>
          </div>
          {isStockInsufficient ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
              <AlertCircle className="w-3.5 h-3.5" /> Insufficient Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" /> Stock Ready
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Row 1: Date & Customer Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                Sale Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                Select Customer (Optional)
              </label>
              <select
                value={customerId}
                onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="">-- Direct Retail / Walk-in --</option>
                {customersList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Name Input (if custom) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              placeholder="e.g. Mirpur DOHS Club, Rafiqul Islam"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
            />
          </div>

          {/* Row 2: Quantity, Unit, Selling Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-900 dark:text-white text-sm font-semibold tabular-nums focus:ring-2 outline-none transition ${
                  isStockInsufficient
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 focus:ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-sky-500/20 focus:border-sky-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as 'Liter' | 'KG')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="Liter">Liter (L)</option>
                <option value="KG">KG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selling Rate ({currency}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                placeholder="85"
                value={sellingRate}
                onChange={e => setSellingRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold tabular-nums focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          {/* Insufficient Stock Warning if triggered */}
          {isStockInsufficient && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>Warning:</strong> Cannot sell {parsedQty} {unit}. Only {availableStock.toFixed(1)} {unit} is available in stock.
              </span>
            </div>
          )}

          {/* Calculation and Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 text-xs font-medium">
                <Calculator className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>{parsedQty || 0} {unit} × {currency}{parsedRate || 0}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Sale:</span>
                <span className="text-base font-bold text-sky-700 dark:text-sky-300 tabular-nums">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="Paid">Paid (Cash / bKash / Card)</option>
                <option value="Due">Due (Receivable)</option>
                <option value="Partial">Partial Payment</option>
              </select>
            </div>
          </div>

          {/* Customer contact & address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Customer Phone
              </label>
              <input
                type="text"
                placeholder="017xxxxxxxx"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Delivery Address
              </label>
              <input
                type="text"
                placeholder="e.g. Mirpur 12, Pallabi, Kazipara"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" /> Delivery Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 5L bottle pack, early morning delivery"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isStockInsufficient}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Saving...' : saleToEdit ? 'Update Sale' : 'Save Sale'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
