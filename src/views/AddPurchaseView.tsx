import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Supplier, MilkPurchase } from '../types';
import { ShoppingBag, Calculator, Calendar, User, Phone, MapPin, FileText, ArrowRight } from 'lucide-react';

export const AddPurchaseView: React.FC = () => {
  const { settings, showToast, triggerRefresh, currency, formatCurrency, setActiveView } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [unit, setUnit] = useState<'Liter' | 'KG'>(settings.default_unit || 'Liter');
  const [purchaseRate, setPurchaseRate] = useState(settings.default_purchase_rate || '60');
  const [notes, setNotes] = useState('');
  
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSuppliers().then(res => setSuppliersList(res.suppliers)).catch(console.error);
    api.getRates().then(res => {
      if (res.latest?.purchase_rate) {
        setPurchaseRate(String(res.latest.purchase_rate));
      }
    }).catch(console.error);
  }, [settings]);

  const parsedQty = parseFloat(quantity) || 0;
  const parsedRate = parseFloat(purchaseRate) || 0;
  const calculatedTotal = parsedQty * parsedRate;

  const handleSupplierSelect = (idStr: string) => {
    setSupplierId(idStr);
    if (!idStr) {
      setSupplierName('');
      return;
    }
    const sup = suppliersList.find(s => String(s.id) === idStr);
    if (sup) {
      setSupplierName(sup.name);
      if (sup.phone) setSupplierPhone(sup.phone);
      if (sup.address) setSupplierAddress(sup.address);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return showToast('Please select a valid date', 'warning');
    if (parsedQty <= 0) return showToast('Quantity must be greater than 0', 'warning');
    if (parsedRate <= 0) return showToast('Rate must be greater than 0', 'warning');

    try {
      setLoading(true);
      const payload: Partial<MilkPurchase> = {
        date,
        supplier_id: supplierId ? parseInt(supplierId) : null,
        supplier_name: supplierName.trim() || 'Cash Local Farmer',
        quantity: parsedQty,
        unit,
        purchase_rate: parsedRate,
        supplier_phone: supplierPhone,
        supplier_address: supplierAddress,
        notes: notes.trim(),
      };

      await api.createPurchase(payload);
      showToast(`Milk purchase of ${parsedQty} ${unit} saved successfully!`, 'success');
      triggerRefresh();
      setActiveView('purchase-history');
    } catch (err: any) {
      showToast(err.message || 'Failed to save purchase', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">Add Milk Purchase</h1>
            <p className="text-xs text-emerald-100">Record fresh raw milk collected from farm or supplier</p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('purchase-history')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
        >
          <span>Purchase History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Date & Supplier Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" /> Purchase Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" /> Select Existing Supplier
              </label>
              <select
                value={supplierId}
                onChange={e => handleSupplierSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="">-- New / Walk-in Supplier --</option>
                {suppliersList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.phone || 'No phone'})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Supplier / Farm Name
            </label>
            <input
              type="text"
              placeholder="e.g. Kadir Dairy Farm - Savar"
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
            />
          </div>

          {/* Quantity, Unit, Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Milk Quantity *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="50"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="Liter">Liter (L)</option>
                <option value="KG">KG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Purchase Rate per {unit} ({currency}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                placeholder="60"
                value={purchaseRate}
                onChange={e => setPurchaseRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Dynamic Cost Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
              <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Calculation: {parsedQty || 0} {unit} × {currency}{parsedRate || 0}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Purchase Cost:</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Supplier Phone
              </label>
              <input
                type="text"
                placeholder="017xxxxxxxx"
                value={supplierPhone}
                onChange={e => setSupplierPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Farm Address
              </label>
              <input
                type="text"
                placeholder="e.g. Savar, Manikganj"
                value={supplierAddress}
                onChange={e => setSupplierAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Batch / Quality Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Morning milking, FAT 4.2%, Lactometer 29"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Saving Purchase...' : 'Save Milk Purchase Entry'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
