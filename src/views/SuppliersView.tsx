import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Supplier } from '../types';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  History, 
  Edit, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';
import { SupplierModal } from '../components/modals/SupplierModal';
import { SupplierHistoryModal } from '../components/modals/SupplierHistoryModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const SuppliersView: React.FC = () => {
  const { formatCurrency, currency, showToast, refreshKey } = useApp();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [historySupplierId, setHistorySupplierId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchSuppliers = () => {
    setLoading(true);
    api.getSuppliers()
      .then(res => setSuppliers(res.suppliers))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSuppliers();
  }, [refreshKey]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.deleteSupplier(deleteId);
      showToast('Supplier removed successfully', 'success');
      setDeleteId(null);
      fetchSuppliers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete supplier', 'error');
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone && s.phone.includes(search)) ||
    (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-emerald-600" />
            Dairy Suppliers & Farmers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage source dairy farms, collection centers, and raw milk procurement accounts
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search supplier farm name, location, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white outline-none"
        />
      </div>

      {/* Grid of Supplier Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
          Loading supplier records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 text-center text-slate-400 text-xs">
          No supplier records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div 
              key={s.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Dairy Partner
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditSupplier(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Supplier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Supplied</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                    {(s.total_qty || 0).toFixed(1)} L • {formatCurrency(s.total_paid || 0)}
                  </span>
                </div>

                <button
                  onClick={() => setHistorySupplierId(s.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Invoices ({s.purchase_count || 0})</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {(isAddModalOpen || editSupplier) && (
        <SupplierModal
          isOpen={true}
          onClose={() => { setIsAddModalOpen(false); setEditSupplier(null); }}
          supplierToEdit={editSupplier}
          onSuccess={fetchSuppliers}
        />
      )}

      {/* Supplier Invoices History Modal */}
      {historySupplierId && (
        <SupplierHistoryModal
          isOpen={true}
          onClose={() => setHistorySupplierId(null)}
          supplierId={historySupplierId}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Supplier Profile"
        message="Are you sure you want to delete this supplier profile?"
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
};
