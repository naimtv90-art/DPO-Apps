import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Product, ProductSale } from '../types';
import { Package, Plus, ShoppingBag, Trash2, Edit2, Save, X, Calendar, User, Phone, FileText, CheckCircle, TrendingUp } from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { showToast, triggerRefresh, currency, formatCurrency } = useApp();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'add-sale' | 'history'>('add-sale');

  // Edit product modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'Piece', default_price: '', description: '' });

  // Sale form
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [saleQty, setSaleQty] = useState('1');
  const [salePrice, setSalePrice] = useState('');
  const [saleCustomer, setSaleCustomer] = useState('');
  const [salePhone, setSalePhone] = useState('');
  const [salePayment, setSalePayment] = useState<'Paid' | 'Due' | 'Partial'>('Paid');
  const [saleNotes, setSaleNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoadingProducts(true);
    try {
      const [pRes, sRes] = await Promise.all([api.getProducts(), api.getProductSales()]);
      setProducts(pRes.products);
      setSales(sRes.sales);
      setStats(sRes.stats || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Auto-fill price when product selected
  const handleProductSelect = (idStr: string) => {
    setSelectedProductId(idStr);
    const prod = products.find(p => String(p.id) === idStr);
    if (prod) {
      setSalePrice(String(prod.default_price));
    }
  };

  const selectedProduct = products.find(p => String(p.id) === selectedProductId);
  const parsedQty = parseFloat(saleQty) || 0;
  const parsedPrice = parseFloat(salePrice) || 0;
  const saleTotal = parsedQty * parsedPrice;

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return showToast('পণ্য সিলেক্ট করুন', 'warning');
    if (parsedQty <= 0) return showToast('পরিমাণ দিন', 'warning');
    try {
      setSubmitting(true);
      await api.createProductSale({
        date: saleDate,
        product_id: parseInt(selectedProductId),
        product_name: selectedProduct?.name || '',
        quantity: parsedQty,
        unit: selectedProduct?.unit || 'Piece',
        selling_price: parsedPrice,
        customer_name: saleCustomer.trim() || 'Cash Customer',
        customer_phone: salePhone,
        payment_status: salePayment,
        notes: saleNotes.trim(),
      });
      showToast('বিক্রয় সেভ হয়েছে! ✅', 'success');
      triggerRefresh();
      setSaleQty('1');
      setSaleCustomer('');
      setSalePhone('');
      setSaleNotes('');
      setActiveTab('history');
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Error saving sale', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (!confirm('এই রেকর্ড মুছবেন?')) return;
    try {
      await api.deleteProductSale(id);
      showToast('মুছে গেছে', 'success');
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return showToast('নাম দিন', 'warning');
    try {
      await api.createProduct({ name: newProduct.name, unit: newProduct.unit, default_price: parseFloat(newProduct.default_price) || 0, description: newProduct.description });
      showToast('পণ্য যোগ হয়েছে ✅', 'success');
      setNewProduct({ name: '', unit: 'Piece', default_price: '', description: '' });
      setShowAddProduct(false);
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, { name: editingProduct.name, unit: editingProduct.unit, default_price: editingProduct.default_price, description: editingProduct.description });
      showToast('আপডেট হয়েছে ✅', 'success');
      setEditingProduct(null);
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('এই পণ্য মুছবেন?')) return;
    try {
      await api.deleteProduct(id);
      showToast('মুছে গেছে', 'success');
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">পণ্য বিক্রয়</h1>
              <p className="text-xs text-purple-200">দই ও অন্যান্য পণ্যের হিসাব</p>
            </div>
          </div>
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-purple-300">মোট বিক্রয়</div>
              <div className="text-lg font-black">{formatCurrency(parseFloat(stats.total_revenue) || 0)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-purple-300">রেকর্ড</div>
              <div className="text-lg font-black">{stats.total_count || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
        {[
          { key: 'add-sale', label: '+ বিক্রয় যোগ', icon: ShoppingBag },
          { key: 'history', label: 'ইতিহাস', icon: TrendingUp },
          { key: 'catalog', label: 'পণ্য তালিকা', icon: Package },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === key
                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ADD SALE TAB */}
      {activeTab === 'add-sale' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-600" /> নতুন বিক্রয় এন্ট্রি
          </h2>
          <form onSubmit={handleAddSale} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> তারিখ
                </label>
                <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">পণ্য সিলেক্ট করুন *</label>
                <select value={selectedProductId} onChange={e => handleProductSelect(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500">
                  <option value="">-- পণ্য বেছে নিন --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit}) — {currency}{p.default_price}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">পরিমাণ *</label>
                <input type="number" step="1" min="1" value={saleQty} onChange={e => setSaleQty(e.target.value)} required placeholder="1"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">দাম ({currency}) *</label>
                <input type="number" step="0.5" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} required placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500" />
              </div>
            </div>

            {/* Total */}
            {parsedQty > 0 && (
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">{parsedQty} × {currency}{parsedPrice}</span>
                <span className="text-xl font-black text-purple-700 dark:text-purple-300">{formatCurrency(saleTotal)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> ক্রেতার নাম
                </label>
                <input type="text" value={saleCustomer} onChange={e => setSaleCustomer(e.target.value)} placeholder="Cash Customer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> ফোন
                </label>
                <input type="text" value={salePhone} onChange={e => setSalePhone(e.target.value)} placeholder="017xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">পেমেন্ট স্ট্যাটাস</label>
                <select value={salePayment} onChange={e => setSalePayment(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500">
                  <option value="Paid">Paid ✅</option>
                  <option value="Due">Due (বাকি)</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> নোট
                </label>
                <input type="text" value={saleNotes} onChange={e => setSaleNotes(e.target.value)} placeholder="যেকোনো নোট..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition disabled:opacity-50">
                {submitting ? 'সেভ হচ্ছে...' : '✅ বিক্রয় সেভ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-white">বিক্রয় ইতিহাস</h2>
          </div>
          {loadingProducts ? (
            <div className="p-8 text-center text-slate-400 text-sm">লোড হচ্ছে...</div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">কোনো বিক্রয় নেই। উপরে যোগ করুন!</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{s.product_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        s.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        s.payment_status === 'Due' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}>{s.payment_status}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.date} · {s.quantity} {s.unit} · {s.customer_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-purple-700 dark:text-purple-400 text-sm tabular-nums">{formatCurrency(s.total_amount)}</span>
                    <button onClick={() => handleDeleteSale(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 dark:text-white">পণ্য তালিকা</h2>
            <button onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30">
              <Plus className="w-3.5 h-3.5" /> নতুন পণ্য
            </button>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <form onSubmit={handleAddProduct} className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
              <h3 className="font-bold text-purple-800 dark:text-purple-200 text-sm">নতুন পণ্য যোগ করুন</h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="পণ্যের নাম *" required
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" />
                <select value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none">
                  <option value="Piece">Piece (টি)</option>
                  <option value="KG">KG</option>
                  <option value="Liter">Liter</option>
                  <option value="Pack">Pack</option>
                </select>
                <input type="number" value={newProduct.default_price} onChange={e => setNewProduct(p => ({ ...p, default_price: e.target.value }))} placeholder={`ডিফল্ট দাম (${currency})`}
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" />
                <input type="text" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="বিবরণ (ঐচ্ছিক)"
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> সেভ করুন
                </button>
                <button type="button" onClick={() => setShowAddProduct(false)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" /> বাতিল
                </button>
              </div>
            </form>
          )}

          {/* Product Cards */}
          <div className="space-y-3">
            {loadingProducts ? (
              <div className="p-6 text-center text-slate-400 text-sm">লোড হচ্ছে...</div>
            ) : products.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">কোনো পণ্য নেই।</div>
            ) : products.map(p => (
              <div key={p.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                {editingProduct?.id === p.id ? (
                  <form onSubmit={handleUpdateProduct} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={editingProduct.name} onChange={e => setEditingProduct(ep => ep ? { ...ep, name: e.target.value } : ep)} required
                        className="px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" />
                      <select value={editingProduct.unit} onChange={e => setEditingProduct(ep => ep ? { ...ep, unit: e.target.value } : ep)}
                        className="px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none">
                        <option value="Piece">Piece</option>
                        <option value="KG">KG</option>
                        <option value="Liter">Liter</option>
                        <option value="Pack">Pack</option>
                      </select>
                      <input type="number" value={editingProduct.default_price} onChange={e => setEditingProduct(ep => ep ? { ...ep, default_price: parseFloat(e.target.value) } : ep)}
                        className="px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" />
                      <input type="text" value={editingProduct.description || ''} onChange={e => setEditingProduct(ep => ep ? { ...ep, description: e.target.value } : ep)}
                        placeholder="বিবরণ" className="px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center gap-1"><Save className="w-3 h-3" /> সেভ</button>
                      <button type="button" onClick={() => setEditingProduct(null)} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center gap-1"><X className="w-3 h-3" /> বাতিল</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.unit} · ডিফল্ট দাম: {currency}{p.default_price}</div>
                      {p.description && <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingProduct(p)} className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-500 hover:text-purple-700 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
