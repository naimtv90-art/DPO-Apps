import React from 'react';
import { useApp, NavView } from '../context/AppContext';
import {
  X,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  TrendingUp,
  CalendarCheck,
  BarChart3,
  Receipt,
  Users,
  Truck,
  Settings as SettingsIcon,
  PlusCircle,
  History,
  LogOut,
  Trash2,
  Briefcase,
  Package
} from 'lucide-react';

export const MobileDrawer: React.FC = () => {
  const { 
    isMobileDrawerOpen, 
    setIsMobileDrawerOpen, 
    activeView, 
    setActiveView, 
    settings,
    user,
    logout
  } = useApp();

  if (!isMobileDrawerOpen) return null;

  const navigateTo = (view: NavView) => {
    setActiveView(view);
    setIsMobileDrawerOpen(false);
  };

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'add-purchase' as NavView, label: 'Add Milk Purchase', icon: <PlusCircle className="w-5 h-5 text-emerald-500" /> },
    { id: 'purchase-history' as NavView, label: 'Purchase History', icon: <ShoppingBag className="w-5 h-5 text-emerald-500" /> },
    { id: 'add-sale' as NavView, label: 'Add Milk Sale', icon: <PlusCircle className="w-5 h-5 text-sky-500" /> },
    { id: 'sales-history' as NavView, label: 'Sales History', icon: <ShoppingCart className="w-5 h-5 text-sky-500" /> },
    { id: 'inventory' as NavView, label: 'Milk Stock', icon: <Boxes className="w-5 h-5 text-amber-500" /> },
    { id: 'waste' as NavView, label: 'Product Waste', icon: <Trash2 className="w-5 h-5 text-orange-500" /> },
    { id: 'investments' as NavView, label: 'Partner Investments', icon: <Briefcase className="w-5 h-5 text-blue-500" /> },
    { id: 'rates' as NavView, label: 'Rate Management', icon: <TrendingUp className="w-5 h-5 text-purple-500" /> },
    { id: 'daily-summary' as NavView, label: 'Daily Summary', icon: <CalendarCheck className="w-5 h-5 text-teal-500" /> },
    { id: 'reports' as NavView, label: 'Reports', icon: <BarChart3 className="w-5 h-5 text-indigo-500" /> },
    { id: 'expenses' as NavView, label: 'Expenses', icon: <Receipt className="w-5 h-5 text-rose-500" /> },
    { id: 'customers' as NavView, label: 'Customers', icon: <Users className="w-5 h-5 text-blue-500" /> },
    { id: 'suppliers' as NavView, label: 'Suppliers', icon: <Truck className="w-5 h-5 text-emerald-600" /> },
    { id: 'products' as NavView, label: 'পণ্য বিক্রয় (দই)', icon: <Package className="w-5 h-5 text-purple-600" /> },
    { id: 'settings' as NavView, label: 'Settings', icon: <SettingsIcon className="w-5 h-5 text-slate-500" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsMobileDrawerOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-50 overflow-hidden transform transition-transform animate-slideInLeft border-r border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {settings.business_name}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Dairy Operations Hub</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Bar */}
        <div className="px-4 py-3 bg-emerald-50/50 dark:bg-emerald-950/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Logged in as {user?.role || 'Admin'}</p>
          </div>
          <button 
            onClick={() => { setIsMobileDrawerOpen(false); logout(); }}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100/50 dark:hover:bg-rose-950/50"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className={active ? 'text-white' : ''}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">Dairy Pure & Organic App</p>
        </div>

      </div>
    </div>
  );
};
