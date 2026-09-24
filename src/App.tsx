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

// Error Boundary Component to prevent white screens
class ViewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('View Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 shadow-sm text-center space-y-4 my-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">পৃষ্ঠাটি লোড হতে সমস্যা হয়েছে</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {this.state.error?.message || 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
          >
            আবার চেষ্টা করুন (Retry)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
          <ViewErrorBoundary>
            <Suspense fallback={<ViewLoadingSkeleton />}>
              {renderActiveView()}
            </Suspense>
          </ViewErrorBoundary>
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
