import React from 'react';
import { useApp, NavView } from '../context/AppContext';
import {
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
  FileText,
  Trash2,
  Briefcase,
  Package
} from 'lucide-react';

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  subItems?: { id: NavView; label: string; icon: React.ReactNode }[];
}

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView } = useApp();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'purchase-history',
      label: 'Milk Purchase',
      icon: <ShoppingBag className="w-5 h-5 text-emerald-500" />,
      subItems: [
        { id: 'add-purchase', label: 'Add Purchase', icon: <PlusCircle className="w-4 h-4" /> },
        { id: 'purchase-history', label: 'Purchase History', icon: <History className="w-4 h-4" /> },
      ]
    },
    {
      id: 'sales-history',
      label: 'Milk Sales',
      icon: <ShoppingCart className="w-5 h-5 text-sky-500" />,
      subItems: [
        { id: 'add-sale', label: 'Add Sale', icon: <PlusCircle className="w-4 h-4" /> },
        { id: 'sales-history', label: 'Sales History', icon: <History className="w-4 h-4" /> },
      ]
    },
    {
      id: 'inventory',
      label: 'Milk Stock',
      icon: <Boxes className="w-5 h-5 text-amber-500" />,
    },
    {
      id: 'waste',
      label: 'Product Waste',
      icon: <Trash2 className="w-5 h-5 text-orange-500" />,
    },
    {
      id: 'investments',
      label: 'Partner Invest',
      icon: <Briefcase className="w-5 h-5 text-blue-500" />,
      badge: '4 Partners',
    },
    {
      id: 'rates',
      label: 'Rate Management',
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
    },
    {
      id: 'daily-summary',
      label: 'Daily Summary',
      icon: <CalendarCheck className="w-5 h-5 text-teal-500" />,
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: <Receipt className="w-5 h-5 text-rose-500" />,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-5 h-5 text-blue-500" />,
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: <Truck className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'products',
      label: 'পণ্য ক্রয়-বিক্রয় (দই)',
      icon: <Package className="w-5 h-5 text-purple-600" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon className="w-5 h-5 text-slate-500" />,
    },
  ];

  const isParentActive = (item: NavItem) => {
    if (item.id === activeView) return true;
    if (item.subItems?.some(sub => sub.id === activeView)) return true;
    return false;
  };

  return (
    <aside className="w-64 shrink-0 hidden lg:block bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto p-4 transition-colors">
      
      {/* Brand Mini Banner */}
      <div className="mb-4 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Branch</p>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Mirpur 12 Hub</p>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      <nav className="space-y-1">
        {navItems.map(item => {
          const active = isParentActive(item);

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                onClick={() => {
                  if (item.subItems && item.subItems.length > 0) {
                    // if currently on one of subitems, keep it, else navigate to primary subitem
                    if (!item.subItems.some(sub => sub.id === activeView)) {
                      setActiveView(item.subItems[1].id);
                    }
                  } else {
                    setActiveView(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={active ? 'text-white' : ''}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </button>

              {/* Sub items if present */}
              {item.subItems && (
                <div className="pl-6 space-y-0.5 pt-0.5 pb-1">
                  {item.subItems.map(sub => {
                    const isSubActive = activeView === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveView(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isSubActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Support Info */}
      <div className="mt-8 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Dairy Pure & Organic</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Hotline: +880 1712-281861</p>
        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">dairypureorganic.com</p>
      </div>

    </aside>
  );
};
