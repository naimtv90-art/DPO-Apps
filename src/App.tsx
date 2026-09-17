import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileDrawer } from './components/MobileDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { FloatingActionFAB } from './components/FloatingActionFAB';
import { ToastContainer } from './components/ToastContainer';
import { LoginModal } from './components/modals/LoginModal';

// Modals
import { AddPurchaseModal } from './components/modals/AddPurchaseModal';
import { AddSaleModal } from './components/modals/AddSaleModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';

// Views
import { DashboardView } from './views/DashboardView';
import { AddPurchaseView } from './views/AddPurchaseView';
import { PurchaseHistoryView } from './views/PurchaseHistoryView';
import { AddSaleView } from './views/AddSaleView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { StockView } from './views/StockView';
import { RatesView } from './views/RatesView';
import { DailySummaryView } from './views/DailySummaryView';
import { ReportsView } from './views/ReportsView';
import { ExpensesView } from './views/ExpensesView';
import { CustomersView } from './views/CustomersView';
import { SuppliersView } from './views/SuppliersView';
import { SettingsView } from './views/SettingsView';

export const AppContent: React.FC = () => {
  const { user, activeView, activeModal, closeModal, triggerRefresh } = useApp();

  if (!user) {
    return <LoginModal />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'add-purchase':
        return <AddPurchaseView />;
      case 'purchase-history':
        return <PurchaseHistoryView />;
      case 'add-sale':
        return <AddSaleView />;
      case 'sales-history':
        return <SalesHistoryView />;
      case 'inventory':
        return <StockView />;
      case 'rates':
        return <RatesView />;
      case 'daily-summary':
        return <DailySummaryView />;
      case 'reports':
        return <ReportsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Network Connectivity Banner */}
      <NetworkStatusBanner />

      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Sidebar (Desktop) */}
        <Sidebar />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Mobile Drawer Navigation */}
      <MobileDrawer />

      {/* Mobile Quick Action Speed Dial Floating Button */}
      <FloatingActionFAB />

      {/* Toast Notification Layer */}
      <ToastContainer />

      {/* Global Quick Action Modals */}
      {activeModal?.type === 'ADD_PURCHASE' && (
        <AddPurchaseModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={triggerRefresh}
        />
      )}

      {activeModal?.type === 'ADD_SALE' && (
        <AddSaleModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={triggerRefresh}
        />
      )}

      {activeModal?.type === 'ADD_EXPENSE' && (
        <AddExpenseModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={triggerRefresh}
        />
      )}

    </div>
  );
};

export default function App() {
  return <AppContent />;
}
