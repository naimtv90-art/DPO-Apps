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

export interface StockMovement {
  type: 'PURCHASE' | 'SALE';
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
  todayPurchase: number;
  todaySale: number;
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
    currentStock: number;
    weightedAvgCost: number;
    cogs: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    grossMargin: number;
    profitPerLiter: number;
    avgSellingRate: number;
  };
  month: {
    purchaseQty: number;
    purchaseCost: number;
    salesQty: number;
    salesRevenue: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
  };
  latestRate: MilkRate;
  charts: ChartDataPoint[];
  recentPurchases: MilkPurchase[];
  recentSales: MilkSale[];
  recentExpenses: Expense[];
}

export interface DailySummaryRow {
  date: string;
  purchasedQty: number;
  purchaseCost: number;
  soldQty: number;
  salesRevenue: number;
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
  profitSummary: {
    cogs: number;
    grossProfit: number;
    grossMargin: number;
    profitPerLiter: number;
    expenses: number;
    netProfit: number;
  };
  expenseBreakdown: { category: string; amount: number; count: number }[];
  breakdown: {
    date: string;
    purchasedQty: number;
    purchaseCost: number;
    soldQty: number;
    salesRevenue: number;
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
