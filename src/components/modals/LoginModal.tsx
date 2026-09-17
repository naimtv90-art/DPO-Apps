import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Lock, User as UserIcon, Sparkles } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, showToast, settings } = useApp();
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      showToast('Please enter username and password', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ username, password });
      login(res.user, res.token);
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials. Try demo / demo123', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('demo');
    setPassword('demo123');
    showToast('Demo credentials autofilled', 'info');
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

        {/* Demo credentials hint box */}
        <div 
          onClick={handleFillDemo}
          className="mb-6 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Demo Account Credentials</span>
            </div>
            <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-800 px-2 py-0.5 rounded-full font-bold">1-Click Login</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-mono">
            Username: <strong className="text-emerald-700 dark:text-emerald-400">demo</strong> | Password: <strong className="text-emerald-700 dark:text-emerald-400">demo123</strong>
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
