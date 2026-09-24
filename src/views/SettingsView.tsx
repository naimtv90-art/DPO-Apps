import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppSettings } from '../types';
import { Settings as SettingsIcon, Save, Building, Scale, DollarSign, Server } from 'lucide-react';

const defaultSettingsFallback: AppSettings = {
  business_name: 'Dairy Pure & Organic',
  owner_name: 'Md. Imran Hossain',
  phone: '+880 1712-281861',
  whatsapp: '+880 1775-002340',
  address: 'House 18, Road 4, Block C, Mirpur 12, Dhaka-1216',
  default_unit: 'Liter',
  default_purchase_rate: '60',
  default_selling_rate: '85',
  currency: '৳',
  currency_code: 'BDT',
  theme: 'light'
};

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();

  const [formData, setFormData] = useState<AppSettings>(() => ({
    ...defaultSettingsFallback,
    ...(settings || {})
  }));
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('dpo_custom_api_url') || '');

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings
      }));
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (serverUrl.trim()) {
        localStorage.setItem('dpo_custom_api_url', serverUrl.trim());
      } else {
        localStorage.removeItem('dpo_custom_api_url');
      }
      await updateSettings(formData);
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            System & Business Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure enterprise details, default transaction rates, units, and appearance
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Business Profile */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" /> Business Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Business Name
              </label>
              <input
                type="text"
                required
                value={formData.business_name || ''}
                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Owner / Managing Director
              </label>
              <input
                type="text"
                required
                value={formData.owner_name || ''}
                onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                WhatsApp Order Line
              </label>
              <input
                type="text"
                value={formData.whatsapp || ''}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Hub & Distribution Center Address
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Transaction & Cost Defaults */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" /> Operational & Currency Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Milk Unit
              </label>
              <select
                value={formData.default_unit || 'Liter'}
                onChange={e => setFormData({ ...formData, default_unit: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option value="Liter">Liter (L) - Recommended</option>
                <option value="KG">KG (Kilogram)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Purchase Rate ({formData.currency || '৳'})
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={formData.default_purchase_rate || '60'}
                onChange={e => setFormData({ ...formData, default_purchase_rate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Selling Rate ({formData.currency || '৳'})
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={formData.default_selling_rate || '85'}
                onChange={e => setFormData({ ...formData, default_selling_rate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currency || '৳'}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Currency Code
              </label>
              <input
                type="text"
                value={formData.currency_code || 'BDT'}
                onChange={e => setFormData({ ...formData, currency_code: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Interface Appearance
              </label>
              <select
                value={formData.theme || 'light'}
                onChange={e => setFormData({ ...formData, theme: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option value="light">Light Mode ☀️</option>
                <option value="dark">Dark Mode 🌙</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile App & Remote Server URL */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" /> Mobile App & Server Connection (মোবাইল অ্যাপ সংযোগ)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Capacitor APK & Network
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            মোবাইল APK বা অন্য ডিভাইস থেকে ব্যবহার করতে চাইলে আপনার ব্যাকএন্ড সার্ভার লিংক (যেমন: <code className="text-emerald-600 dark:text-emerald-400">http://192.168.0.x:5000</code> অথবা ক্লাউড হোস্টিং URL) এখানে সেট করতে পারেন। লোকাল পিসির জন্য খালি রাখলেই চলবে।
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Backend Server URL
            </label>
            <input
              type="text"
              placeholder="e.g. http://192.168.0.105:5000 or https://your-domain.com"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
