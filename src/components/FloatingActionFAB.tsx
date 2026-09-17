import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, ShoppingBag, ShoppingCart, Receipt } from 'lucide-react';

export const FloatingActionFAB: React.FC = () => {
  const { openModal } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 sm:hidden">
      {/* Expanded Menu Actions */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 mb-3 animate-fadeIn">
          
          <button
            onClick={() => {
              setIsOpen(false);
              openModal('ADD_PURCHASE');
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-emerald-600 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition"
          >
            <span>Add Purchase</span>
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              openModal('ADD_SALE');
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-sky-600 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 active:scale-95 transition"
          >
            <span>Add Sale</span>
            <ShoppingCart className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              openModal('ADD_EXPENSE');
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition"
          >
            <span>Add Expense</span>
            <Receipt className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-700/30 transition-all duration-300 active:scale-95 ${
          isOpen ? 'bg-slate-800 rotate-45' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
        aria-label="Quick Add Menu"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
};
