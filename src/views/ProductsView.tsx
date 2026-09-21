import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Product, ProductSale, ProductPurchase, Supplier } from '../types';
import { 
  Package, 
  Plus, 
  ShoppingBag, 
  ShoppingCart, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  TrendingUp, 
  Truck,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { showToast, triggerRefresh, currency, formatCurrency } = useApp();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
  const [salesStats, setSalesStats] = useState<any>({});
  const [purchasesStats, setPurchasesStats] = useState<any>({});
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'add-purchase' | 'add-sale' | 'purchase-history' | 'sales-history' | 'catalog'
  const [activeTab, setActiveTab] = useState<'add-purchase' | 'add-sale' | 'purchase-history' | 'sales-history' | 'catalog'>('add-purchase');

  // Edit product modal / new product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'Piece', default_price: '', description: '' });

  // Purchase form state
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPurchaseProductId, setSelectedPurchaseProductId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchasePhone, setPurchasePhone] = useState('');
  const [purchasePayment, setPurchasePayment] = useState<'Paid' | 'Due' | 'Partial'>('Paid');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Sale form state
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSaleProductId, setSelectedSaleProductId] = useState('');
  const [saleQty, setSaleQty] = useState('1');
  const [salePrice, setSalePrice] = useState('');
  const [saleCustomer, setSaleCustomer] = useState('');
  const [salePhone, setSalePhone] = useState('');
  const [salePayment, setSalePayment] = useState<'Paid' | 'Due' | 'Partial'>('Paid');
  const [saleNotes, setSaleNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, purRes, supRes] = await Promise.all([
        api.getProducts(), 
        api.getProductSales(),
        api.getProductPurchases(),
        api.getSuppliers().catch(() => ({ suppliers: [] }))
      ]);
      setProducts(pRes.products || []);
      setSales(sRes.sales || []);
      setSalesStats(sRes.stats || {});
      setPurchases(purRes.purchases || []);
      setPurchasesStats(purRes.stats || {});
      setSuppliersList(supRes.suppliers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Purchase Product Selection
  const handlePurchaseProductSelect = (idStr: string) => {
    setSelectedPurchaseProductId(idStr);
  };

  const selectedPurchaseProduct = products.find(p => String(p.id) === selectedPurchaseProductId);
  const parsedPurchaseQty = parseFloat(purchaseQty) || 0;
  const parsedPurchasePrice = parseFloat(purchasePrice) || 0;
  const purchaseTotal = parsedPurchaseQty * parsedPurchasePrice;

  // Sale Product Selection
  const handleSaleProductSelect = (idStr: string) => {
    setSelectedSaleProductId(idStr);
    const prod = products.find(p => String(p.id) === idStr);
    if (prod) {
      setSalePrice(String(prod.default_price));
    }
  };

  const selectedSaleProduct = products.find(p => String(p.id) === selectedSaleProductId);
  const parsedSaleQty = parseFloat(saleQty) || 0;
  const parsedSalePrice = parseFloat(salePrice) || 0;
  const saleTotal = parsedSaleQty * parsedSalePrice;

  // Handle Add Purchase
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseProductId) return showToast('পণ্য সিলেক্ট করুন', 'warning');
    if (parsedPurchaseQty <= 0) return showToast('পরিমাণ দিন', 'warning');
    if (parsedPurchasePrice < 0) return showToast('সঠিক দর/দাম দিন', 'warning');

    try {
      setSubmitting(true);
      await api.createProductPurchase({
        date: purchaseDate,
        product_id: parseInt(selectedPurchaseProductId),
        product_name: selectedPurchaseProduct?.name || '',
        quantity: parsedPurchaseQty,
        unit: selectedPurchaseProduct?.unit || 'Piece',
        purchase_price: parsedPurchasePrice,
        supplier_name: purchaseSupplier.trim() || 'General Supplier',
        supplier_phone: purchasePhone.trim(),
        payment_status: purchasePayment,
        notes: purchaseNotes.trim(),
      });
      showToast('দই ক্রয় সেভ হয়েছে! ✅', 'success');
      triggerRefresh();
      setPurchaseQty('1');
      setPurchasePrice('');
      setPurchaseSupplier('');
      setPurchasePhone('');
      setPurchaseNotes('');
      setActiveTab('purchase-history');
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'ক্রয় সংরক্ষণে সমস্যা হয়েছে', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Purchase
  const handleDeletePurchase = async (id: number) => {
    if (!confirm('এই ক্রয়ের রেকর্ড মুছবেন?')) return;
    try {
      await api.deleteProductPurchase(id);
      showToast('ক্রয় রেকর্ড মুছে ফেলা হয়েছে', 'success');
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Add Sale
  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleProductId) return showToast('পণ্য সিলেক্ট করুন', 'warning');
    if (parsedSaleQty <= 0) return showToast('পরিমাণ দিন', 'warning');
    try {
      setSubmitting(true);
      await api.createProductSale({
        date: saleDate,
        product_id: parseInt(selectedSaleProductId),
        product_name: selectedSaleProduct?.name || '',
        quantity: parsedSaleQty,
        unit: selectedSaleProduct?.unit || 'Piece',
        selling_price: parsedSalePrice,
        customer_name: saleCustomer.trim() || 'Cash Customer',
        customer_phone: salePhone.trim(),
        payment_status: salePayment,
        notes: saleNotes.trim(),
      });
      showToast('বিক্রয় সেভ হয়েছে! ✅', 'success');
      triggerRefresh();
      setSaleQty('1');
      setSaleCustomer('');
      setSalePhone('');
      setSaleNotes('');
      setActiveTab('sales-history');
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Error saving sale', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Sale
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

  // Catalog Add / Update / Delete
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return showToast('নাম দিন', 'warning');
    try {
      await api.createProduct({ 
        name: newProduct.name, 
        unit: newProduct.unit, 
        default_price: parseFloat(newProduct.default_price) || 0, 
        description: newProduct.description 
      });
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
      await api.updateProduct(editingProduct.id, { 
        name: editingProduct.name, 
        unit: editingProduct.unit, 
        default_price: editingProduct.default_price, 
        description: editingProduct.description 
      });
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

  const totalPurchaseCost = parseFloat(purchasesStats.total_cost) || 0;
  const totalSalesRevenue = parseFloat(salesStats.total_revenue) || 0;
  const grossProfit = totalSalesRevenue - totalPurchaseCost;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">পণ্য ক্রয়-বিক্রয় (দই)</h1>
              <p className="text-xs text-purple-200">দই ও অন্যান্য পণ্য কেনা, বেচা এবং স্টক হিসাব</p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-black/20 p-2.5 rounded-2xl border border-white/10">
            <div className="text-center sm:text-right px-1">
              <div className="text-[10px] text-purple-200 font-medium">মোট ক্রয়</div>
              <div className="text-sm sm:text-base font-black text-rose-300">{formatCurrency(totalPurchaseCost)}</div>
            </div>
            <div className="text-center sm:text-right px-1 border-x border-white/10">
              <div className="text-[10px] text-purple-200 font-medium">মোট বিক্রয়</div>
              <div className="text-sm sm:text-base font-black text-emerald-300">{formatCurrency(totalSalesRevenue)}</div>
            </div>
            <div className="text-center sm:text-right px-1">
              <div className="text-[10px] text-purple-200 font-medium">লাভ/মার্জিন</div>
              <div className={`text-sm sm:text-base font-black ${grossProfit >= 0 ? 'text-green-300' : 'text-rose-400'}`}>
                {formatCurrency(grossProfit)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
        {[
          { key: 'add-purchase', label: '+ ক্রয় যোগ (কেনা)', icon: ShoppingBag, color: 'text-rose-600 dark:text-rose-400' },
          { key: 'add-sale', label: '+ বিক্রয় যোগ (বেচা)', icon: ShoppingCart, color: 'text-purple-600 dark:text-purple-400' },
          { key: 'purchase-history', label: 'ক্রয় ইতিহাস', icon: ArrowDownCircle, color: 'text-amber-600 dark:text-amber-400' },
          { key: 'sales-history', label: 'বিক্রয় ইতিহাস', icon: ArrowUpCircle, color: 'text-emerald-600 dark:text-emerald-400' },
          { key: 'catalog', label: 'পণ্য তালিকা', icon: Package, color: 'text-blue-600 dark:text-blue-400' },
        ].map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* 1. ADD PURCHASE TAB (দই ক্রয় যোগ) */}
      {activeTab === 'add-purchase' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-600" /> দই বা পণ্য ক্রয় এন্ট্রি (Purchase Entry)
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-semibold">
              কেনার হিসাব
            </span>
          </div>

          <form onSubmit={handleAddPurchase} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> ক্রয়ের তারিখ *
                </label>
                <input 
                  type="date" 
                  value={purchaseDate} 
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500" 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  পণ্য বেছে নিন (দই ইত্যাদি) *
                </label>
                <select 
                  value={selectedPurchaseProductId} 
                  onChange={e => handlePurchaseProductSelect(e.target.value)} 
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500"
                >
                  <option value="">-- পণ্য নির্বাচন করুন --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  পরিমাণ ({selectedPurchaseProduct?.unit || 'Piece'}) *
                </label>
                <input 
                  type="number" 
                  step="any" 
                  min="0.1" 
                  value={purchaseQty} 
                  onChange={e => setPurchaseQty(e.target.value)} 
                  required 
                  placeholder="যেমন: 10"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ক্রয় মূল্য প্রতি {selectedPurchaseProduct?.unit || 'একক'} ({currency}) *
                </label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  value={purchasePrice} 
                  onChange={e => setPurchasePrice(e.target.value)} 
                  required 
                  placeholder="যেমন: 25 বা 100"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500" 
                />
              </div>
            </div>

            {/* Total Calculation */}
            {parsedPurchaseQty > 0 && parsedPurchasePrice > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-600 dark:text-rose-300 font-semibold block">মোট ক্রয় খরচ</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {parsedPurchaseQty} {selectedPurchaseProduct?.unit || 'একক'} × {currency}{parsedPurchasePrice}
                  </span>
                </div>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-300">
                  {formatCurrency(purchaseTotal)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> সরবরাহকারী (Supplier)
                </label>
                <input 
                  type="text" 
                  list="suppliers-datalist"
                  value={purchaseSupplier} 
                  onChange={e => {
                    setPurchaseSupplier(e.target.value);
                    const matched = suppliersList.find(s => s.name.toLowerCase() === e.target.value.toLowerCase());
                    if (matched && matched.phone) setPurchasePhone(matched.phone);
                  }} 
                  placeholder="সরবরাহকারীর নাম লিখুন বা বেছে নিন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500" 
                />
                <datalist id="suppliers-datalist">
                  {suppliersList.map(s => (
                    <option key={s.id} value={s.name}>{s.phone ? `(${s.phone})` : ''}</option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> সরবরাহকারীর ফোন (ঐচ্ছিক)
                </label>
                <input 
                  type="text" 
                  value={purchasePhone} 
                  onChange={e => setPurchasePhone(e.target.value)} 
                  placeholder="017xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">পেমেন্ট অবস্থা</label>
                <select 
                  value={purchasePayment} 
                  onChange={e => setPurchasePayment(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500"
                >
                  <option value="Paid">পরিশোধ (Paid ✅)</option>
                  <option value="Due">বাকি (Due ❌)</option>
                  <option value="Partial">আংশিক (Partial)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> নোট বা মন্তব্য
                </label>
                <input 
                  type="text" 
                  value={purchaseNotes} 
                  onChange={e => setPurchaseNotes(e.target.value)} 
                  placeholder="যেমন: কারিগর থেকে নেওয়া / প্যাকেজিং..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {submitting ? 'সংরক্ষণ হচ্ছে...' : '✅ দই ক্রয় সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. ADD SALE TAB (দই বিক্রয় যোগ) */}
      {activeTab === 'add-sale' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" /> দই বা পণ্য বিক্রয় এন্ট্রি (Sale Entry)
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-semibold">
              বিক্রয়ের হিসাব
            </span>
          </div>

          <form onSubmit={handleAddSale} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> বিক্রির তারিখ *
                </label>
                <input 
                  type="date" 
                  value={saleDate} 
                  onChange={e => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">পণ্য সিলেক্ট করুন *</label>
                <select 
                  value={selectedSaleProductId} 
                  onChange={e => handleSaleProductSelect(e.target.value)} 
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500"
                >
                  <option value="">-- পণ্য বেছে নিন --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit}) — ডিফল্ট: {currency}{p.default_price}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  পরিমাণ ({selectedSaleProduct?.unit || 'Piece'}) *
                </label>
                <input 
                  type="number" 
                  step="any" 
                  min="0.1" 
                  value={saleQty} 
                  onChange={e => setSaleQty(e.target.value)} 
                  required 
                  placeholder="যেমন: 2"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  বিক্রয় মূল্য ({currency}) *
                </label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  value={salePrice} 
                  onChange={e => setSalePrice(e.target.value)} 
                  required 
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>
            </div>

            {/* Total */}
            {parsedSaleQty > 0 && parsedSalePrice > 0 && (
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-600 dark:text-purple-300 font-semibold block">মোট বিক্রয় মূল্য</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {parsedSaleQty} {selectedSaleProduct?.unit || 'একক'} × {currency}{parsedSalePrice}
                  </span>
                </div>
                <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                  {formatCurrency(saleTotal)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> ক্রেতার নাম
                </label>
                <input 
                  type="text" 
                  value={saleCustomer} 
                  onChange={e => setSaleCustomer(e.target.value)} 
                  placeholder="Cash Customer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> ফোন
                </label>
                <input 
                  type="text" 
                  value={salePhone} 
                  onChange={e => setSalePhone(e.target.value)} 
                  placeholder="017xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">পেমেন্ট স্ট্যাটাস</label>
                <select 
                  value={salePayment} 
                  onChange={e => setSalePayment(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500"
                >
                  <option value="Paid">পরিশোধ (Paid ✅)</option>
                  <option value="Due">বাকি (Due)</option>
                  <option value="Partial">আংশিক (Partial)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> নোট
                </label>
                <input 
                  type="text" 
                  value={saleNotes} 
                  onChange={e => setSaleNotes(e.target.value)} 
                  placeholder="যেকোনো নোট..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
              >
                {submitting ? 'সেভ হচ্ছে...' : '✅ বিক্রয় সেভ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. PURCHASE HISTORY TAB (ক্রয় ইতিহাস) */}
      {activeTab === 'purchase-history' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-rose-600" /> দই/পণ্য ক্রয় ইতিহাস
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              মোট রেকর্ড: {purchases.length}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">লোড হচ্ছে...</div>
          ) : purchases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              কোনো ক্রয়ের রেকর্ড নেই। <strong>+ ক্রয় যোগ</strong> ট্যাব থেকে দই ক্রয় যোগ করুন!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.map(pur => (
                <div key={pur.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{pur.product_name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        pur.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        pur.payment_status === 'Due' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}>
                        {pur.payment_status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {pur.date} · {pur.quantity} {pur.unit} · দর: {currency}{pur.purchase_price} · সরবরাহকারী: {pur.supplier_name || 'General'}
                    </div>
                    {pur.notes && (
                      <div className="text-[11px] text-slate-400 italic mt-0.5">নোট: {pur.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                      -{formatCurrency(pur.total_amount)}
                    </span>
                    <button 
                      onClick={() => handleDeletePurchase(pur.id)} 
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 transition"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SALES HISTORY TAB (বিক্রয় ইতিহাস) */}
      {activeTab === 'sales-history' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-purple-600" /> দই/পণ্য বিক্রয় ইতিহাস
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              মোট রেকর্ড: {sales.length}
            </span>
          </div>

          {loading ? (
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
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        s.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        s.payment_status === 'Due' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}>
                        {s.payment_status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.date} · {s.quantity} {s.unit} · দর: {currency}{s.selling_price} · ক্রেতা: {s.customer_name}
                    </div>
                    {s.notes && (
                      <div className="text-[11px] text-slate-400 italic mt-0.5">নোট: {s.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-purple-700 dark:text-purple-400 text-sm tabular-nums">
                      +{formatCurrency(s.total_amount)}
                    </span>
                    <button 
                      onClick={() => handleDeleteSale(s.id)} 
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 transition"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. CATALOG TAB (পণ্য তালিকা) */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 dark:text-white">পণ্য তালিকা ও ডিফল্ট রেট</h2>
            <button 
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন পণ্য যোগ
            </button>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <form onSubmit={handleAddProduct} className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
              <h3 className="font-bold text-purple-800 dark:text-purple-200 text-sm">নতুন পণ্য যোগ করুন</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} 
                  placeholder="পণ্যের নাম (যেমন: দই স্পেশাল) *" 
                  required
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                />
                <select 
                  value={newProduct.unit} 
                  onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="Piece">Piece (পিস / পাত্র)</option>
                  <option value="KG">KG (কেজি)</option>
                  <option value="Liter">Liter (লিটার)</option>
                  <option value="Pack">Pack (প্যাকেট)</option>
                </select>
                <input 
                  type="number" 
                  value={newProduct.default_price} 
                  onChange={e => setNewProduct(p => ({ ...p, default_price: e.target.value }))} 
                  placeholder={`ডিফল্ট বিক্রয় মূল্য (${currency})`}
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                />
                <input 
                  type="text" 
                  value={newProduct.description} 
                  onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} 
                  placeholder="বিবরণ (ঐচ্ছিক)"
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                />
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
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-sm">লোড হচ্ছে...</div>
            ) : products.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">কোনো পণ্য নেই।</div>
            ) : products.map(p => (
              <div key={p.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                {editingProduct?.id === p.id ? (
                  <form onSubmit={handleUpdateProduct} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        value={editingProduct.name} 
                        onChange={e => setEditingProduct(ep => ep ? { ...ep, name: e.target.value } : ep)} 
                        required
                        className="px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                      />
                      <select 
                        value={editingProduct.unit} 
                        onChange={e => setEditingProduct(ep => ep ? { ...ep, unit: e.target.value } : ep)}
                        className="px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Piece">Piece</option>
                        <option value="KG">KG</option>
                        <option value="Liter">Liter</option>
                        <option value="Pack">Pack</option>
                      </select>
                      <input 
                        type="number" 
                        value={editingProduct.default_price} 
                        onChange={e => setEditingProduct(ep => ep ? { ...ep, default_price: parseFloat(e.target.value) } : ep)}
                        className="px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                      />
                      <input 
                        type="text" 
                        value={editingProduct.description || ''} 
                        onChange={e => setEditingProduct(ep => ep ? { ...ep, description: e.target.value } : ep)}
                        placeholder="বিবরণ" 
                        className="px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center gap-1">
                        <Save className="w-3 h-3" /> সেভ
                      </button>
                      <button type="button" onClick={() => setEditingProduct(null)} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center gap-1">
                        <X className="w-3 h-3" /> বাতিল
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        একক: {p.unit} · ডিফল্ট বিক্রয় দর: {currency}{p.default_price}
                      </div>
                      {p.description && <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingProduct(p)} 
                        className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-500 hover:text-purple-700 transition"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)} 
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 transition"
                        title="মুছে ফেলুন"
                      >
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
