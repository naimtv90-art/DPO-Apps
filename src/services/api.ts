import { 
  DashboardStats, 
  MilkPurchase, 
  MilkSale, 
  MilkRate, 
  Expense, 
  StockData, 
  DailySummaryRow, 
  ReportData, 
  Customer, 
  Supplier, 
  AppSettings,
  User
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function handleResponse<T>(res: Response, fallbackData?: T): Promise<T> {
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }
      return data as T;
    }
  } catch (e: any) {
    if (fallbackData !== undefined) return fallbackData;
    throw e;
  }
  if (fallbackData !== undefined) return fallbackData;
  throw new Error(`Server returned ${res.status}`);
}

export const api = {
  // Auth
  login: async (credentials: { username: string; password: string }): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await fetch(`${BASE_URL}/auth/me`);
    return handleResponse(res);
  },

  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    return handleResponse(res);
  },

  // Purchases
  getPurchases: async (params?: { search?: string; startDate?: string; endDate?: string; supplier?: string; unit?: string }): Promise<{ purchases: MilkPurchase[]; summary: { totalQty: number; totalCost: number; count: number; avgRate: number } }> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.supplier) searchParams.append('supplier', params.supplier);
    if (params?.unit) searchParams.append('unit', params.unit);
    
    const res = await fetch(`${BASE_URL}/purchases?${searchParams.toString()}`);
    return handleResponse(res);
  },

  createPurchase: async (data: Partial<MilkPurchase>): Promise<{ message: string; purchase: MilkPurchase; stock: number }> => {
    const res = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updatePurchase: async (id: number, data: Partial<MilkPurchase>): Promise<{ message: string; purchase: MilkPurchase }> => {
    const res = await fetch(`${BASE_URL}/purchases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deletePurchase: async (id: number): Promise<{ message: string; stock: number }> => {
    const res = await fetch(`${BASE_URL}/purchases/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Sales
  getSales: async (params?: { search?: string; startDate?: string; endDate?: string; customer?: string; paymentStatus?: string; unit?: string }): Promise<{ sales: MilkSale[]; summary: { totalQty: number; totalSale: number; count: number; paidCount: number; dueCount: number; partialCount: number; avgRate: number } }> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.customer) searchParams.append('customer', params.customer);
    if (params?.paymentStatus) searchParams.append('paymentStatus', params.paymentStatus);
    if (params?.unit) searchParams.append('unit', params.unit);

    const res = await fetch(`${BASE_URL}/sales?${searchParams.toString()}`);
    return handleResponse(res);
  },

  createSale: async (data: Partial<MilkSale>): Promise<{ message: string; sale: MilkSale; stock: number }> => {
    const res = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateSale: async (id: number, data: Partial<MilkSale>): Promise<{ message: string; sale: MilkSale }> => {
    const res = await fetch(`${BASE_URL}/sales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteSale: async (id: number): Promise<{ message: string; stock: number }> => {
    const res = await fetch(`${BASE_URL}/sales/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Stock
  getStock: async (): Promise<StockData> => {
    const res = await fetch(`${BASE_URL}/stock`);
    return handleResponse(res);
  },

  // Rates
  getRates: async (): Promise<{ rates: MilkRate[]; latest: MilkRate }> => {
    const res = await fetch(`${BASE_URL}/rates`);
    return handleResponse(res);
  },

  createRate: async (data: Partial<MilkRate>): Promise<{ message: string; rate: MilkRate }> => {
    const res = await fetch(`${BASE_URL}/rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Daily Summary
  getDailySummary: async (params?: { startDate?: string; endDate?: string }): Promise<{ dailyData: DailySummaryRow[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const res = await fetch(`${BASE_URL}/daily-summary?${searchParams.toString()}`);
    return handleResponse(res);
  },

  // Reports
  getReports: async (params?: { type?: string; startDate?: string; endDate?: string }): Promise<ReportData> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const res = await fetch(`${BASE_URL}/reports?${searchParams.toString()}`);
    return handleResponse(res);
  },

  // Expenses
  getExpenses: async (params?: { category?: string; startDate?: string; endDate?: string; search?: string }): Promise<{ expenses: Expense[]; totalAmount: number; categoryTotals: { category: string; total: number; count: number }[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.search) searchParams.append('search', params.search);
    const res = await fetch(`${BASE_URL}/expenses?${searchParams.toString()}`);
    return handleResponse(res);
  },

  createExpense: async (data: Partial<Expense>): Promise<{ message: string; expense: Expense }> => {
    const res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateExpense: async (id: number, data: Partial<Expense>): Promise<{ message: string; expense: Expense }> => {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteExpense: async (id: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Customers
  getCustomers: async (): Promise<{ customers: Customer[] }> => {
    const res = await fetch(`${BASE_URL}/customers`);
    return handleResponse(res);
  },

  getCustomerHistory: async (id: number): Promise<{ customer: Customer; sales: MilkSale[] }> => {
    const res = await fetch(`${BASE_URL}/customers/${id}/sales`);
    return handleResponse(res);
  },

  createCustomer: async (data: Partial<Customer>): Promise<{ message: string; customer: Customer }> => {
    const res = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateCustomer: async (id: number, data: Partial<Customer>): Promise<{ message: string; customer: Customer }> => {
    const res = await fetch(`${BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteCustomer: async (id: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/customers/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Suppliers
  getSuppliers: async (): Promise<{ suppliers: Supplier[] }> => {
    const res = await fetch(`${BASE_URL}/suppliers`);
    return handleResponse(res);
  },

  getSupplierHistory: async (id: number): Promise<{ supplier: Supplier; purchases: MilkPurchase[] }> => {
    const res = await fetch(`${BASE_URL}/suppliers/${id}/purchases`);
    return handleResponse(res);
  },

  createSupplier: async (data: Partial<Supplier>): Promise<{ message: string; supplier: Supplier }> => {
    const res = await fetch(`${BASE_URL}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateSupplier: async (id: number, data: Partial<Supplier>): Promise<{ message: string; supplier: Supplier }> => {
    const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteSupplier: async (id: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Product Waste
  getWaste: async (params?: { startDate?: string; endDate?: string; reason?: string; search?: string }): Promise<{ waste: ProductWaste[]; summary: WasteSummary; reasonTotals: WasteReasonTotal[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.reason) searchParams.append('reason', params.reason);
    if (params?.search) searchParams.append('search', params.search);
    const res = await fetch(`${BASE_URL}/waste?${searchParams.toString()}`);
    return handleResponse(res);
  },

  createWaste: async (data: Partial<ProductWaste>): Promise<{ message: string; waste: ProductWaste; stock: number }> => {
    const res = await fetch(`${BASE_URL}/waste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateWaste: async (id: number, data: Partial<ProductWaste>): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/waste/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteWaste: async (id: number): Promise<{ message: string; stock: number }> => {
    const res = await fetch(`${BASE_URL}/waste/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Partner Investments
  getInvestments: async (params?: { partner?: string; startDate?: string; endDate?: string; search?: string }): Promise<{ investments: PartnerInvestment[]; totalInvested: number; count: number; partnerSummaries: PartnerSummary[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.partner) searchParams.append('partner', params.partner);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.search) searchParams.append('search', params.search);
    const res = await fetch(`${BASE_URL}/investments?${searchParams.toString()}`);
    return handleResponse(res);
  },

  createInvestment: async (data: Partial<PartnerInvestment>): Promise<{ message: string; investment: PartnerInvestment }> => {
    const res = await fetch(`${BASE_URL}/investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateInvestment: async (id: number, data: Partial<PartnerInvestment>): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/investments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteInvestment: async (id: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/investments/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Partners Directory
  getPartners: async (): Promise<{ partners: Partner[]; totalCapital: number }> => {
    const res = await fetch(`${BASE_URL}/partners`);
    return handleResponse(res);
  },

  createPartner: async (data: Partial<Partner>): Promise<{ message: string; id: number }> => {
    const res = await fetch(`${BASE_URL}/partners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updatePartner: async (id: number, data: Partial<Partner>): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/partners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Settings
  getSettings: async (): Promise<{ settings: AppSettings }> => {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse(res);
  },

  saveSettings: async (settings: Partial<AppSettings>): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  },
};
