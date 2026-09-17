import React from 'react';
import { useApp, NavView } from '../context/AppContext';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  Menu
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView, setIsMobileDrawerOpen } = useApp();

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'add-purchase' as NavView, label: 'Purchase', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'add-sale' as NavView, label: 'Sale', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'inventory' as NavView, label: 'Stock', icon: <Boxes className="w-5 h-5" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around">
      {navItems.map(item => {
        const isActive = activeView === item.id || (item.id === 'add-purchase' && activeView === 'purchase-history') || (item.id === 'add-sale' && activeView === 'sales-history');
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/50' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* More / Menu Button */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-200"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">More</span>
      </button>
    </div>
  );
};
