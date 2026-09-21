import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, executeTransaction, initDatabase } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dpo-super-secret-jwt-key-2026';

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'] : true,
  credentials: true
}));
app.use(express.json());

// Initialize DB tables and seed data
initDatabase().catch(err => console.error('Database initialization error:', err));

// Serve static assets from public & dist
const publicPath = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Universal Date Normalizer (Handles JS Date Objects, ISO Strings, SQLite and PG strings)
function normalizeDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val);
  if (str.includes('T')) return str.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str.substring(0, 10);
}

// Helper: Calculate Inventory Metrics & Weighted Average Cost
async function getInventoryMetrics() {
  const purchaseRes = await query(`
    SELECT 
      COALESCE(SUM(quantity), 0) as total_purchased,
      COALESCE(SUM(total_cost), 0) as total_purchase_cost
    FROM milk_purchases
  `);

  const salesRes = await query(`
    SELECT 
      COALESCE(SUM(quantity), 0) as total_sold,
      COALESCE(SUM(total_sale), 0) as total_sales_revenue
    FROM milk_sales
  `);

  const expenseRes = await query(`
    SELECT COALESCE(SUM(amount), 0) as total_expenses
    FROM expenses
  `);

  const wasteRes = await query(`
    SELECT 
      COALESCE(SUM(quantity), 0) as total_wasted,
      COALESCE(SUM(estimated_loss), 0) as total_waste_loss
    FROM product_waste
  `);

  const totalPurchased = parseFloat(purchaseRes.rows[0]?.total_purchased) || 0;
  const totalPurchaseCost = parseFloat(purchaseRes.rows[0]?.total_purchase_cost) || 0;
  const totalSold = parseFloat(salesRes.rows[0]?.total_sold) || 0;
  const totalSalesRevenue = parseFloat(salesRes.rows[0]?.total_sales_revenue) || 0;
  const totalExpenses = parseFloat(expenseRes.rows[0]?.total_expenses) || 0;
  const totalWasted = parseFloat(wasteRes.rows[0]?.total_wasted) || 0;
  const totalWasteLoss = parseFloat(wasteRes.rows[0]?.total_waste_loss) || 0;

  // Real available tank stock deducting both sales and recorded waste
  const currentStock = Math.max(0, totalPurchased - totalSold - totalWasted);
  const weightedAvgCost = totalPurchased > 0 ? (totalPurchaseCost / totalPurchased) : 0;
  const cogs = totalSold * weightedAvgCost;
  const grossProfit = totalSalesRevenue - cogs;
  const netProfit = grossProfit - totalExpenses - totalWasteLoss;
  const grossMargin = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100) : 0;
  const profitPerLiter = totalSold > 0 ? (grossProfit / totalSold) : 0;
  const avgSellingRate = totalSold > 0 ? (totalSalesRevenue / totalSold) : 0;

  return {
    totalPurchased,
    totalPurchaseCost,
    totalSold,
    totalSalesRevenue,
    totalExpenses,
    totalWasted,
    totalWasteLoss,
    currentStock,
    weightedAvgCost,
    cogs,
    grossProfit,
    netProfit,
    grossMargin,
    profitPerLiter,
    avgSellingRate
  };
}

