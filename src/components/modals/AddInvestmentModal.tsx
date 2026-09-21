import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { PartnerInvestment, Partner } from '../../types';
import { X, Briefcase, Calendar, CreditCard, DollarSign, FileText, User } from 'lucide-react';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentToEdit?: PartnerInvestment | null;
  onSuccess?: () => void;
}

const INVESTMENT_TYPES: ('Capital Investment' | 'Working Capital' | 'Machinery/Equipment' | 'Reinvestment' | 'Other')[] = [
  'Capital Investment',
  'Working Capital',
  'Machinery/Equipment',
  'Reinvestment',
  'Other'
];

const PAYMENT_METHODS: ('Cash' | 'Bank Transfer' | 'bKash' | 'Nagad' | 'Rocket' | 'Cheque')[] = [
  'Bank Transfer',
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Cheque'
];

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  investmentToEdit,
  onSuccess
}) => {
  const { showToast, triggerRefresh, currency, formatCurrency } = useApp();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partnerName, setPartnerName] = useState('');
  const [customPartner, setCustomPartner] = useState('');
  const [amount, setAmount] = useState('');
  const [investmentType, setInvestmentType] = useState<PartnerInvestment['investment_type']>('Capital Investment');
  const [paymentMethod, setPaymentMethod] = useState<PartnerInvestment['payment_method']>('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Fetch registered partners list
    api.getPartners()
      .then(res => {
        if (res && res.partners) {
          setPartners(res.partners);
          if (!investmentToEdit && res.partners.length > 0) {
            setPartnerName(res.partners[0].name);
          }
        }
      })
      .catch(console.error);

    if (investmentToEdit) {
      setDate(investmentToEdit.date);
      setPartnerName(investmentToEdit.partner_name);
      setAmount(String(investmentToEdit.amount));
      setInvestmentType(investmentToEdit.investment_type);
      setPaymentMethod(investmentToEdit.payment_method);
      setNotes(investmentToEdit.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setInvestmentType('Capital Investment');
      setPaymentMethod('Bank Transfer');
      setNotes('');
    }
  }, [isOpen, investmentToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPartner = partnerName === '__CUSTOM__' ? customPartner.trim() : partnerName.trim();
    const amt = parseFloat(amount);

    if (!date) return showToast('Date is required', 'warning');
    if (!finalPartner) return showToast('Partner name is required', 'warning');
    if (isNaN(amt) || amt <= 0) return showToast('Investment amount must be greater than 0', 'warning');

    try {
      setLoading(true);
      const payload: Partial<PartnerInvestment> = {
        date,
        partner_name: finalPartner,
        amount: amt,
        investment_type: investmentType,
        payment_method: paymentMethod,
        notes: notes.trim(),
      };

      if (investmentToEdit) {
        await api.updateInvestment(investmentToEdit.id, payload);
        showToast('Investment record updated successfully', 'success');
      } else {
        await api.createInvestment(payload);
        showToast(`Investment of ${formatCurrency(amt)} from ${finalPartner} recorded!`, 'success');
      }

      triggerRefresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save investment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {investmentToEdit ? 'Edit Partner Investment' : 'Add Partner Investment'}
              </h2>
              <p className="text-[11px] text-blue-100 font-medium">
                ব্যবসায়িক পার্টনার ইনভেস্টমেন্ট রেকর্ড
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Partner Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Partner Name / পার্টনারের নাম *
            </label>
            <select
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} {p.role ? `(${p.role})` : ''}
                </option>
              ))}
              <option value="__CUSTOM__">+ Add Custom / Other Partner...</option>
            </select>
          </div>

          {/* Custom Partner Name Input if chosen */}
          {partnerName === '__CUSTOM__' && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Enter New Partner Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Md. Rahim Ahmed"
                value={customPartner}
                onChange={(e) => setCustomPartner(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Investment Amount & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                Amount ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Investment Type & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Investment Type
              </label>
              <select
                value={investmentType}
                onChange={(e) => setInvestmentType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {INVESTMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes / Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Investment terms, bank transaction reference, equity notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : investmentToEdit ? 'Update Investment' : 'Record Investment'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
