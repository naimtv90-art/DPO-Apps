import React, { Suspense, lazy } from 'react';
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
import { AddInvestmentModal } from './components/modals/AddInvestmentModal';
import { AddWasteModal } from './components/modals/AddWasteModal';

// Code-split Lazy-Loaded Views for High-Speed Initial Load
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const AddPurchaseView = lazy(() => import('./views/AddPurchaseView').then(m => ({ default: m.AddPurchaseView })));
const PurchaseHistoryView = lazy(() => import('./views/PurchaseHistoryView').then(m => ({ default: m.PurchaseHistoryView })));
const AddSaleView = lazy(() => import('./views/AddSaleView').then(m => ({ default: m.AddSaleView })));
const SalesHistoryView = lazy(() => import('./views/SalesHistoryView').then(m => ({ default: m.SalesHistoryView })));
const StockView = lazy(() => import('./views/StockView').then(m => ({ default: m.StockView })));
const WasteView = lazy(() => import('./views/WasteView').then(m => ({ default: m.WasteView })));
const InvestmentsView = lazy(() => import('./views/InvestmentsView').then(m => ({ default: m.InvestmentsView })));
const RatesView = lazy(() => import('./views/RatesView').then(m => ({ default: m.RatesView })));
const DailySummaryView = lazy(() => import('./views/DailySummaryView').then(m => ({ default: m.DailySummaryView })));
const ReportsView = lazy(() => import('./views/ReportsView').then(m => ({ default: m.ReportsView })));
const ExpensesView = lazy(() => import('./views/ExpensesView').then(m => ({ default: m.ExpensesView })));
const CustomersView = lazy(() => import('./views/CustomersView').then(m => ({ default: m.CustomersView })));
const SuppliersView = lazy(() => import('./views/SuppliersView').then(m => ({ default: m.SuppliersView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const ProductsView = lazy(() => import('./views/ProductsView').then(m => ({ default: m.ProductsView })));

// Sleek Skeleton View Loader
const ViewLoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800/60 w-full" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
      <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
      <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
      <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
    </div>
    <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800/60 w-full" />
  </div>
);

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
      case 'waste':
        return <WasteView />;
      case 'investments':
        return <InvestmentsView />;
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
      case 'products':
        return <ProductsView />;
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

        {/* Dynamic Main Workspace Content with Fast Suspense Code-Splitting */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <Suspense fallback={<ViewLoadingSkeleton />}>
            {renderActiveView()}
          </Suspense>
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

      {activeModal?.type === 'ADD_INVESTMENT' && (
        <AddInvestmentModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={triggerRefresh}
        />
      )}

      {activeModal?.type === 'ADD_WASTE' && (
        <AddWasteModal
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
