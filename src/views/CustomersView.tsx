import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Customer } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  History, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import { CustomerModal } from '../components/modals/CustomerModal';
import { CustomerHistoryModal } from '../components/modals/CustomerHistoryModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const CustomersView: React.FC = () => {
  const { formatCurrency, currency, showToast, refreshKey } = useApp();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [historyCustomerId, setHistoryCustomerId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    api.getCustomers()
      .then(res => setCustomers(res.customers))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [refreshKey]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.deleteCustomer(deleteId);
      showToast('Customer deleted', 'success');
      setDeleteId(null);
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete customer', 'error');
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.address && c.address.toLowerCase().includes(search.toLowerCase())) ||
    c.customer_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            Customer Directory & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage residential delivery clients, tea stalls, restaurants, and wholesale accounts
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name, phone number, address, or type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white outline-none"
        />
      </div>

      {/* Grid of Customer Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-blue-600" />
          Loading customer directory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 text-center text-slate-400 text-xs">
          No customer records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div 
              key={c.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {c.customer_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditCustomer(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Customer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Purchased</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                    {(c.total_qty || 0).toFixed(1)} L • {formatCurrency(c.total_spent || 0)}
                  </span>
                </div>

                <button
                  onClick={() => setHistoryCustomerId(c.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Orders ({c.order_count || 0})</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editCustomer) && (
        <CustomerModal
          isOpen={true}
          onClose={() => { setIsAddModalOpen(false); setEditCustomer(null); }}
          customerToEdit={editCustomer}
          onSuccess={fetchCustomers}
        />
      )}

      {/* Customer Order History Modal */}
      {historyCustomerId && (
        <CustomerHistoryModal
          isOpen={true}
          onClose={() => setHistoryCustomerId(null)}
          customerId={historyCustomerId}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Customer Profile"
        message="Are you sure you want to delete this customer account?"
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
};
