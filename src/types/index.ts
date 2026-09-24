export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  total_qty?: number;
  total_paid?: number;
  purchase_count?: number;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  customer_type: 'Retail' | 'Wholesale' | 'Restaurant' | 'Regular Customer';
  notes?: string;
  created_at?: string;
  total_qty?: number;
  total_spent?: number;
  total_due?: number;
  order_count?: number;
}

export interface MilkPurchase {
  id: number;
  date: string;
  supplier_id?: number | null;
  supplier_name: string;
  quantity: number;
  unit: 'Liter' | 'KG';
  purchase_rate: number;
  total_cost: number;
  supplier_phone?: string;
  supplier_address?: string;
  notes?: string;
  created_at?: string;
}

export interface MilkSale {
  id: number;
  date: string;
  customer_id?: number | null;
  customer_name: string;
  quantity: number;
  unit: 'Liter' | 'KG';
  selling_rate: number;
  total_sale: number;
  paid_amount?: number;
  due_amount?: number;
  customer_phone?: string;
  customer_address?: string;
  payment_status: 'Paid' | 'Due' | 'Partial';
  notes?: string;
  created_at?: string;
}

export interface MilkRate {
  id: number;
  date: string;
  purchase_rate: number;
  selling_rate: number;
  unit: 'Liter' | 'KG';
  notes?: string;
  created_at?: string;
}

export interface Expense {
  id: number;
  date: string;
  name: string;
  category: 'Transport' | 'Electricity' | 'Packaging' | 'Employee' | 'Shop Rent' | 'Maintenance' | 'Other';
  amount: number;
  notes?: string;
  created_at?: string;
}

// Product Waste & Spoilage Interface
export interface ProductWaste {
  id: number;
  date: string;
  product_name: string;
  quantity: number;
  unit: 'Liter' | 'KG';
  reason: 'Curdled / Spoiled' | 'Spillage / Leakage' | 'Quality / Sour Milk' | 'Processing Loss' | 'Transit Loss' | 'Other' | string;
  estimated_loss: number;
  notes?: string;
  created_at?: string;
}

export interface WasteSummary {
  totalQty: number;
  totalLoss: number;
  count: number;
  todayQty: number;
  todayLoss: number;
}

export interface WasteReasonTotal {
  reason: string;
  quantity: number;
  loss: number;
  count: number;
}

// Partner & Capital Investment Interfaces
export interface Partner {
  id: number;
  name: string;
  phone?: string;
  role?: string;
  notes?: string;
  total_invested?: number;
  share_percentage?: number;
  investment_count?: number;
  created_at?: string;
}

export interface PartnerInvestment {
  id: number;
  partner_name: string;
  partner_id?: number | null;
  amount: number;
  date: string;
  investment_type: 'Capital Investment' | 'Working Capital' | 'Machinery/Equipment' | 'Reinvestment' | 'Other';
  payment_method: 'Cash' | 'Bank Transfer' | 'bKash' | 'Nagad' | 'Rocket' | 'Cheque';
  notes?: string;
  created_at?: string;
}

export interface PartnerSummary {
  id?: number;
  name: string;
  phone?: string;
  role?: string;
  total_invested: number;
  share_percentage: number;
  entry_count: number;
}

export interface StockMovement {
  type: 'PURCHASE' | 'SALE' | 'WASTE';
  id: number;
  date: string;
  party_name: string;
  quantity: number;
  unit: string;
  rate: number;
  total_amount: number;
  created_at: string;
}

export interface StockData {
  availableStock: number;
  totalPurchased: number;
  totalSold: number;
  totalWasted?: number;
  totalWasteLoss?: number;
  todayPurchase: number;
  todaySale: number;
  todayWaste?: number;
  todayRemaining: number;
  weightedAvgCost: number;
  movements: StockMovement[];
}

