import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, User } from '../types';
import { api } from '../services/api';

export type NavView = 
  | 'dashboard'
  | 'add-purchase'
  | 'purchase-history'
  | 'add-sale'
  | 'sales-history'
  | 'inventory'
  | 'rates'
  | 'daily-summary'
  | 'reports'
  | 'expenses'
  | 'customers'
  | 'suppliers'
  | 'settings';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  activeModal: { type: string; data?: any } | null;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
  currency: string;
  formatCurrency: (amount: number | string) => string;
}

const defaultSettings: AppSettings = {
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('dpo_user');
    return savedUser ? JSON.parse(savedUser) : { id: 1, username: 'demo', name: 'Dairy Pure Admin', role: 'admin' };
  });
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<{ type: string; data?: any } | null>(null);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const openModal = (type: string, data?: any) => {
    setActiveModal({ type, data });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('dpo_user', JSON.stringify(userData));
    localStorage.setItem('dpo_token', token);
    showToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dpo_user');
    localStorage.removeItem('dpo_token');
    showToast('Logged out successfully', 'info');
  };

  // Load settings from backend
  useEffect(() => {
    api.getSettings()
      .then(res => {
        if (res.settings) {
          setSettings(prev => ({ ...prev, ...res.settings }));
          if (res.settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      })
      .catch(err => console.error('Failed to load settings', err));
  }, [refreshKey]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      await api.saveSettings(newSettings);
      setSettings(prev => {
        const merged = { ...prev, ...newSettings };
        if (merged.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return merged;
      });
      showToast('Settings saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const currency = settings.currency || '৳';

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${currency}0`;
    return `${currency}${num.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        user,
        login,
        logout,
        settings,
        updateSettings,
        toasts,
        showToast,
        removeToast,
        refreshKey,
        triggerRefresh,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        activeModal,
        openModal,
        closeModal,
        currency,
        formatCurrency,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
