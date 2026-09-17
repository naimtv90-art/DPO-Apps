import React, { useState, useEffect } from 'react';
import { useApp, NavView } from '../context/AppContext';
import { 
  Menu, 
  Sun, 
  Moon, 
  PlusCircle, 
  MinusCircle, 
  LogOut, 
  User, 
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    user, 
    logout, 
    setActiveView, 
    setIsMobileDrawerOpen,
    openModal,
    refreshKey,
    formatCurrency
  } = useApp();

  const [currentStock, setCurrentStock] = useState<number>(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    api.getStock()
      .then(res => setCurrentStock(res.availableStock))
      .catch(err => console.error(err));
  }, [refreshKey]);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div 
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <img 
                  src="/logo.png" 
                  alt="Dairy Pure Organic" 
                  className="w-full h-full object-contain rounded-lg p-0.5 bg-white/10"
                  onError={(e) => {
                    // Fallback to text icon if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }} 
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                    {settings.business_name || 'Dairy Pure & Organic'}
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                    ERP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                  Milk Purchase & Sales Hub • Mirpur 12
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions & Stock Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live Stock Indicator Badge */}
            <div 
              onClick={() => setActiveView('inventory')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition shadow-xs group"
              title="Click to view full stock ledger"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStock > 20 ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentStock > 20 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Stock:
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                {currentStock.toFixed(1)} {settings.default_unit || 'L'}
              </span>
            </div>

            {/* Quick Action Buttons on Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => openModal('ADD_PURCHASE')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold transition shadow-xs active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>+ Purchase</span>
              </button>

              <button
                onClick={() => openModal('ADD_SALE')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-xs font-semibold transition shadow-xs active:scale-95"
              >
                <MinusCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>+ Sale</span>
              </button>
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                      {user?.role || 'Administrator'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveView('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Business Settings
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
