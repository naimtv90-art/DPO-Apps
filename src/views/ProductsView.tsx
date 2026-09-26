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
  ArrowUpCircle,
  PlusCircle,
  Sparkles,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const COMMON_PRESETS = [
  { name: 'দেশি ঘি (Ghee)', unit: 'KG', price: '1400' },
  { name: 'খাঁটি মাখন (Butter)', unit: 'KG', price: '900' },
  { name: 'তাজা পনির (Paneer)', unit: 'KG', price: '750' },
  { name: 'স্পেশাল দই (Curd)', unit: 'Piece', price: '250' },
  { name: 'মিষ্টি (Sweets)', unit: 'KG', price: '450' },
  { name: 'মাঠা / ঘোল (Ghol)', unit: 'Liter', price: '80' },
  { name: 'ছানা (Chhena)', unit: 'KG', price: '380' },
];

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

  // Modal / Add Product state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [modalTargetContext, setModalTargetContext] = useState<'purchase' | 'sale' | 'catalog'>('catalog');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'KG', default_price: '', description: '' });
  const [savingProduct, setSavingProduct] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Purchase form state
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPurchaseProductId, setSelectedPurchaseProductId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchasePhone, setPurchasePhone] = useState('');
  const [purchasePayment, setPurchasePayment] = useState<'Paid' | 'Due' | 'Partial'>('Paid');
  const [purchasePaidAmount, setPurchasePaidAmount] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Sale form state
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSaleProductId, setSelectedSaleProductId] = useState('');
  const [saleQty, setSaleQty] = useState('1');
  const [salePrice, setSalePrice] = useState('');
  const [saleCustomer, setSaleCustomer] = useState('');
  const [salePhone, setSalePhone] = useState('');
  const [salePayment, setSalePayment] = useState<'Paid' | 'Due' | 'Partial'>('Paid');
  const [salePaidAmount, setSalePaidAmount] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, purRes, supRes] = await Promise.all([
        api.getProducts().catch(() => ({ products: [] })), 
        api.getProductSales().catch(() => ({ sales: [], stats: {} })),
        api.getProductPurchases().catch(() => ({ purchases: [], stats: {} })),
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

  // Quick Open Modal
  const openAddProductModal = (context: 'purchase' | 'sale' | 'catalog') => {
    setModalTargetContext(context);
    setNewProduct({ name: '', unit: 'KG', default_price: '', description: '' });
    setShowAddProductModal(true);
  };

  // Purchase Calculations
  const handlePurchaseProductSelect = (idStr: string) => {
    setSelectedPurchaseProductId(idStr);
  };

  const selectedPurchaseProduct = products.find(p => String(p.id) === selectedPurchaseProductId);
  const parsedPurchaseQty = parseFloat(purchaseQty) || 0;
  const parsedPurchasePrice = parseFloat(purchasePrice) || 0;
  const purchaseTotal = parsedPurchaseQty * parsedPurchasePrice;

  const currentPurchasePaid = purchasePayment === 'Paid'
    ? purchaseTotal
    : purchasePayment === 'Due'
    ? 0
    : Math.max(0, Math.min(purchaseTotal, parseFloat(purchasePaidAmount) || 0));
  const currentPurchaseDue = Math.max(0, purchaseTotal - currentPurchasePaid);

  const handlePurchasePaymentChange = (status: 'Paid' | 'Due' | 'Partial') => {
    setPurchasePayment(status);
    if (status === 'Partial') {
      const half = Math.round(purchaseTotal * 0.5);
      setPurchasePaidAmount(String(half));
    } else if (status === 'Paid') {
      setPurchasePaidAmount(String(purchaseTotal));
    } else {
      setPurchasePaidAmount('0');
    }
  };

  // Sale Calculations
  const handleSaleProductSelect = (idStr: string) => {
    setSelectedSaleProductId(idStr);
    const prod = products.find(p => String(p.id) === idStr);
    if (prod && prod.default_price) {
      setSalePrice(String(prod.default_price));
    }
  };

  const selectedSaleProduct = products.find(p => String(p.id) === selectedSaleProductId);
  const parsedSaleQty = parseFloat(saleQty) || 0;
  const parsedSalePrice = parseFloat(salePrice) || 0;
  const saleTotal = parsedSaleQty * parsedSalePrice;

  const currentSalePaid = salePayment === 'Paid'
    ? saleTotal
    : salePayment === 'Due'
    ? 0
    : Math.max(0, Math.min(saleTotal, parseFloat(salePaidAmount) || 0));
  const currentSaleDue = Math.max(0, saleTotal - currentSalePaid);

  const handleSalePaymentChange = (status: 'Paid' | 'Due' | 'Partial') => {
    setSalePayment(status);
    if (status === 'Partial') {
      const half = Math.round(saleTotal * 0.5);
      setSalePaidAmount(String(half));
    } else if (status === 'Paid') {
      setSalePaidAmount(String(saleTotal));
    } else {
      setSalePaidAmount('0');
    }
  };

  // Handle Add Purchase
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseProductId) return showToast('অনুগ্রহ করে পণ্য নির্বাচন করুন', 'warning');
    if (parsedPurchaseQty <= 0) return showToast('সঠিক পরিমাণ দিন', 'warning');
    if (parsedPurchasePrice < 0) return showToast('সঠিক দর/দাম দিন', 'warning');

    try {
      setSubmitting(true);
      await api.createProductPurchase({
        date: purchaseDate,
        product_id: parseInt(selectedPurchaseProductId),
        product_name: selectedPurchaseProduct?.name || '',
        quantity: parsedPurchaseQty,
        unit: selectedPurchaseProduct?.unit || 'KG',
        purchase_price: parsedPurchasePrice,
        supplier_name: purchaseSupplier.trim() || 'General Supplier',
        supplier_phone: purchasePhone.trim(),
        payment_status: purchasePayment,
        paid_amount: currentPurchasePaid,
        due_amount: currentPurchaseDue,
        notes: purchaseNotes.trim(),
      });
      showToast('পণ্য ক্রয় সফলভাবে সংরক্ষিত হয়েছে! ✅', 'success');
      triggerRefresh();
      setPurchaseQty('1');
      setPurchasePrice('');
      setPurchaseSupplier('');
      setPurchasePhone('');
      setPurchasePaidAmount('');
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
    if (!selectedSaleProductId) return showToast('অনুগ্রহ করে পণ্য নির্বাচন করুন', 'warning');
    if (parsedSaleQty <= 0) return showToast('সঠিক পরিমাণ দিন', 'warning');
    try {
      setSubmitting(true);
      await api.createProductSale({
        date: saleDate,
        product_id: parseInt(selectedSaleProductId),
        product_name: selectedSaleProduct?.name || '',
        quantity: parsedSaleQty,
        unit: selectedSaleProduct?.unit || 'KG',
        selling_price: parsedSalePrice,
        customer_name: saleCustomer.trim() || 'Cash Customer',
        customer_phone: salePhone.trim(),
        payment_status: salePayment,
        paid_amount: currentSalePaid,
        due_amount: currentSaleDue,
        notes: saleNotes.trim(),
      });
      showToast('পণ্য বিক্রয় সফলভাবে সংরক্ষিত হয়েছে! ✅', 'success');
      triggerRefresh();
      setSaleQty('1');
      setSaleCustomer('');
      setSalePhone('');
      setSalePaidAmount('');
      setSaleNotes('');
      setActiveTab('sales-history');
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'বিক্রয় সংরক্ষণে সমস্যা হয়েছে', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Sale
  const handleDeleteSale = async (id: number) => {
    if (!confirm('এই রেকর্ড মুছবেন?')) return;
    try {
      await api.deleteProductSale(id);
      showToast('বিক্রয় রেকর্ড মুছে গেছে', 'success');
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Catalog Add / Update / Delete
  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return showToast('পণ্যের নাম দিন', 'warning');
    try {
      setSavingProduct(true);
      const res = await api.createProduct({ 
        name: newProduct.name.trim(), 
        unit: newProduct.unit, 
        default_price: parseFloat(newProduct.default_price) || 0, 
        description: newProduct.description.trim() 
      });
      showToast('নতুন পণ্য যুক্ত হয়েছে ✅', 'success');
      
      const createdId = res?.product?.id || (res as any)?.id;

      // Refresh list
      const pRes = await api.getProducts();
      const updatedProducts = pRes.products || [];
      setProducts(updatedProducts);

      // Automatically select in the active context
      if (createdId) {
        if (modalTargetContext === 'purchase') {
          setSelectedPurchaseProductId(String(createdId));
        } else if (modalTargetContext === 'sale') {
          setSelectedSaleProductId(String(createdId));
          if (newProduct.default_price) {
            setSalePrice(String(newProduct.default_price));
          }
        }
      } else if (updatedProducts.length > 0) {
        const found = updatedProducts.find(p => p.name.toLowerCase() === newProduct.name.trim().toLowerCase());
        if (found) {
          if (modalTargetContext === 'purchase') setSelectedPurchaseProductId(String(found.id));
          if (modalTargetContext === 'sale') {
            setSelectedSaleProductId(String(found.id));
            if (found.default_price) setSalePrice(String(found.default_price));
          }
        }
      }

      setNewProduct({ name: '', unit: 'KG', default_price: '', description: '' });
      setShowAddProductModal(false);
    } catch (err: any) {
      showToast(err.message || 'পণ্য তৈরিতে সমস্যা হয়েছে', 'error');
    } finally {
      setSavingProduct(false);
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
      showToast('পণ্য আপডেট হয়েছে ✅', 'success');
      setEditingProduct(null);
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('এই পণ্যটি তালিকা থেকে মুছে ফেলতে চান?')) return;
    try {
      await api.deleteProduct(id);
      showToast('পণ্য মুছে ফেলা হয়েছে', 'success');
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const totalPurchaseCost = parseFloat(purchasesStats.total_cost) || 0;
  const totalSalesRevenue = parseFloat(salesStats.total_revenue) || 0;
  const totalSalesDue = parseFloat(salesStats.total_due) || 0;
  const grossProfit = totalSalesRevenue - totalPurchaseCost;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(catalogSearch.toLowerCase()))
  );

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
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">পণ্য ব্যবস্থাপনা ও ক্রয়-বিক্রয়</h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-[10px] uppercase font-black tracking-wider border border-purple-300/20">
                  Products Hub
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                ঘি, মাখন, পনির, দই, মিষ্টি ইত্যাদি যেকোনো পণ্য যোগ ও আংশিক/নগদ/বাকি হিসাব রাখুন
              </p>
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
              {totalSalesDue > 0 && (
                <div className="text-[9px] text-amber-300 font-semibold">(বকেয়া: {formatCurrency(totalSalesDue)})</div>
              )}
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
          { key: 'catalog', label: 'পণ্য তালিকা (Catalog)', icon: Package, color: 'text-blue-600 dark:text-blue-400' },
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

      {/* 1. ADD PURCHASE TAB (পণ্য ক্রয় যোগ) */}
      {activeTab === 'add-purchase' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-600" /> পণ্য ক্রয় এন্ট্রি (Product Purchase Entry)
            </h2>
            <button 
              type="button"
              onClick={() => openAddProductModal('purchase')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-purple-600" /> + নতুন পণ্য যোগ
            </button>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                    পণ্য নির্বাচন করুন *
                  </label>
                  <button 
                    type="button"
                    onClick={() => openAddProductModal('purchase')}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    + নতুন আইটেম তৈরি
                  </button>
                </div>
                <select 
                  value={selectedPurchaseProductId} 
                  onChange={e => handlePurchaseProductSelect(e.target.value)} 
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 font-medium"
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
                  পরিমাণ ({selectedPurchaseProduct?.unit || 'একক'}) *
                </label>
                <input 
                  type="number" 
                  step="any" 
                  min="0.01" 
                  value={purchaseQty} 
                  onChange={e => setPurchaseQty(e.target.value)} 
                  required 
                  placeholder="যেমন: 5 বা 10"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ক্রয় মূল্য প্রতি {selectedPurchaseProduct?.unit || 'একক'} ({currency}) *
                </label>
                <input 
                  type="number" 
                  step="any" 
                  min="0" 
                  value={purchasePrice} 
                  onChange={e => setPurchasePrice(e.target.value)} 
                  required 
                  placeholder="যেমন: 1200 বা 250"
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
                  <Truck className="w-3.5 h-3.5" /> সরবরাহকারী / মহাজন (Supplier)
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
                  <Phone className="w-3.5 h-3.5" /> ফোন নম্বর (ঐচ্ছিক)
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

            {/* Payment Status Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">পেমেন্ট অবস্থা</label>
                <select 
                  value={purchasePayment} 
                  onChange={e => handlePurchasePaymentChange(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 font-semibold"
                >
                  <option value="Paid">পরিশোধ (Paid ✅)</option>
                  <option value="Due">বাকি (Due ❌)</option>
                  <option value="Partial">আংশিক পরিশোধ (Partial Payment ⏱️)</option>
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
                  placeholder="যেমন: প্যাকিং খরচ, বিশেষ কোয়ালিটি..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500" 
                />
              </div>
            </div>

            {/* PARTIAL PAYMENT BOX FOR PURCHASE */}
            {purchasePayment === 'Partial' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      ক্রয়ের আংশিক পেমেন্ট হিসাব (Partial Payment)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    আংশিক
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      কত টাকা পরিশোধ করেছেন? ({currency})
                    </label>
                    <input 
                      type="number"
                      step="1"
                      min="0"
                      max={purchaseTotal}
                      value={purchasePaidAmount}
                      onChange={e => setPurchasePaidAmount(e.target.value)}
                      placeholder="টাকার পরিমাণ লিখুন"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <button
                      type="button"
                      onClick={() => setPurchasePaidAmount(String(Math.round(purchaseTotal * 0.5)))}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition"
                    >
                      ৫০% ({formatCurrency(purchaseTotal * 0.5)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchasePaidAmount(String(Math.round(purchaseTotal * 0.75)))}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition"
                    >
                      ৭৫% ({formatCurrency(purchaseTotal * 0.75)})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">জমা / Paid</span>
                    <span className="text-base font-black text-emerald-800 dark:text-emerald-300">{formatCurrency(currentPurchasePaid)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">বাকি / Due</span>
                    <span className="text-base font-black text-rose-800 dark:text-rose-300">{formatCurrency(currentPurchaseDue)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {submitting ? 'সংরক্ষণ হচ্ছে...' : '✅ পণ্য ক্রয় সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. ADD SALE TAB (পণ্য বিক্রয় যোগ) */}
      {activeTab === 'add-sale' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" /> পণ্য বিক্রয় এন্ট্রি (Product Sale Entry)
            </h2>
            <button 
              type="button"
              onClick={() => openAddProductModal('sale')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-purple-600" /> + নতুন পণ্য যোগ
            </button>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                    পণ্য সিলেক্ট করুন *
                  </label>
                  <button 
                    type="button"
                    onClick={() => openAddProductModal('sale')}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    + নতুন আইটেম তৈরি
                  </button>
                </div>
                <select 
                  value={selectedSaleProductId} 
                  onChange={e => handleSaleProductSelect(e.target.value)} 
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 font-medium"
                >
                  <option value="">-- পণ্য বেছে নিন --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit}) {p.default_price ? `— দর: ${currency}${p.default_price}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  পরিমাণ ({selectedSaleProduct?.unit || 'একক'}) *
                </label>
                <input 
                  type="number" 
                  step="any" 
                  min="0.01" 
                  value={saleQty} 
                  onChange={e => setSaleQty(e.target.value)} 
                  required 
                  placeholder="যেমন: 2"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  বিক্রয় দর / রেট ({currency}) *
                </label>
                <input 
                  type="number" 
                  step="any" 
                  min="0" 
                  value={salePrice} 
                  onChange={e => setSalePrice(e.target.value)} 
                  required 
                  placeholder="যেমন: 1400"
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
                  <User className="w-3.5 h-3.5" /> ক্রেতা / কাস্টমারের নাম
                </label>
                <input 
                  type="text" 
                  value={saleCustomer} 
                  onChange={e => setSaleCustomer(e.target.value)} 
                  placeholder="যেমন: Cash Customer বা ক্রেতার নাম"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> ফোন নম্বর
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

            {/* Sale Payment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">পেমেন্ট স্ট্যাটাস</label>
                <select 
                  value={salePayment} 
                  onChange={e => handleSalePaymentChange(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="Paid">পরিশোধ (Paid ✅)</option>
                  <option value="Due">বাকি (Due ❌)</option>
                  <option value="Partial">আংশিক পরিশোধ (Partial Payment ⏱️)</option>
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
                  placeholder="যেকোনো মন্তব্য..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>
            </div>

            {/* PARTIAL PAYMENT BOX FOR SALE */}
            {salePayment === 'Partial' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      বিক্রয়ের আংশিক জমা ও বকেয়া হিসাব (Partial Payment)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    আংশিক
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      ক্রেতা কত টাকা জমা দিল? ({currency})
                    </label>
                    <input 
                      type="number"
                      step="1"
                      min="0"
                      max={saleTotal}
                      value={salePaidAmount}
                      onChange={e => setSalePaidAmount(e.target.value)}
                      placeholder="জমার পরিমাণ লিখুন"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <button
                      type="button"
                      onClick={() => setSalePaidAmount(String(Math.round(saleTotal * 0.5)))}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition"
                    >
                      ৫০% ({formatCurrency(saleTotal * 0.5)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalePaidAmount(String(Math.round(saleTotal * 0.75)))}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition"
                    >
                      ৭৫% ({formatCurrency(saleTotal * 0.75)})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">জমা / Paid</span>
                    <span className="text-base font-black text-emerald-800 dark:text-emerald-300">{formatCurrency(currentSalePaid)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">বকেয়া / Due</span>
                    <span className="text-base font-black text-rose-800 dark:text-rose-300">{formatCurrency(currentSaleDue)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
              >
                {submitting ? 'সেভ হচ্ছে...' : '✅ পণ্য বিক্রয় সেভ করুন'}
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
              <ShoppingBag className="w-4 h-4 text-rose-600" /> পণ্য ক্রয় ইতিহাস (Purchases Log)
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              মোট রেকর্ড: {purchases.length}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">লোড হচ্ছে...</div>
          ) : purchases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              কোনো ক্রয়ের রেকর্ড নেই। <strong>+ ক্রয় যোগ</strong> ট্যাব থেকে পণ্য ক্রয় যোগ করুন!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.map(pur => {
                const isPartial = pur.payment_status === 'Partial';
                const paidAmt = pur.paid_amount !== undefined ? pur.paid_amount : (pur.payment_status === 'Paid' ? pur.total_amount : 0);
                const dueAmt = pur.due_amount !== undefined ? pur.due_amount : (pur.payment_status === 'Due' ? pur.total_amount : Math.max(0, pur.total_amount - paidAmt));

                return (
                  <div key={pur.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{pur.product_name}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          pur.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          pur.payment_status === 'Due' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {pur.payment_status === 'Partial' ? 'আংশিক (Partial)' : pur.payment_status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {pur.date} · {pur.quantity} {pur.unit} · দর: {currency}{pur.purchase_price} · সরবরাহকারী: {pur.supplier_name || 'General'}
                      </div>
                      {isPartial && (
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">জমা: {formatCurrency(paidAmt)}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-rose-600 dark:text-rose-400">বাকি: {formatCurrency(dueAmt)}</span>
                        </div>
                      )}
                      {pur.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">নোট: {pur.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm tabular-nums block">
                          -{formatCurrency(pur.total_amount)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeletePurchase(pur.id)} 
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 transition"
                        title="মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. SALES HISTORY TAB (বিক্রয় ইতিহাস) */}
      {activeTab === 'sales-history' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-purple-600" /> পণ্য বিক্রয় ইতিহাস (Sales Log)
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              মোট রেকর্ড: {sales.length}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">লোড হচ্ছে...</div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">কোনো বিক্রয়ের রেকর্ড নেই। উপরে যোগ করুন!</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map(s => {
                const isPartial = s.payment_status === 'Partial';
                const paidAmt = s.paid_amount !== undefined ? s.paid_amount : (s.payment_status === 'Paid' ? s.total_amount : 0);
                const dueAmt = s.due_amount !== undefined ? s.due_amount : (s.payment_status === 'Due' ? s.total_amount : Math.max(0, s.total_amount - paidAmt));

                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{s.product_name}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          s.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          s.payment_status === 'Due' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {s.payment_status === 'Partial' ? 'আংশিক (Partial)' : s.payment_status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {s.date} · {s.quantity} {s.unit} · দর: {currency}{s.selling_price} · ক্রেতা: {s.customer_name}
                      </div>
                      {isPartial && (
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">জমা: {formatCurrency(paidAmt)}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-rose-600 dark:text-rose-400">বাকি: {formatCurrency(dueAmt)}</span>
                        </div>
                      )}
                      {s.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">নোট: {s.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-black text-purple-700 dark:text-purple-400 text-sm tabular-nums block">
                          +{formatCurrency(s.total_amount)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteSale(s.id)} 
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 transition"
                        title="মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. CATALOG TAB (পণ্য তালিকা) */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="পণ্য খুঁজুন (নাম বা বিবরণ)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>
            <button 
              onClick={() => openAddProductModal('catalog')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 shrink-0"
            >
              <Plus className="w-4 h-4" /> + নতুন পণ্য যোগ করুন
            </button>
          </div>

          {/* Product Cards */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">লোড হচ্ছে...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p>কোনো পণ্য পাওয়া যায়নি। নতুন কোনো পণ্য যোগ করতে উপরের বাটনে চাপুন।</p>
              </div>
            ) : filteredProducts.map(p => (
              <div key={p.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition hover:border-purple-300 dark:hover:border-purple-800">
                {editingProduct?.id === p.id ? (
                  <form onSubmit={handleUpdateProduct} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">পণ্যের নাম *</label>
                        <input 
                          type="text" 
                          value={editingProduct.name} 
                          onChange={e => setEditingProduct(ep => ep ? { ...ep, name: e.target.value } : ep)} 
                          required
                          className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">একক (Unit)</label>
                        <select 
                          value={editingProduct.unit} 
                          onChange={e => setEditingProduct(ep => ep ? { ...ep, unit: e.target.value } : ep)}
                          className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                        >
                          <option value="KG">KG (কেজি)</option>
                          <option value="Liter">Liter (লিটার)</option>
                          <option value="Piece">Piece (পিস / পাত্র)</option>
                          <option value="Pack">Pack (প্যাকেট)</option>
                          <option value="Box">Box (বাক্স)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ডিফল্ট বিক্রয় দর ({currency})</label>
                        <input 
                          type="number" 
                          value={editingProduct.default_price} 
                          onChange={e => setEditingProduct(ep => ep ? { ...ep, default_price: parseFloat(e.target.value) || 0 } : ep)}
                          className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">বিবরণ</label>
                        <input 
                          type="text" 
                          value={editingProduct.description || ''} 
                          onChange={e => setEditingProduct(ep => ep ? { ...ep, description: e.target.value } : ep)}
                          placeholder="বিবরণ" 
                          className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none" 
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="submit" className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1">
                        <Save className="w-3.5 h-3.5" /> সেভ
                      </button>
                      <button type="button" onClick={() => setEditingProduct(null)} className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> বাতিল
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 dark:text-white">{p.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {p.unit}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        ডিফল্ট বিক্রয় দর: <strong className="text-purple-600 dark:text-purple-400">{currency}{p.default_price || '0'}</strong> / {p.unit}
                      </div>
                      {p.description && <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingProduct(p)} 
                        className="p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-600 dark:text-purple-400 transition"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)} 
                        className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 transition"
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

      {/* GLOBAL ADD NEW PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">নতুন পণ্য যোগ করুন</h3>
                  <p className="text-[11px] text-slate-500">তালিকায় নতুন প্রোডাক্ট অন্তর্ভুক্ত করুন</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Chips */}
            <div className="p-5 pb-0">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">দ্রুত নমুনা নির্বাচন করুন:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewProduct({
                        name: preset.name,
                        unit: preset.unit,
                        default_price: preset.price,
                        description: ''
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-700 transition"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewProduct} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পণ্যের নাম *
                </label>
                <input 
                  type="text" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} 
                  placeholder="যেমন: ঘি, মাখন, পনির, মিষ্টি ইত্যাদি" 
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    একক (Unit) *
                  </label>
                  <select 
                    value={newProduct.unit} 
                    onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                  >
                    <option value="KG">KG (কেজি)</option>
                    <option value="Liter">Liter (লিটার)</option>
                    <option value="Piece">Piece (পিস / পাত্র)</option>
                    <option value="Pack">Pack (প্যাকেট)</option>
                    <option value="Box">Box (বাক্স)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ডিফল্ট বিক্রয় দর ({currency})
                  </label>
                  <input 
                    type="number" 
                    value={newProduct.default_price} 
                    onChange={e => setNewProduct(p => ({ ...p, default_price: e.target.value }))} 
                    placeholder="যেমন: 1400"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিবরণ / নোট (ঐচ্ছিক)
                </label>
                <input 
                  type="text" 
                  value={newProduct.description} 
                  onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} 
                  placeholder="যেমন: স্পেশাল গাওয়া ঘি, প্রিমিয়াম কোয়ালিটি"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500" 
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  disabled={savingProduct}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {savingProduct ? 'সংরক্ষণ হচ্ছে...' : <><Save className="w-4 h-4" /> পণ্য সেভ করুন</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
