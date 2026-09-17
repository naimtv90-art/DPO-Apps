import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Lock, User as UserIcon } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, showToast, settings } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      showToast('Please enter username and password', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ username: cleanUser, password: cleanPass });
      if (res && res.user && res.token) {
        login(res.user, res.token);
        return;
      }
    } catch (err: any) {
      // If server returned error or is offline, check demo credentials
      if ((cleanUser.toLowerCase() === 'demo' || cleanUser.toLowerCase() === 'admin') && cleanPass === 'demo123') {
        login({ id: 1, username: 'demo', name: 'Dairy Pure Admin', role: 'admin' }, 'demo-access-token');
        return;
      }
      showToast(err.message || 'Invalid credentials. Please try again', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden">
        
        {/* Glow effect background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-xl bg-white/20 p-1" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {settings.business_name || 'Dairy Pure & Organic'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Milk Purchase & Sales Operations Management
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Username / Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          © {new Date().getFullYear()} Dairy Pure & Organic • All Rights Reserved
        </p>
      </div>
    </div>
  );
};