// ---------------- AUTH API ----------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const userRes = await query('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userRes.rows[0];
    let isMatch = false;

    // Check bcrypt hash or fallback to direct comparison for legacy seeds
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (user.password === password);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server authentication error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const userRes = await query('SELECT id, username, name, role FROM users LIMIT 1');
    res.json({ user: userRes.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ---------------- DASHBOARD API ----------------
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = normalizeDate(new Date());
    const currentYearMonth = today.substring(0, 7); // e.g. '2026-09'

    const [
      allPurchasesRes,
      allSalesRes,
      allExpensesRes,
      allWasteRes,
      latestRateRes,
      investmentsRes,
      inventoryMetrics
    ] = await Promise.all([
      query('SELECT * FROM milk_purchases ORDER BY date DESC, id DESC'),
      query('SELECT * FROM milk_sales ORDER BY date DESC, id DESC'),
      query('SELECT * FROM expenses ORDER BY date DESC, id DESC'),
      query('SELECT * FROM product_waste ORDER BY date DESC, id DESC'),
      query('SELECT * FROM milk_rates ORDER BY date DESC, id DESC LIMIT 1'),
      query('SELECT partner_name, SUM(amount) as total_invested, COUNT(*) as count FROM partner_investments GROUP BY partner_name'),
      getInventoryMetrics()
    ]);

    // Financial & Volume Accumulators
    let totalPurchased = 0;
    let totalPurchaseCost = 0;
    let totalSold = 0;
    let totalSalesRevenue = 0;
    let totalExpenses = 0;
    let totalWasted = 0;
    let totalWasteLoss = 0;

    let todayPurchaseQty = 0;
    let todayPurchaseCost = 0;
    let todaySalesQty = 0;
    let todaySalesRevenue = 0;
    let todayExpenseTotal = 0;
    let todayWasteQty = 0;
    let todayWasteLoss = 0;

    let monthPurchaseQty = 0;
    let monthPurchaseCost = 0;
    let monthSalesQty = 0;
    let monthSalesRevenue = 0;
    let monthExpenseTotal = 0;
    let monthWasteQty = 0;
    let monthWasteLoss = 0;

    const dateMap = {};

    for (const p of allPurchasesRes.rows) {
      const q = parseFloat(p.quantity) || 0;
      const c = parseFloat(p.total_cost) || 0;
      const d = normalizeDate(p.date);

      totalPurchased += q;
      totalPurchaseCost += c;

      if (d === today) {
        todayPurchaseQty += q;
        todayPurchaseCost += c;
      }
      if (d.startsWith(currentYearMonth)) {
        monthPurchaseQty += q;
        monthPurchaseCost += c;
      }

      if (!dateMap[d]) dateMap[d] = { date: d, purchaseQty: 0, purchaseCost: 0, salesQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      dateMap[d].purchaseQty += q;
      dateMap[d].purchaseCost += c;
    }

    for (const s of allSalesRes.rows) {
      const q = parseFloat(s.quantity) || 0;
      const r = parseFloat(s.total_sale) || 0;
      const d = normalizeDate(s.date);

      totalSold += q;
      totalSalesRevenue += r;

      if (d === today) {
        todaySalesQty += q;
        todaySalesRevenue += r;
      }
      if (d.startsWith(currentYearMonth)) {
        monthSalesQty += q;
        monthSalesRevenue += r;
      }

      if (!dateMap[d]) dateMap[d] = { date: d, purchaseQty: 0, purchaseCost: 0, salesQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      dateMap[d].salesQty += q;
      dateMap[d].salesRevenue += r;
    }

    for (const e of allExpensesRes.rows) {
      const a = parseFloat(e.amount) || 0;
      const d = normalizeDate(e.date);

      totalExpenses += a;

      if (d === today) {
        todayExpenseTotal += a;
      }
      if (d.startsWith(currentYearMonth)) {
        monthExpenseTotal += a;
      }

      if (!dateMap[d]) dateMap[d] = { date: d, purchaseQty: 0, purchaseCost: 0, salesQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      dateMap[d].expenses += a;
    }

    for (const w of allWasteRes.rows) {
      const q = parseFloat(w.quantity) || 0;
      const l = parseFloat(w.estimated_loss) || 0;
      const d = normalizeDate(w.date);

      totalWasted += q;
      totalWasteLoss += l;

      if (d === today) {
        todayWasteQty += q;
        todayWasteLoss += l;
      }
      if (d.startsWith(currentYearMonth)) {
        monthWasteQty += q;
        monthWasteLoss += l;
      }

      if (!dateMap[d]) dateMap[d] = { date: d, purchaseQty: 0, purchaseCost: 0, salesQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      dateMap[d].wasteQty += q;
      dateMap[d].wasteLoss += l;
    }

    const currentStock = inventoryMetrics.currentStock;
    const weightedAvgCost = inventoryMetrics.weightedAvgCost;
    const totalCOGS = totalSold * weightedAvgCost;
    const totalGrossProfit = totalSalesRevenue - totalCOGS;
    const totalNetProfit = totalGrossProfit - totalExpenses - totalWasteLoss;
    const grossMargin = totalSalesRevenue > 0 ? ((totalGrossProfit / totalSalesRevenue) * 100) : 0;
    const profitPerLiter = totalSold > 0 ? (totalGrossProfit / totalSold) : 0;
    const avgSellingRate = totalSold > 0 ? (totalSalesRevenue / totalSold) : 0;

    const todayCOGS = todaySalesQty * weightedAvgCost;
    const todayGrossProfit = todaySalesRevenue - todayCOGS;
    const todayNetProfit = todayGrossProfit - todayExpenseTotal - todayWasteLoss;
    const todayRemaining = todayPurchaseQty - todaySalesQty - todayWasteQty;

    const monthCOGS = monthSalesQty * weightedAvgCost;
    const monthGrossProfit = monthSalesRevenue - monthCOGS;
    const monthNetProfit = monthGrossProfit - monthExpenseTotal - monthWasteLoss;

    const formattedCharts = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)).map(row => {
      const cogs = row.salesQty * weightedAvgCost;
      const grossProfit = row.salesRevenue - cogs;
      const netProfit = grossProfit - row.expenses - (row.wasteLoss || 0);
      return {
        ...row,
        grossProfit: Math.round(grossProfit),
        netProfit: Math.round(netProfit),
        cogs: Math.round(cogs)
      };
    });

    // Partner Investments summary for dashboard
    const partnerInvestments = investmentsRes.rows.map(r => ({
      partner_name: r.partner_name,
      total_invested: parseFloat(r.total_invested) || 0,
      count: parseInt(r.count, 10) || 0
    }));
    const totalInvestedCapital = partnerInvestments.reduce((sum, p) => sum + p.total_invested, 0);

    // Expense Categories aggregation
    const expenseCategoriesMap = {};
    for (const e of allExpensesRes.rows) {
      const cat = e.category || 'Other';
      const amt = parseFloat(e.amount) || 0;
      if (!expenseCategoriesMap[cat]) {
        expenseCategoriesMap[cat] = { category: cat, total: 0, count: 0 };
      }
      expenseCategoriesMap[cat].total += amt;
      expenseCategoriesMap[cat].count += 1;
    }
    const expenseCategories = Object.values(expenseCategoriesMap).sort((a, b) => b.total - a.total);

    res.json({
      today: {
        date: today,
        purchaseQty: todayPurchaseQty,
        purchaseCost: todayPurchaseCost,
        salesQty: todaySalesQty,
        salesRevenue: todaySalesRevenue,
        expenses: todayExpenseTotal,
        wasteQty: todayWasteQty,
        wasteLoss: todayWasteLoss,
        grossProfit: Math.round(todayGrossProfit),
        netProfit: Math.round(todayNetProfit),
        cogs: Math.round(todayCOGS),
        remaining: todayRemaining,
      },
      currentStock,
      allTime: {
        totalPurchased,
        totalPurchaseCost,
        totalSold,
        totalSalesRevenue,
        totalExpenses,
        totalWasted,
        totalWasteLoss,
        currentStock,
        weightedAvgCost,
        totalCOGS,
        totalGrossProfit,
        totalNetProfit,
        grossMargin,
        profitPerLiter,
        avgSellingRate,
        totalInvestedCapital
      },
      month: {
        purchaseQty: monthPurchaseQty,
        purchaseCost: monthPurchaseCost,
        salesQty: monthSalesQty,
        salesRevenue: monthSalesRevenue,
        expenses: monthExpenseTotal,
        wasteQty: monthWasteQty,
        wasteLoss: monthWasteLoss,
        grossProfit: Math.round(monthGrossProfit),
        netProfit: Math.round(monthNetProfit),
      },
      latestRate: latestRateRes.rows[0] || { purchase_rate: 60, selling_rate: 85, unit: 'Liter' },
      partnerInvestments,
      expenseCategories,
      charts: formattedCharts,
      recentPurchases: allPurchasesRes.rows.slice(0, 5).map(p => ({
        ...p,
        date: normalizeDate(p.date),
        quantity: parseFloat(p.quantity) || 0,
        purchase_rate: parseFloat(p.purchase_rate) || 0,
        total_cost: parseFloat(p.total_cost) || 0
      })),
      recentSales: allSalesRes.rows.slice(0, 5).map(s => ({
        ...s,
        date: normalizeDate(s.date),
        quantity: parseFloat(s.quantity) || 0,
        selling_rate: parseFloat(s.selling_rate) || 0,
        total_sale: parseFloat(s.total_sale) || 0
      })),
      recentExpenses: allExpensesRes.rows.slice(0, 5).map(e => ({
        ...e,
        date: normalizeDate(e.date),
        amount: parseFloat(e.amount) || 0
      })),
      recentWaste: allWasteRes.rows.slice(0, 5).map(w => ({
        ...w,
        date: normalizeDate(w.date),
        quantity: parseFloat(w.quantity) || 0,
        estimated_loss: parseFloat(w.estimated_loss) || 0
      }))
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to load dashboard statistics' });
  }
});

// ---------------- PURCHASES API ----------------
app.get('/api/purchases', async (req, res) => {
  try {
    const { search, startDate, endDate, supplier, unit } = req.query;
    let sql = 'SELECT * FROM milk_purchases WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (supplier_name LIKE ? OR notes LIKE ? OR supplier_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    if (supplier) {
      sql += ' AND supplier_name = ?';
      params.push(supplier);
    }
    if (unit) {
      sql += ' AND unit = ?';
      params.push(unit);
    }

    sql += ' ORDER BY date DESC, id DESC';
    const result = await query(sql, params);

    const purchases = result.rows.map(p => ({
      ...p,
      date: normalizeDate(p.date),
      quantity: parseFloat(p.quantity) || 0,
      purchase_rate: parseFloat(p.purchase_rate) || 0,
      total_cost: parseFloat(p.total_cost) || 0
    }));

    const summary = {
      totalQty: purchases.reduce((sum, p) => sum + p.quantity, 0),
      totalCost: purchases.reduce((sum, p) => sum + p.total_cost, 0),
      count: purchases.length,
    };
    summary.avgRate = summary.totalQty > 0 ? (summary.totalCost / summary.totalQty) : 0;

    res.json({ purchases, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const { date, supplier_id, supplier_name, quantity, unit = 'Liter', purchase_rate, supplier_phone, supplier_address, notes } = req.body;

    if (!date) return res.status(400).json({ error: 'Date is required' });
    const qty = parseFloat(quantity);
    const rate = parseFloat(purchase_rate);

    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });
    if (isNaN(rate) || rate <= 0) return res.status(400).json({ error: 'Purchase rate must be greater than 0' });

    const totalCost = qty * rate;
    let supName = supplier_name?.trim() || 'Cash Local Farmer';
    let supId = supplier_id || null;

    if (supplier_id) {
      const supRes = await query('SELECT name, phone, address FROM suppliers WHERE id = ?', [supplier_id]);
      if (supRes.rows[0]) {
        supName = supRes.rows[0].name;
      }
    } else if (supplier_name && supplier_name.trim()) {
      const supRes = await query('SELECT id FROM suppliers WHERE LOWER(name) = LOWER(?)', [supplier_name.trim()]);
      if (supRes.rows.length > 0) {
        supId = supRes.rows[0].id;
      } else {
        const createSup = await query(
          'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)',
          [supplier_name.trim(), supplier_phone || '', supplier_address || '']
        );
        supId = createSup.insertId;
      }
    }

    const insertResult = await query(`
      INSERT INTO milk_purchases (date, supplier_id, supplier_name, quantity, unit, purchase_rate, total_cost, supplier_phone, supplier_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [date, supId, supName, qty, unit, rate, totalCost, supplier_phone || '', supplier_address || '', notes || '']);

    const metrics = await getInventoryMetrics();
    res.status(201).json({
      message: 'Milk purchase transaction added successfully!',
      purchase: { id: insertResult.insertId, date, supplier_name: supName, quantity: qty, unit, purchase_rate: rate, total_cost: totalCost },
      stock: metrics.currentStock
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record purchase' });
  }
});

app.put('/api/purchases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingRes = await query('SELECT * FROM milk_purchases WHERE id = ?', [id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Purchase not found' });
    const existing = existingRes.rows[0];

    const { date, supplier_id, supplier_name, quantity, unit, purchase_rate, supplier_phone, supplier_address, notes } = req.body;
    const qty = parseFloat(quantity);
    const rate = parseFloat(purchase_rate);

    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });
    if (isNaN(rate) || rate <= 0) return res.status(400).json({ error: 'Rate must be greater than 0' });

    const metrics = await getInventoryMetrics();
    const hypotheticalStock = (metrics.totalPurchased - parseFloat(existing.quantity) + qty) - metrics.totalSold - metrics.totalWasted;
    if (hypotheticalStock < 0) {
      return res.status(400).json({ 
        error: `Cannot reduce purchase quantity to ${qty} L because sold & wasted total exceeds remaining stock.` 
      });
    }

    const totalCost = qty * rate;

    await query(`
      UPDATE milk_purchases 
      SET date = ?, supplier_id = ?, supplier_name = ?, quantity = ?, unit = ?, purchase_rate = ?, total_cost = ?, supplier_phone = ?, supplier_address = ?, notes = ?
      WHERE id = ?
    `, [date || existing.date, supplier_id || existing.supplier_id, supplier_name || existing.supplier_name, qty, unit || existing.unit, rate, totalCost, supplier_phone ?? existing.supplier_phone, supplier_address ?? existing.supplier_address, notes ?? existing.notes, id]);

    res.json({ message: 'Purchase updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update purchase' });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingRes = await query('SELECT * FROM milk_purchases WHERE id = ?', [id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Purchase not found' });
    const existing = existingRes.rows[0];

    const metrics = await getInventoryMetrics();
    const hypotheticalStock = (metrics.totalPurchased - parseFloat(existing.quantity)) - metrics.totalSold - metrics.totalWasted;
    if (hypotheticalStock < 0) {
      return res.status(400).json({ 
        error: `Cannot delete this purchase of ${existing.quantity} L. Deleting this purchase would cause current stock to drop to ${hypotheticalStock.toFixed(1)} L.` 
      });
    }

    await query('DELETE FROM milk_purchases WHERE id = ?', [id]);
    const updatedMetrics = await getInventoryMetrics();
    res.json({ message: 'Purchase deleted successfully', stock: updatedMetrics.currentStock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete purchase' });
  }
});

// ---------------- SALES API ----------------
app.get('/api/sales', async (req, res) => {
  try {
    const { search, startDate, endDate, customer, paymentStatus, unit } = req.query;
    let sql = 'SELECT * FROM milk_sales WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (customer_name LIKE ? OR notes LIKE ? OR customer_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    if (customer) {
      sql += ' AND customer_name = ?';
      params.push(customer);
    }
    if (paymentStatus) {
      sql += ' AND payment_status = ?';
      params.push(paymentStatus);
    }
    if (unit) {
      sql += ' AND unit = ?';
      params.push(unit);
    }

    sql += ' ORDER BY date DESC, id DESC';
    const result = await query(sql, params);

    const sales = result.rows.map(s => ({
      ...s,
      date: normalizeDate(s.date),
      quantity: parseFloat(s.quantity) || 0,
      selling_rate: parseFloat(s.selling_rate) || 0,
      total_sale: parseFloat(s.total_sale) || 0
    }));

    const summary = {
      totalQty: sales.reduce((sum, s) => sum + s.quantity, 0),
      totalSale: sales.reduce((sum, s) => sum + s.total_sale, 0),
      count: sales.length,
      paidCount: sales.filter(s => s.payment_status === 'Paid').length,
      dueCount: sales.filter(s => s.payment_status === 'Due').length,
      partialCount: sales.filter(s => s.payment_status === 'Partial').length,
    };
    summary.avgRate = summary.totalQty > 0 ? (summary.totalSale / summary.totalQty) : 0;

    res.json({ sales, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { date, customer_id, customer_name, quantity, unit = 'Liter', selling_rate, payment_status = 'Paid', customer_phone, customer_address, notes } = req.body;

    if (!date) return res.status(400).json({ error: 'Date is required' });
    const qty = parseFloat(quantity);
    const rate = parseFloat(selling_rate);

    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity sold must be greater than 0' });
    if (isNaN(rate) || rate <= 0) return res.status(400).json({ error: 'Selling rate must be greater than 0' });

    // Enforce stock guard
    const metrics = await getInventoryMetrics();
    if (qty > metrics.currentStock) {
      return res.status(400).json({ 
        error: `Insufficient milk stock. Only ${metrics.currentStock.toFixed(1)} ${unit} currently available in tank.` 
      });
    }

    const totalSale = qty * rate;
    let custName = customer_name?.trim() || 'Retail Cash Customer';
    let custId = customer_id || null;

    if (customer_id) {
      const custRes = await query('SELECT name, phone, address FROM customers WHERE id = ?', [customer_id]);
      if (custRes.rows[0]) {
        custName = custRes.rows[0].name;
      }
    } else if (customer_name && customer_name.trim()) {
      const custRes = await query('SELECT id FROM customers WHERE LOWER(name) = LOWER(?)', [customer_name.trim()]);
      if (custRes.rows.length > 0) {
        custId = custRes.rows[0].id;
      } else {
        const createCust = await query(
          'INSERT INTO customers (name, phone, address, customer_type) VALUES (?, ?, ?, ?)',
          [customer_name.trim(), customer_phone || '', customer_address || '', 'Regular Customer']
        );
        custId = createCust.insertId;
      }
    }

    const insertResult = await query(`
      INSERT INTO milk_sales (date, customer_id, customer_name, quantity, unit, selling_rate, total_sale, customer_phone, customer_address, payment_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [date, custId, custName, qty, unit, rate, totalSale, customer_phone || '', customer_address || '', payment_status, notes || '']);

    const updatedMetrics = await getInventoryMetrics();
    res.status(201).json({
      message: 'Milk sale recorded successfully!',
      sale: { id: insertResult.insertId, date, customer_name: custName, quantity: qty, unit, selling_rate: rate, total_sale: totalSale, payment_status },
      stock: updatedMetrics.currentStock
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

app.put('/api/sales/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingRes = await query('SELECT * FROM milk_sales WHERE id = ?', [id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    const existing = existingRes.rows[0];

    const { date, customer_id, customer_name, quantity, unit, selling_rate, payment_status, customer_phone, customer_address, notes } = req.body;
    const qty = parseFloat(quantity);
    const rate = parseFloat(selling_rate);

    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });
    if (isNaN(rate) || rate <= 0) return res.status(400).json({ error: 'Rate must be greater than 0' });

    const metrics = await getInventoryMetrics();
    const availableStock = metrics.currentStock + parseFloat(existing.quantity);

    if (qty > availableStock) {
      return res.status(400).json({ 
        error: `Insufficient milk stock. Available stock: ${availableStock.toFixed(1)} ${unit || existing.unit}` 
      });
    }

    const totalSale = qty * rate;

    await query(`
      UPDATE milk_sales 
      SET date = ?, customer_id = ?, customer_name = ?, quantity = ?, unit = ?, selling_rate = ?, total_sale = ?, customer_phone = ?, customer_address = ?, payment_status = ?, notes = ?
      WHERE id = ?
    `, [date || existing.date, customer_id || existing.customer_id, customer_name || existing.customer_name, qty, unit || existing.unit, rate, totalSale, customer_phone ?? existing.customer_phone, customer_address ?? existing.customer_address, payment_status || existing.payment_status, notes ?? existing.notes, id]);

    res.json({ message: 'Sale updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM milk_sales WHERE id = ?', [id]);
    const metrics = await getInventoryMetrics();
    res.json({ message: 'Sale deleted successfully', stock: metrics.currentStock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

// ---------------- PRODUCT WASTE API ----------------
app.get('/api/waste', async (req, res) => {
  try {
    const { startDate, endDate, reason, search } = req.query;
    let sql = 'SELECT * FROM product_waste WHERE 1=1';
    const params = [];

    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    if (reason) {
      sql += ' AND reason = ?';
      params.push(reason);
    }
    if (search) {
      sql += ' AND (reason LIKE ? OR notes LIKE ? OR product_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY date DESC, id DESC';
    const result = await query(sql, params);

    const wasteList = result.rows.map(w => ({
      ...w,
      date: normalizeDate(w.date),
      quantity: parseFloat(w.quantity) || 0,
      estimated_loss: parseFloat(w.estimated_loss) || 0
    }));

    const today = normalizeDate(new Date());
    const todayWaste = wasteList.filter(w => w.date === today);

    const summary = {
      totalQty: wasteList.reduce((sum, w) => sum + w.quantity, 0),
      totalLoss: wasteList.reduce((sum, w) => sum + w.estimated_loss, 0),
      count: wasteList.length,
      todayQty: todayWaste.reduce((sum, w) => sum + w.quantity, 0),
      todayLoss: todayWaste.reduce((sum, w) => sum + w.estimated_loss, 0)
    };

    // Grouping by reason
    const reasonMap = {};
    for (const w of wasteList) {
      if (!reasonMap[w.reason]) {
        reasonMap[w.reason] = { reason: w.reason, quantity: 0, loss: 0, count: 0 };
      }
      reasonMap[w.reason].quantity += w.quantity;
      reasonMap[w.reason].loss += w.estimated_loss;
      reasonMap[w.reason].count += 1;
    }
    const reasonTotals = Object.values(reasonMap).sort((a, b) => b.quantity - a.quantity);

    res.json({ waste: wasteList, summary, reasonTotals });
  } catch (err) {
    console.error('Error fetching waste data:', err);
    res.status(500).json({ error: 'Failed to fetch product waste' });
  }
});

app.post('/api/waste', async (req, res) => {
  try {
    const { date, product_name = 'Raw Milk', quantity, unit = 'Liter', reason, estimated_loss, notes } = req.body;

    if (!date) return res.status(400).json({ error: 'Date is required' });
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });
    if (!reason || !reason.trim()) return res.status(400).json({ error: 'Wastage reason is required' });

    // Stock check
    const metrics = await getInventoryMetrics();
    if (qty > metrics.currentStock) {
      return res.status(400).json({ 
        error: `Insufficient stock to record waste. Only ${metrics.currentStock.toFixed(1)} ${unit} currently available.` 
      });
    }

    // If estimated loss not supplied, compute based on weighted average cost or default rate
    let loss = parseFloat(estimated_loss);
    if (isNaN(loss) || loss <= 0) {
      loss = qty * (metrics.weightedAvgCost > 0 ? metrics.weightedAvgCost : 60);
    }

    const insertResult = await query(`
      INSERT INTO product_waste (date, product_name, quantity, unit, reason, estimated_loss, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [date, product_name.trim(), qty, unit, reason.trim(), loss, notes || '']);

    const updatedMetrics = await getInventoryMetrics();
    res.status(201).json({
      message: 'Product waste recorded successfully!',
      waste: { id: insertResult.insertId, date, product_name, quantity: qty, unit, reason, estimated_loss: loss, notes },
      stock: updatedMetrics.currentStock
    });
  } catch (err) {
    console.error('Error adding waste:', err);
    res.status(500).json({ error: 'Failed to record product waste' });
  }
});

app.put('/api/waste/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingRes = await query('SELECT * FROM product_waste WHERE id = ?', [id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Waste record not found' });
    const existing = existingRes.rows[0];

    const { date, product_name, quantity, unit, reason, estimated_loss, notes } = req.body;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });

    const metrics = await getInventoryMetrics();
    const availableStock = metrics.currentStock + parseFloat(existing.quantity);
    if (qty > availableStock) {
      return res.status(400).json({ 
        error: `Insufficient stock. Available stock: ${availableStock.toFixed(1)} ${unit || existing.unit}` 
      });
    }

    const loss = parseFloat(estimated_loss) || (qty * (metrics.weightedAvgCost > 0 ? metrics.weightedAvgCost : 60));

    await query(`
      UPDATE product_waste
      SET date = ?, product_name = ?, quantity = ?, unit = ?, reason = ?, estimated_loss = ?, notes = ?
      WHERE id = ?
    `, [date || existing.date, product_name || existing.product_name, qty, unit || existing.unit, reason || existing.reason, loss, notes ?? existing.notes, id]);

    res.json({ message: 'Product waste updated successfully' });
  } catch (err) {
    console.error('Error updating waste:', err);
    res.status(500).json({ error: 'Failed to update waste record' });
  }
});

app.delete('/api/waste/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM product_waste WHERE id = ?', [id]);
    const metrics = await getInventoryMetrics();
    res.json({ message: 'Waste record deleted successfully', stock: metrics.currentStock });
  } catch (err) {
    console.error('Error deleting waste:', err);
    res.status(500).json({ error: 'Failed to delete waste record' });
  }
});

// ---------------- PARTNER INVESTMENTS API ----------------
app.get('/api/investments', async (req, res) => {
  try {
    const { partner, startDate, endDate, search } = req.query;
    let sql = 'SELECT * FROM partner_investments WHERE 1=1';
    const params = [];

    if (partner) {
      sql += ' AND partner_name = ?';
      params.push(partner);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    if (search) {
      sql += ' AND (partner_name LIKE ? OR notes LIKE ? OR investment_type LIKE ? OR payment_method LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY date DESC, id DESC';
    const result = await query(sql, params);

    const investments = result.rows.map(inv => ({
      ...inv,
      date: normalizeDate(inv.date),
      amount: parseFloat(inv.amount) || 0
    }));

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

    // Fetch all registered partners
    const partnersRes = await query('SELECT * FROM partners ORDER BY id ASC');
    const partnersList = partnersRes.rows;

    // Build breakdown for each partner
    const partnerBreakdown = partnersList.map(p => {
      const pInvestments = investments.filter(inv => inv.partner_name === p.name || inv.partner_id === p.id);
      const pTotal = pInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      const percentage = totalInvested > 0 ? ((pTotal / totalInvested) * 100) : 0;
      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        role: p.role,
        total_invested: pTotal,
        share_percentage: parseFloat(percentage.toFixed(2)),
        entry_count: pInvestments.length
      };
    });

    res.json({
      investments,
      totalInvested,
      count: investments.length,
      partnerSummaries: partnerBreakdown
    });
  } catch (err) {
    console.error('Error fetching partner investments:', err);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

app.post('/api/investments', async (req, res) => {
  try {
    const { partner_name, partner_id, amount, date, investment_type = 'Capital Investment', payment_method = 'Bank Transfer', notes } = req.body;

    if (!partner_name || !partner_name.trim()) return res.status(400).json({ error: 'Partner name is required' });
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Valid investment amount is required' });
    if (!date) return res.status(400).json({ error: 'Date is required' });

    let pId = partner_id || null;
    let pName = partner_name.trim();

    if (!pId) {
      const checkP = await query('SELECT id FROM partners WHERE LOWER(name) = LOWER(?)', [pName]);
      if (checkP.rows.length > 0) {
        pId = checkP.rows[0].id;
      }
    }

    const insertResult = await query(`
      INSERT INTO partner_investments (partner_name, partner_id, amount, date, investment_type, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [pName, pId, amt, date, investment_type, payment_method, notes || '']);

    res.status(201).json({
      message: 'Partner investment recorded successfully!',
      investment: { id: insertResult.insertId, partner_name: pName, partner_id: pId, amount: amt, date, investment_type, payment_method, notes }
    });
  } catch (err) {
    console.error('Error adding investment:', err);
    res.status(500).json({ error: 'Failed to record investment' });
  }
});

app.put('/api/investments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { partner_name, partner_id, amount, date, investment_type, payment_method, notes } = req.body;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Valid investment amount is required' });

    await query(`
      UPDATE partner_investments
      SET partner_name = ?, partner_id = ?, amount = ?, date = ?, investment_type = ?, payment_method = ?, notes = ?
      WHERE id = ?
    `, [partner_name, partner_id || null, amt, date, investment_type, payment_method, notes || '', id]);

    res.json({ message: 'Investment updated successfully' });
  } catch (err) {
    console.error('Error updating investment:', err);
    res.status(500).json({ error: 'Failed to update investment' });
  }
});

app.delete('/api/investments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM partner_investments WHERE id = ?', [id]);
    res.json({ message: 'Investment deleted successfully' });
  } catch (err) {
    console.error('Error deleting investment:', err);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

// ---------------- PARTNERS DIRECTORY API ----------------
app.get('/api/partners', async (req, res) => {
  try {
    const partnersRes = await query('SELECT * FROM partners ORDER BY id ASC');
    const allInvestmentsRes = await query('SELECT partner_name, partner_id, amount FROM partner_investments');
    
    const totalCapital = allInvestmentsRes.rows.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    const partners = partnersRes.rows.map(p => {
      const pInvs = allInvestmentsRes.rows.filter(inv => inv.partner_id === p.id || inv.partner_name === p.name);
      const pTotal = pInvs.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
      const percentage = totalCapital > 0 ? ((pTotal / totalCapital) * 100) : 0;
      return {
        ...p,
        total_invested: pTotal,
        share_percentage: parseFloat(percentage.toFixed(2)),
        investment_count: pInvs.length
      };
    });

    res.json({ partners, totalCapital });
  } catch (err) {
    console.error('Error fetching partners:', err);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

app.post('/api/partners', async (req, res) => {
  try {
    const { name, phone, role, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Partner name is required' });

    const insertRes = await query('INSERT INTO partners (name, phone, role, notes) VALUES (?, ?, ?, ?)', [name.trim(), phone || '', role || 'Partner / Investor', notes || '']);
    res.status(201).json({ message: 'Partner added successfully', id: insertRes.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add partner' });
  }
});

app.put('/api/partners/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, phone, role, notes } = req.body;
    await query('UPDATE partners SET name = ?, phone = ?, role = ?, notes = ? WHERE id = ?', [name.trim(), phone || '', role || 'Partner / Investor', notes || '', id]);
    res.json({ message: 'Partner updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update partner' });
  }
});

// ---------------- STOCK API ----------------
app.get('/api/stock', async (req, res) => {
  try {
    const metrics = await getInventoryMetrics();
    const today = normalizeDate(new Date());

    const todayP = await query('SELECT COALESCE(SUM(quantity), 0) as qty FROM milk_purchases WHERE date = ?', [today]);
    const todayS = await query('SELECT COALESCE(SUM(quantity), 0) as qty FROM milk_sales WHERE date = ?', [today]);
    const todayW = await query('SELECT COALESCE(SUM(quantity), 0) as qty FROM product_waste WHERE date = ?', [today]);

    const todayPurchase = parseFloat(todayP.rows[0]?.qty) || 0;
    const todaySale = parseFloat(todayS.rows[0]?.qty) || 0;
    const todayWaste = parseFloat(todayW.rows[0]?.qty) || 0;

    const movementsRes = await query(`
      SELECT 
        'PURCHASE' as type,
        id,
        date,
        supplier_name as party_name,
        quantity,
        unit,
        purchase_rate as rate,
        total_cost as total_amount,
        created_at
      FROM milk_purchases
      UNION ALL
      SELECT 
        'SALE' as type,
        id,
        date,
        customer_name as party_name,
        quantity,
        unit,
        selling_rate as rate,
        total_sale as total_amount,
        created_at
      FROM milk_sales
      UNION ALL
      SELECT 
        'WASTE' as type,
        id,
        date,
        reason as party_name,
        quantity,
        unit,
        0 as rate,
        estimated_loss as total_amount,
        created_at
      FROM product_waste
      ORDER BY date DESC, created_at DESC
      LIMIT 40
    `);

    const movements = movementsRes.rows.map(m => ({
      ...m,
      date: normalizeDate(m.date),
      quantity: parseFloat(m.quantity) || 0,
      rate: parseFloat(m.rate) || 0,
      total_amount: parseFloat(m.total_amount) || 0
    }));

    res.json({
      availableStock: metrics.currentStock,
      totalPurchased: metrics.totalPurchased,
      totalSold: metrics.totalSold,
      totalWasted: metrics.totalWasted,
      totalWasteLoss: metrics.totalWasteLoss,
      todayPurchase,
      todaySale,
      todayWaste,
      todayRemaining: todayPurchase - todaySale - todayWaste,
      weightedAvgCost: metrics.weightedAvgCost,
      movements
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stock info' });
  }
});

// ---------------- RATES API ----------------
app.get('/api/rates', async (req, res) => {
  try {
    const ratesRes = await query('SELECT * FROM milk_rates ORDER BY date DESC, id DESC');
    const rates = ratesRes.rows.map(r => ({
      ...r,
      date: normalizeDate(r.date),
      purchase_rate: parseFloat(r.purchase_rate) || 0,
      selling_rate: parseFloat(r.selling_rate) || 0
    }));
    const latest = rates[0] || { purchase_rate: 60, selling_rate: 85, unit: 'Liter', date: normalizeDate(new Date()) };
    res.json({ rates, latest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

app.post('/api/rates', async (req, res) => {
  try {
    const { date, purchase_rate, selling_rate, unit = 'Liter', notes } = req.body;
    const pRate = parseFloat(purchase_rate);
    const sRate = parseFloat(selling_rate);

    if (!date) return res.status(400).json({ error: 'Date is required' });
    if (isNaN(pRate) || pRate <= 0) return res.status(400).json({ error: 'Valid purchase rate is required' });
    if (isNaN(sRate) || sRate <= 0) return res.status(400).json({ error: 'Valid selling rate is required' });

    await query(`
      INSERT INTO milk_rates (date, purchase_rate, selling_rate, unit, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [date, pRate, sRate, unit, notes || '']);

    await query('UPDATE settings SET value = ? WHERE key = ?', [String(pRate), 'default_purchase_rate']);
    await query('UPDATE settings SET value = ? WHERE key = ?', [String(sRate), 'default_selling_rate']);
    await query('UPDATE settings SET value = ? WHERE key = ?', [unit, 'default_unit']);

    res.status(201).json({ message: 'Rate updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save rate' });
  }
});

// ---------------- DAILY SUMMARY API (High Performance Single Aggregates) ----------------
app.get('/api/daily-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = [];
    let dateWhereP = 'WHERE 1=1';
    let dateWhereS = 'WHERE 1=1';
    let dateWhereE = 'WHERE 1=1';
    let dateWhereW = 'WHERE 1=1';

    if (startDate) {
      dateWhereP += ' AND date >= ?';
      dateWhereS += ' AND date >= ?';
      dateWhereE += ' AND date >= ?';
      dateWhereW += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateWhereP += ' AND date <= ?';
      dateWhereS += ' AND date <= ?';
      dateWhereE += ' AND date <= ?';
      dateWhereW += ' AND date <= ?';
      params.push(endDate);
    }

    const [purchasesAgg, salesAgg, expensesAgg, wasteAgg, metrics] = await Promise.all([
      query(`SELECT date, COALESCE(SUM(quantity), 0) as qty, COALESCE(SUM(total_cost), 0) as cost FROM milk_purchases ${dateWhereP} GROUP BY date`, params),
      query(`SELECT date, COALESCE(SUM(quantity), 0) as qty, COALESCE(SUM(total_sale), 0) as revenue FROM milk_sales ${dateWhereS} GROUP BY date`, params),
      query(`SELECT date, COALESCE(SUM(amount), 0) as total FROM expenses ${dateWhereE} GROUP BY date`, params),
      query(`SELECT date, COALESCE(SUM(quantity), 0) as qty, COALESCE(SUM(estimated_loss), 0) as loss FROM product_waste ${dateWhereW} GROUP BY date`, params),
      getInventoryMetrics()
    ]);

    const dateMap = {};

    for (const r of purchasesAgg.rows) {
      const d = normalizeDate(r.date);
      if (!dateMap[d]) dateMap[d] = { date: d, purchasedQty: 0, purchaseCost: 0, soldQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      dateMap[d].purchasedQty += parseFloat(r.qty) || 0;
      dateMap[d].purchaseCost += parseFloat(r.cost) || 0;
    }

    for (const r of salesAgg.rows) {
      const d = normalizeDate(r.date);
      if (!dateMap[d]) dateMap[d] = { date: d, purchasedQty: 0, purchaseCost: 0, soldQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      dateMap[d].soldQty += parseFloat(r.qty) || 0;
      dateMap[d].salesRevenue += parseFloat(r.revenue) || 0;
    }

    for (const r of expensesAgg.rows) {
      const d = normalizeDate(r.date);
      if (!dateMap[d]) dateMap[d] = { date: d, purchasedQty: 0, purchaseCost: 0, soldQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      dateMap[d].expenses += parseFloat(r.total) || 0;
    }

    for (const r of wasteAgg.rows) {
      const d = normalizeDate(r.date);
      if (!dateMap[d]) dateMap[d] = { date: d, purchasedQty: 0, purchaseCost: 0, soldQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      dateMap[d].wasteQty += parseFloat(r.qty) || 0;
      dateMap[d].wasteLoss += parseFloat(r.loss) || 0;
    }

    const dailyData = Object.values(dateMap)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(row => {
        const avgPurchaseRate = row.purchasedQty > 0 ? (row.purchaseCost / row.purchasedQty) : 0;
        const avgSellingRate = row.soldQty > 0 ? (row.salesRevenue / row.soldQty) : 0;
        const cogs = row.soldQty * metrics.weightedAvgCost;
        const grossProfit = row.salesRevenue - cogs;
        const netProfit = grossProfit - row.expenses - row.wasteLoss;
        const remaining = row.purchasedQty - row.soldQty - row.wasteQty;

        return {
          date: row.date,
          purchasedQty: row.purchasedQty,
          purchaseCost: row.purchaseCost,
          soldQty: row.soldQty,
          salesRevenue: row.salesRevenue,
          wasteQty: row.wasteQty,
          wasteLoss: row.wasteLoss,
          remaining,
          avgPurchaseRate,
          avgSellingRate,
          cogs: Math.round(cogs),
          grossProfit: Math.round(grossProfit),
          expenses: row.expenses,
          netProfit: Math.round(netProfit),
          grossMargin: row.salesRevenue > 0 ? ((grossProfit / row.salesRevenue) * 100).toFixed(1) : '0.0'
        };
      });

    res.json({ dailyData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// ---------------- REPORTS API (High Performance Period Aggregates) ----------------
app.get('/api/reports', async (req, res) => {
  try {
    const { type = 'monthly', startDate, endDate } = req.query;
    let start = startDate;
    let end = endDate;

    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split('T')[0];

    if (!start || !end) {
      if (type === 'daily') {
        start = todayStr;
        end = todayStr;
      } else if (type === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        start = weekAgo.toISOString().split('T')[0];
        end = todayStr;
      } else if (type === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        start = monthAgo.toISOString().split('T')[0];
        end = todayStr;
      } else {
        start = '2026-01-01';
        end = todayStr;
      }
    }

    const [
      metrics,
      priorP,
      priorS,
      priorW,
      periodP,
      periodS,
      periodW,
      periodE,
      expBreakdownRes,
      purchasesBreakdown,
      salesBreakdown,
      expensesBreakdown,
      wasteBreakdown
    ] = await Promise.all([
      getInventoryMetrics(),
      query('SELECT COALESCE(SUM(quantity), 0) as qty FROM milk_purchases WHERE date < ?', [start]),
      query('SELECT COALESCE(SUM(quantity), 0) as qty FROM milk_sales WHERE date < ?', [start]),
      query('SELECT COALESCE(SUM(quantity), 0) as qty FROM product_waste WHERE date < ?', [start]),
      query('SELECT COALESCE(SUM(quantity), 0) as total_qty, COALESCE(SUM(total_cost), 0) as total_cost, COUNT(*) as total_orders FROM milk_purchases WHERE date >= ? AND date <= ?', [start, end]),
      query('SELECT COALESCE(SUM(quantity), 0) as total_qty, COALESCE(SUM(total_sale), 0) as total_revenue, COUNT(*) as total_orders FROM milk_sales WHERE date >= ? AND date <= ?', [start, end]),
      query('SELECT COALESCE(SUM(quantity), 0) as total_qty, COALESCE(SUM(estimated_loss), 0) as total_loss, COUNT(*) as total_count FROM product_waste WHERE date >= ? AND date <= ?', [start, end]),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date <= ?', [start, end]),
      query('SELECT category, SUM(amount) as amount, COUNT(*) as count FROM expenses WHERE date >= ? AND date <= ? GROUP BY category ORDER BY amount DESC', [start, end]),
      query('SELECT date, SUM(quantity) as qty, SUM(total_cost) as cost FROM milk_purchases WHERE date >= ? AND date <= ? GROUP BY date', [start, end]),
      query('SELECT date, SUM(quantity) as qty, SUM(total_sale) as rev FROM milk_sales WHERE date >= ? AND date <= ? GROUP BY date', [start, end]),
      query('SELECT date, SUM(amount) as exp FROM expenses WHERE date >= ? AND date <= ? GROUP BY date', [start, end]),
      query('SELECT date, SUM(quantity) as qty, SUM(estimated_loss) as loss FROM product_waste WHERE date >= ? AND date <= ? GROUP BY date', [start, end])
    ]);

    const openingStock = Math.max(0, 
      (parseFloat(priorP.rows[0]?.qty) || 0) - 
      (parseFloat(priorS.rows[0]?.qty) || 0) - 
      (parseFloat(priorW.rows[0]?.qty) || 0)
    );

    const purchased = parseFloat(periodP.rows[0]?.total_qty) || 0;
    const purchaseCost = parseFloat(periodP.rows[0]?.total_cost) || 0;
    const sold = parseFloat(periodS.rows[0]?.total_qty) || 0;
    const salesRevenue = parseFloat(periodS.rows[0]?.total_revenue) || 0;
    const wasted = parseFloat(periodW.rows[0]?.total_qty) || 0;
    const wasteLoss = parseFloat(periodW.rows[0]?.total_loss) || 0;
    const totalExpenses = parseFloat(periodE.rows[0]?.total) || 0;
    const closingStock = Math.max(0, openingStock + purchased - sold - wasted);

    const avgPurchaseRate = purchased > 0 ? (purchaseCost / purchased) : 0;
    const avgSellingRate = sold > 0 ? (salesRevenue / sold) : 0;

    const cogs = sold * metrics.weightedAvgCost;
    const grossProfit = salesRevenue - cogs;
    const netProfit = grossProfit - totalExpenses - wasteLoss;
    const grossMargin = salesRevenue > 0 ? ((grossProfit / salesRevenue) * 100) : 0;
    const profitPerLiter = sold > 0 ? (grossProfit / sold) : 0;

    // Build timeline breakdown in memory
    const timelineMap = {};
    for (const r of purchasesBreakdown.rows) {
      const d = normalizeDate(r.date);
      if (!timelineMap[d]) timelineMap[d] = { date: d, purchasedQty: 0, purchaseCost: 0, soldQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      timelineMap[d].purchasedQty = parseFloat(r.qty) || 0;
      timelineMap[d].purchaseCost = parseFloat(r.cost) || 0;
    }
    for (const r of salesBreakdown.rows) {
      const d = normalizeDate(r.date);
      if (!timelineMap[d]) timelineMap[d] = { date: d, purchasedQty: 0, purchaseCost: 0, soldQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      timelineMap[d].soldQty = parseFloat(r.qty) || 0;
      timelineMap[d].salesRevenue = parseFloat(r.rev) || 0;
    }
    for (const r of expensesBreakdown.rows) {
      const d = normalizeDate(r.date);
      if (!timelineMap[d]) timelineMap[d] = { date: d, purchasedQty: 0, purchaseCost: 0, soldQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      timelineMap[d].expenses = parseFloat(r.exp) || 0;
    }
    for (const r of wasteBreakdown.rows) {
      const d = normalizeDate(r.date);
      if (!timelineMap[d]) timelineMap[d] = { date: d, purchasedQty: 0, purchaseCost: 0, soldQty: 0, salesRevenue: 0, expenses: 0, wasteQty: 0, wasteLoss: 0 };
      timelineMap[d].wasteQty = parseFloat(r.qty) || 0;
      timelineMap[d].wasteLoss = parseFloat(r.loss) || 0;
    }

    const breakdown = Object.values(timelineMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(row => {
        const dayCogs = row.soldQty * metrics.weightedAvgCost;
        const dayGrossProfit = row.salesRevenue - dayCogs;
        return {
          date: row.date,
          purchasedQty: row.purchasedQty,
          purchaseCost: row.purchaseCost,
          soldQty: row.soldQty,
          salesRevenue: row.salesRevenue,
          wasteQty: row.wasteQty,
          wasteLoss: row.wasteLoss,
          cogs: Math.round(dayCogs),
          grossProfit: Math.round(dayGrossProfit),
          expenses: row.expenses,
          netProfit: Math.round(dayGrossProfit - row.expenses - row.wasteLoss),
        };
      });

    res.json({
      period: { type, startDate: start, endDate: end },
      stock: { openingStock, purchased, sold, wasted, closingStock },
      purchaseSummary: { totalQty: purchased, totalCost: purchaseCost, avgRate: avgPurchaseRate, orderCount: parseInt(periodP.rows[0]?.total_orders, 10) || 0 },
      salesSummary: { totalQty: sold, totalRevenue: salesRevenue, avgRate: avgSellingRate, orderCount: parseInt(periodS.rows[0]?.total_orders, 10) || 0 },
      wasteSummary: { totalQty: wasted, totalLoss: wasteLoss, count: parseInt(periodW.rows[0]?.total_count, 10) || 0 },
      profitSummary: { cogs: Math.round(cogs), grossProfit: Math.round(grossProfit), grossMargin: parseFloat(grossMargin.toFixed(2)), profitPerLiter: parseFloat(profitPerLiter.toFixed(2)), expenses: totalExpenses, wasteLoss, netProfit: Math.round(netProfit) },
      expenseBreakdown: expBreakdownRes.rows.map(r => ({ category: r.category, amount: parseFloat(r.amount), count: parseInt(r.count, 10) })),
      breakdown
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

// ---------------- EXPENSES API ----------------
app.get('/api/expenses', async (req, res) => {
  try {
    const { category, startDate, endDate, search } = req.query;
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY date DESC, id DESC';
    const result = await query(sql, params);

    const expenses = result.rows.map(e => ({
      ...e,
      date: normalizeDate(e.date),
      amount: parseFloat(e.amount) || 0
    }));

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const catTotalsRes = await query('SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses GROUP BY category ORDER BY total DESC');
    const categoryTotals = catTotalsRes.rows.map(c => ({ category: c.category, total: parseFloat(c.total), count: parseInt(c.count, 10) }));

    res.json({ expenses, totalAmount, categoryTotals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { date, name, category, amount, notes } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    if (!name?.trim()) return res.status(400).json({ error: 'Expense name is required' });
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Amount must be greater than 0' });

    const insertResult = await query(
      'INSERT INTO expenses (date, name, category, amount, notes) VALUES (?, ?, ?, ?, ?)',
      [date, name.trim(), category, amt, notes || '']
    );

    res.status(201).json({ message: 'Expense added successfully', expense: { id: insertResult.insertId, date, name: name.trim(), category, amount: amt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { date, name, category, amount, notes } = req.body;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Amount must be greater than 0' });

    await query(
      'UPDATE expenses SET date = ?, name = ?, category = ?, amount = ?, notes = ? WHERE id = ?',
      [date, name, category, amt, notes || '', id]
    );

    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ---------------- CUSTOMERS API (Optimized Single Grouping) ----------------
app.get('/api/customers', async (req, res) => {
  try {
    const custRes = await query('SELECT * FROM customers ORDER BY name ASC');
    const salesStatsRes = await query(`
      SELECT 
        customer_id,
        customer_name,
        COALESCE(SUM(quantity), 0) as total_qty,
        COALESCE(SUM(total_sale), 0) as total_spent,
        COUNT(*) as order_count,
        COALESCE(SUM(CASE WHEN payment_status = 'Due' THEN total_sale ELSE 0 END), 0) as total_due
      FROM milk_sales
      GROUP BY customer_id, customer_name
    `);

    const statsMap = {};
    for (const r of salesStatsRes.rows) {
      if (r.customer_id) statsMap[`id_${r.customer_id}`] = r;
      if (r.customer_name) statsMap[`name_${r.customer_name.toLowerCase()}`] = r;
    }

    const customers = custRes.rows.map(c => {
      const stats = statsMap[`id_${c.id}`] || statsMap[`name_${c.name.toLowerCase()}`] || {};
      return {
        ...c,
        total_qty: parseFloat(stats.total_qty) || 0,
        total_spent: parseFloat(stats.total_spent) || 0,
        total_due: parseFloat(stats.total_due) || 0,
        order_count: parseInt(stats.order_count, 10) || 0
      };
    });

    res.json({ customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.get('/api/customers/:id/sales', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const custRes = await query('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRes.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    const customer = custRes.rows[0];

    const salesRes = await query('SELECT * FROM milk_sales WHERE customer_id = ? OR customer_name = ? ORDER BY date DESC', [id, customer.name]);
    const sales = salesRes.rows.map(s => ({
      ...s,
      date: normalizeDate(s.date),
      quantity: parseFloat(s.quantity) || 0,
      selling_rate: parseFloat(s.selling_rate) || 0,
      total_sale: parseFloat(s.total_sale) || 0
    }));

    res.json({ customer, sales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customer history' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, address, customer_type = 'Regular Customer', notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Customer name is required' });

    const insertResult = await query(
      'INSERT INTO customers (name, phone, address, customer_type, notes) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), phone || '', address || '', customer_type, notes || '']
    );

    res.status(201).json({ message: 'Customer added successfully', customer: { id: insertResult.insertId, name: name.trim(), phone, address, customer_type } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, phone, address, customer_type, notes } = req.body;
    await query(
      'UPDATE customers SET name = ?, phone = ?, address = ?, customer_type = ?, notes = ? WHERE id = ?',
      [name, phone, address, customer_type, notes, id]
    );
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ---------------- SUPPLIERS API (Optimized Single Grouping) ----------------
app.get('/api/suppliers', async (req, res) => {
  try {
    const supRes = await query('SELECT * FROM suppliers ORDER BY name ASC');
    const purchaseStatsRes = await query(`
      SELECT 
        supplier_id,
        supplier_name,
        COALESCE(SUM(quantity), 0) as total_qty,
        COALESCE(SUM(total_cost), 0) as total_paid,
        COUNT(*) as purchase_count
      FROM milk_purchases
      GROUP BY supplier_id, supplier_name
    `);

    const statsMap = {};
    for (const r of purchaseStatsRes.rows) {
      if (r.supplier_id) statsMap[`id_${r.supplier_id}`] = r;
      if (r.supplier_name) statsMap[`name_${r.supplier_name.toLowerCase()}`] = r;
    }

    const suppliers = supRes.rows.map(s => {
      const stats = statsMap[`id_${s.id}`] || statsMap[`name_${s.name.toLowerCase()}`] || {};
      return {
        ...s,
        total_qty: parseFloat(stats.total_qty) || 0,
        total_paid: parseFloat(stats.total_paid) || 0,
        purchase_count: parseInt(stats.purchase_count, 10) || 0
      };
    });

    res.json({ suppliers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.get('/api/suppliers/:id/purchases', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const supRes = await query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (supRes.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    const supplier = supRes.rows[0];

    const purchasesRes = await query('SELECT * FROM milk_purchases WHERE supplier_id = ? OR supplier_name = ? ORDER BY date DESC', [id, supplier.name]);
    const purchases = purchasesRes.rows.map(p => ({
      ...p,
      date: normalizeDate(p.date),
      quantity: parseFloat(p.quantity) || 0,
      purchase_rate: parseFloat(p.purchase_rate) || 0,
      total_cost: parseFloat(p.total_cost) || 0
    }));

    res.json({ supplier, purchases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch supplier history' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Supplier name is required' });

    const insertResult = await query(
      'INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)',
      [name.trim(), phone || '', address || '', notes || '']
    );

    res.status(201).json({ message: 'Supplier added successfully', supplier: { id: insertResult.insertId, name: name.trim(), phone, address } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add supplier' });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, phone, address, notes } = req.body;
    await query(
      'UPDATE suppliers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ?',
      [name, phone, address, notes, id]
    );
    res.json({ message: 'Supplier updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// ---------------- SETTINGS API ----------------
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await query('SELECT key, value FROM settings');
    const settings = {};
    rows.rows.forEach(r => settings[r.key] = r.value);
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const newSettings = req.body;
    for (const [key, value] of Object.entries(newSettings)) {
      if (process.env.DATABASE_URL) {
        await query('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, String(value)]);
      } else {
        await query('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, String(value)]);
      }
    }
    res.json({ message: 'Settings saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// =================== PRODUCTS API ===================

// GET all products
app.get('/api/products', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM products WHERE is_active = ? ORDER BY name ASC', [true]);
    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST create product
app.post('/api/products', authenticate, async (req, res) => {
  try {
    const { name, unit, default_price, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name required' });
    const result = await query(
      'INSERT INTO products (name, unit, default_price, description) VALUES (?, ?, ?, ?) RETURNING *',
      [name.trim(), unit || 'Piece', parseFloat(default_price) || 0, description || '']
    );
    res.status(201).json({ product: result.rows[0], message: 'Product created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product
app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { name, unit, default_price, description } = req.body;
    await query(
      'UPDATE products SET name = ?, unit = ?, default_price = ?, description = ? WHERE id = ?',
      [name.trim(), unit || 'Piece', parseFloat(default_price) || 0, description || '', req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
app.delete('/api/products/:id', authenticate, async (req, res) => {
  try {
    await query('UPDATE products SET is_active = ? WHERE id = ?', [false, req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// =================== PRODUCT SALES API ===================

// GET product sales
app.get('/api/product-sales', authenticate, async (req, res) => {
  try {
    const { limit = 100, product_id } = req.query;
    let sql = 'SELECT * FROM product_sales';
    const params = [];
    if (product_id) {
      sql += ' WHERE product_id = ?';
      params.push(product_id);
    }
    sql += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const result = await query(sql, params);
    
    // Summary stats
    const statsRes = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(quantity), 0) as total_qty,
        COUNT(*) as total_count
      FROM product_sales
    `);

    res.json({ sales: result.rows.map(s => ({ ...s, date: normalizeDate(s.date) })), stats: statsRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product sales' });
  }
});

// POST create product sale
app.post('/api/product-sales', authenticate, async (req, res) => {
  try {
    const { date, product_id, product_name, quantity, unit, selling_price, customer_name, customer_phone, payment_status, notes } = req.body;
    if (!product_name) return res.status(400).json({ error: 'Product name required' });
    if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Valid quantity required' });
    if (selling_price < 0) return res.status(400).json({ error: 'Selling price cannot be negative' });

    const total_amount = parseFloat(quantity) * parseFloat(selling_price);
    const result = await query(
      `INSERT INTO product_sales (date, product_id, product_name, quantity, unit, selling_price, total_amount, customer_name, customer_phone, payment_status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [
        date || new Date().toISOString().substring(0, 10),
        product_id || null,
        product_name.trim(),
        parseFloat(quantity),
        unit || 'Piece',
        parseFloat(selling_price) || 0,
        total_amount,
        customer_name?.trim() || 'Cash Customer',
        customer_phone || '',
        payment_status || 'Paid',
        notes?.trim() || ''
      ]
    );
    res.status(201).json({ sale: result.rows[0], message: 'Product sale recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product sale' });
  }
});

// DELETE product sale
app.delete('/api/product-sales/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM product_sales WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product sale' });
  }
});

// =================== PRODUCT PURCHASES API (দই ও অন্যান্য পণ্য ক্রয়) ===================

// GET product purchases
app.get('/api/product-purchases', authenticate, async (req, res) => {
  try {
    const { limit = 100, product_id } = req.query;
    let sql = 'SELECT * FROM product_purchases';
    const params = [];
    if (product_id) {
      sql += ' WHERE product_id = ?';
      params.push(product_id);
    }
    sql += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const result = await query(sql, params);
    
    // Summary stats
    const statsRes = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_cost,
        COALESCE(SUM(quantity), 0) as total_qty,
        COUNT(*) as total_count
      FROM product_purchases
    `);

    res.json({ purchases: result.rows.map(p => ({ ...p, date: normalizeDate(p.date) })), stats: statsRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product purchases' });
  }
});

// POST create product purchase
app.post('/api/product-purchases', authenticate, async (req, res) => {
  try {
    const { date, product_id, product_name, quantity, unit, purchase_price, supplier_name, supplier_phone, payment_status, notes } = req.body;
    if (!product_name) return res.status(400).json({ error: 'Product name required' });
    if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Valid quantity required' });
    if (purchase_price < 0) return res.status(400).json({ error: 'Purchase price cannot be negative' });

    const total_amount = parseFloat(quantity) * parseFloat(purchase_price);
    const result = await query(
      `INSERT INTO product_purchases (date, product_id, product_name, quantity, unit, purchase_price, total_amount, supplier_name, supplier_phone, payment_status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [
        date || new Date().toISOString().substring(0, 10),
        product_id || null,
        product_name.trim(),
        parseFloat(quantity),
        unit || 'Piece',
        parseFloat(purchase_price) || 0,
        total_amount,
        supplier_name?.trim() || 'General Supplier',
        supplier_phone || '',
        payment_status || 'Paid',
        notes?.trim() || ''
      ]
    );
    res.status(201).json({ purchase: result.rows[0], message: 'Product purchase recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product purchase' });
  }
});

// DELETE product purchase
app.delete('/api/product-purchases/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM product_purchases WHERE id = ?', [req.params.id]);
    res.json({ message: 'Purchase deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product purchase' });
  }
});

// SPA Fallback for production routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.send('DairyPureOrganic Milk Manager API running.');
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🥛 DairyPureOrganic Milk Manager Backend running on port ${PORT}`);
  });
}

export default app;