export interface ChartDataPoint {
  date: string;
  purchaseQty: number;
  purchaseCost: number;
  salesQty: number;
  salesRevenue: number;
  expenses: number;
  wasteQty?: number;
  wasteLoss?: number;
  grossProfit: number;
  netProfit: number;
  cogs: number;
}

export interface DashboardStats {
  today: {
    date: string;
    purchaseQty: number;
    purchaseCost: number;
    salesQty: number;
    salesRevenue: number;
    expenses: number;
    wasteQty?: number;
    wasteLoss?: number;
    grossProfit: number;
    netProfit: number;
    cogs: number;
    remaining: number;
  };
  currentStock: number;
  allTime: {
    totalPurchased: number;
    totalPurchaseCost: number;
    totalSold: number;
    totalSalesRevenue: number;
    totalExpenses: number;
    totalWasted?: number;
    totalWasteLoss?: number;
    currentStock: number;
    weightedAvgCost: number;
    totalCOGS: number;
    totalGrossProfit: number;
    totalNetProfit: number;
    grossMargin: number;
    profitPerLiter: number;
    avgSellingRate: number;
    totalInvestedCapital?: number;
  };
  month: {
    purchaseQty: number;
    purchaseCost: number;
    salesQty: number;
    salesRevenue: number;
    expenses: number;
    wasteQty?: number;
    wasteLoss?: number;
    grossProfit: number;
    netProfit: number;
  };
  latestRate: MilkRate;
  partnerInvestments?: { partner_name: string; total_invested: number; count: number }[];
  expenseCategories?: { category: string; total: number; count: number }[];
  charts: ChartDataPoint[];
  recentPurchases: MilkPurchase[];
  recentSales: MilkSale[];
  recentExpenses: Expense[];
  recentWaste?: ProductWaste[];
}

export interface DailySummaryRow {
  date: string;
  purchasedQty: number;
  purchaseCost: number;
  soldQty: number;
  salesRevenue: number;
  wasteQty?: number;
  wasteLoss?: number;
  remaining: number;
  avgPurchaseRate: number;
  avgSellingRate: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  grossMargin: string;
}

export interface ReportData {
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
  stock: {
    openingStock: number;
    purchased: number;
    sold: number;
    wasted?: number;
    closingStock: number;
  };
  purchaseSummary: {
    totalQty: number;
    totalCost: number;
    avgRate: number;
    orderCount: number;
  };
  salesSummary: {
    totalQty: number;
    totalRevenue: number;
    avgRate: number;
    orderCount: number;
  };
  wasteSummary?: {
    totalQty: number;
    totalLoss: number;
    count: number;
  };
  profitSummary: {
    cogs: number;
    grossProfit: number;
    grossMargin: number;
    profitPerLiter: number;
    expenses: number;
    wasteLoss?: number;
    netProfit: number;
  };
  expenseBreakdown: { category: string; amount: number; count: number }[];
  breakdown: {
    date: string;
    purchasedQty: number;
    purchaseCost: number;
    soldQty: number;
    salesRevenue: number;
    wasteQty?: number;
    wasteLoss?: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
  }[];
}

export interface AppSettings {
  business_name: string;
  owner_name: string;
  phone: string;
  whatsapp?: string;
  address: string;
  default_unit: 'Liter' | 'KG';
  default_purchase_rate: string;
  default_selling_rate: string;
  currency: string;
  currency_code: string;
  theme: 'light' | 'dark';
}

export interface Product {
  id: number;
  name: string;
  unit: string;
  default_price: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ProductSale {
  id: number;
  date: string;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit: string;
  selling_price: number;
  total_amount: number;
  customer_name: string;
  customer_phone?: string;
  payment_status: 'Paid' | 'Due' | 'Partial';
  notes?: string;
  created_at?: string;
}

export interface ProductPurchase {
  id: number;
  date: string;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  total_amount: number;
  supplier_name: string;
  supplier_phone?: string;
  payment_status: 'Paid' | 'Due' | 'Partial';
  notes?: string;
  created_at?: string;
}

