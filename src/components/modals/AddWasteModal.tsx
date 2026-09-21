import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ProductWaste } from '../../types';
import { X, Trash2, Calendar, AlertTriangle, DollarSign, FileText } from 'lucide-react';

interface AddWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  wasteToEdit?: ProductWaste | null;
  onSuccess?: () => void;
}

const WASTE_REASONS = [
  'Curdled / Spoiled (দুধ কেটে গেছে/নষ্ট)',
  'Spillage / Leakage (পড়ে গেছে/লিকেজ)',
  'Quality / Sour Milk (টক হয়ে গেছে)',
  'Processing Loss (প্রক্রিয়াজাতকরণ ক্ষতি)',
  'Transit Loss (পরিবহন ক্ষতি)',
  'Other (অন্যান্য ক্ষতি)'
];

export const AddWasteModal: React.FC<AddWasteModalProps> = ({
  isOpen,
  onClose,
  wasteToEdit,
  onSuccess
}) => {
  const { showToast, triggerRefresh, currency, formatCurrency, settings } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [productName, setProductName] = useState('Raw Cow Milk');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'Liter' | 'KG'>(settings.default_unit || 'Liter');
  const [reason, setReason] = useState(WASTE_REASONS[0]);
  const [estimatedLoss, setEstimatedLoss] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableStock, setAvailableStock] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    // Load available stock
    api.getStock()
      .then(res => {
        if (res && res.availableStock !== undefined) {
          setAvailableStock(res.availableStock);
        }
      })
      .catch(console.error);

    if (wasteToEdit) {
      setDate(wasteToEdit.date);
      setProductName(wasteToEdit.product_name || 'Raw Cow Milk');
      setQuantity(String(wasteToEdit.quantity));
      setUnit(wasteToEdit.unit as any || settings.default_unit || 'Liter');
      setReason(wasteToEdit.reason || WASTE_REASONS[0]);
      setEstimatedLoss(String(wasteToEdit.estimated_loss));
      setNotes(wasteToEdit.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setProductName('Raw Cow Milk');
      setQuantity('');
      setUnit(settings.default_unit || 'Liter');
      setReason(WASTE_REASONS[0]);
      setEstimatedLoss('');
      setNotes('');
    }
  }, [isOpen, wasteToEdit, settings.default_unit]);

  // Auto-calculate estimated loss when quantity changes
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const qty = parseFloat(val);
    if (!isNaN(qty) && qty > 0) {
      const defaultRate = parseFloat(settings.default_purchase_rate) || 60;
      setEstimatedLoss(String(Math.round(qty * defaultRate)));
    } else {
      setEstimatedLoss('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const loss = parseFloat(estimatedLoss);

    if (!date) return showToast('Date is required', 'warning');
    if (isNaN(qty) || qty <= 0) return showToast('Wasted quantity must be greater than 0', 'warning');
    if (qty > availableStock && !wasteToEdit) {
      return showToast(`Cannot record ${qty} ${unit}. Available tank stock is only ${availableStock.toFixed(1)} ${unit}.`, 'error');
    }

    try {
      setLoading(true);
      const payload: Partial<ProductWaste> = {
        date,
        product_name: productName.trim() || 'Raw Cow Milk',
        quantity: qty,
        unit,
        reason,
        estimated_loss: isNaN(loss) ? qty * 60 : loss,
        notes: notes.trim(),
      };

      if (wasteToEdit) {
        await api.updateWaste(wasteToEdit.id, payload);
        showToast('Product waste updated successfully', 'success');
      } else {
        await api.createWaste(payload);
        showToast(`Product waste of ${qty} ${unit} logged! Available stock updated.`, 'success');
      }

      triggerRefresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product waste', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {wasteToEdit ? 'Edit Product Waste' : 'Record Product Waste'}
              </h2>
              <p className="text-[11px] text-amber-100 font-medium">
                দুধ নষ্ট/অপচয় ট্র্যাকিং ও স্টক অ্যাডজাস্টমেন্ট
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

        {/* Live Stock Info Banner */}
        <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between text-xs">
          <span className="text-amber-800 dark:text-amber-300 font-medium">Current Tank Stock:</span>
          <span className="font-bold text-amber-900 dark:text-amber-200 tabular-nums">
            {availableStock.toFixed(1)} {unit}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Waste Qty *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="5.0"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Liter">Liter (লিটার)</option>
                <option value="KG">KG (কেজি)</option>
              </select>
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Reason for Waste / নষ্টের কারণ *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {WASTE_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Estimated Loss & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                Est. Loss ({currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="300"
                value={estimatedLoss}
                onChange={(e) => setEstimatedLoss(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Tank temperature issue, supplier milk quality defect, spillage during transfer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : wasteToEdit ? 'Update Waste Record' : 'Record Waste & Deduct Stock'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
