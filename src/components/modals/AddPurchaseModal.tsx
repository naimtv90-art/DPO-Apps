import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { MilkPurchase, Supplier } from '../../types';
import { X, ShoppingBag, Calculator, User, Calendar, MapPin, Phone, FileText } from 'lucide-react';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseToEdit?: MilkPurchase | null;
  onSuccess?: () => void;
}

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
  purchaseToEdit,
  onSuccess
}) => {
  const { settings, showToast, triggerRefresh, currency, formatCurrency } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [quantity, setQuantity] = useState<string>('50');
  const [unit, setUnit] = useState<'Liter' | 'KG'>(settings.default_unit || 'Liter');
  const [purchaseRate, setPurchaseRate] = useState<string>(settings.default_purchase_rate || '60');
  const [notes, setNotes] = useState('');
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // Load suppliers and latest rate
  useEffect(() => {
    if (!isOpen) return;

    api.getSuppliers().then(res => setSuppliersList(res.suppliers)).catch(console.error);

    if (purchaseToEdit) {
      setDate(purchaseToEdit.date);
      setSupplierId(purchaseToEdit.supplier_id ? String(purchaseToEdit.supplier_id) : '');
      setSupplierName(purchaseToEdit.supplier_name || '');
      setSupplierPhone(purchaseToEdit.supplier_phone || '');
      setSupplierAddress(purchaseToEdit.supplier_address || '');
      setQuantity(String(purchaseToEdit.quantity));
      setUnit(purchaseToEdit.unit);
      setPurchaseRate(String(purchaseToEdit.purchase_rate));
      setNotes(purchaseToEdit.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setSupplierId('');
      setSupplierName('');
      setSupplierPhone('');
      setSupplierAddress('');
      setQuantity('50');
      setUnit(settings.default_unit || 'Liter');
      setNotes('');

      // Fetch latest rate
      api.getRates().then(res => {
        if (res.latest?.purchase_rate) {
          setPurchaseRate(String(res.latest.purchase_rate));
        }
      }).catch(console.error);
    }
  }, [isOpen, purchaseToEdit, settings]);

  if (!isOpen) return null;

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
    if (!date) {
      showToast('Please select a valid date', 'warning');
      return;
    }
    if (parsedQty <= 0) {
      showToast('Quantity must be greater than 0', 'warning');
      return;
    }
    if (parsedRate <= 0) {
      showToast('Purchase rate must be greater than 0', 'warning');
      return;
    }

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

      if (purchaseToEdit) {
        await api.updatePurchase(purchaseToEdit.id, payload);
        showToast('Purchase entry updated successfully', 'success');
      } else {
        await api.createPurchase(payload);
        showToast(`Purchased ${parsedQty} ${unit} at ${currency}${parsedRate}/${unit} recorded!`, 'success');
      }

      triggerRefresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save milk purchase', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {purchaseToEdit ? 'Edit Milk Purchase' : 'Add Milk Purchase'}
              </h3>
              <p className="text-xs text-emerald-100">
                Record raw milk purchase from dairy farmers/suppliers
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Row 1: Date & Supplier Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Purchase Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Select Supplier (Optional)
              </label>
              <select
                value={supplierId}
                onChange={e => handleSupplierSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="">-- New / Walk-in Supplier --</option>
                {suppliersList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.phone || 'No phone'})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Supplier Name Input (if new or custom) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supplier Name
            </label>
            <input
              type="text"
              placeholder="e.g. Kadir Dairy Farm, Rahim Molla"
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
            />
          </div>

          {/* Row 2: Quantity, Unit, Purchase Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold tabular-nums focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as 'Liter' | 'KG')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              >
                <option value="Liter">Liter (L)</option>
                <option value="KG">KG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rate per {unit} ({currency}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                placeholder="60"
                value={purchaseRate}
                onChange={e => setPurchaseRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold tabular-nums focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Auto Calculation Display Card */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Calculation: {parsedQty || 0} {unit} × {currency}{parsedRate || 0}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Cost:</span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Collapsible/Optional Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Supplier Phone
              </label>
              <input
                type="text"
                placeholder="017xxxxxxxx"
                value={supplierPhone}
                onChange={e => setSupplierPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Supplier Address
              </label>
              <input
                type="text"
                placeholder="e.g. Savar, Manikganj"
                value={supplierAddress}
                onChange={e => setSupplierAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" /> Notes / Fat / Morning Batch
            </label>
            <input
              type="text"
              placeholder="e.g. Morning milking, FAT 4.2%, chilled can delivery"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
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
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Saving...' : purchaseToEdit ? 'Update Purchase' : 'Save Purchase'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
