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

  const totalPurchased = parseFloat(purchaseRes.rows[0].total_purchased) || 0;
  const totalPurchaseCost = parseFloat(purchaseRes.rows[0].total_purchase_cost) || 0;
  const totalSold = parseFloat(salesRes.rows[0].total_sold) || 0;
  const totalSalesRevenue = parseFloat(salesRes.rows[0].total_sales_revenue) || 0;
  const totalExpenses = parseFloat(expenseRes.rows[0].total_expenses) || 0;

  const currentStock = Math.max(0, totalPurchased - totalSold);
  const weightedAvgCost = totalPurchased > 0 ? (totalPurchaseCost / totalPurchased) : 0;
  const cogs = totalSold * weightedAvgCost;
  const grossProfit = totalSalesRevenue - cogs;
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100) : 0;
  const profitPerLiter = totalSold > 0 ? (grossProfit / totalSold) : 0;
  const avgSellingRate = totalSold > 0 ? (totalSalesRevenue / totalSold) : 0;

  return {
    totalPurchased,
    totalPurchaseCost,
    totalSold,
    totalSalesRevenue,
    currentStock,
    weightedAvgCost,
    cogs,
    grossProfit,
    totalExpenses,
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
    const today = new Date().toISOString().substring(0, 10);
    const currentYearMonth = today.substring(0, 7); // e.g. '2026-09'

    const allPurchasesRes = await query('SELECT * FROM milk_purchases ORDER BY date DESC, id DESC');
    const allSalesRes = await query('SELECT * FROM milk_sales ORDER BY date DESC, id DESC');
    const allExpensesRes = await query('SELECT * FROM expenses ORDER BY date DESC, id DESC');
    const latestRateRes = await query('SELECT * FROM milk_rates ORDER BY date DESC, id DESC LIMIT 1');

    // Financial & Volume Accumulators
    let totalPurchased = 0;
    let totalPurchaseCost = 0;
    let totalSold = 0;
    let totalSalesRevenue = 0;
    let totalExpenses = 0;

    let todayPurchaseQty = 0;
    let todayPurchaseCost = 0;
    let todaySalesQty = 0;
    let todaySalesRevenue = 0;
    let todayExpenseTotal = 0;

    let monthPurchaseQty = 0;
    let monthPurchaseCost = 0;
    let monthSalesQty = 0;
    let monthSalesRevenue = 0;
    let monthExpenseTotal = 0;

    const dateMap = {};

    for (const p of allPurchasesRes.rows) {
      const q = parseFloat(p.quantity) || 0;
      const c = parseFloat(p.total_cost) || 0;
      const d = String(p.date).substring(0, 10);

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

      if (!dateMap[d]) dateMap[d] = { date: d, purchaseQty: 0, purchaseCost: 0, salesQty: 0, salesRevenue: 0, expenses: 0 };
      dateMap[d].purchaseQty += q;
      dateMap[d].purchaseCost += c;
    }

    for (const s of allSalesRes.rows) {
      const q = parseFloat(s.quantity) || 0;
      const r = parseFloat(s.total_sale) || 0;
      const d = String(s.date).substring(0, 10);

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

      if (!dateMap[d]) dateMap[d] = { date: d, purchaseQty: 0, purchaseCost: 0, salesQty: 0, salesRevenue: 0, expenses: 0 };
      dateMap[d].salesQty += q;
      dateMap[d].salesRevenue += r;
    }

    for (const e of allExpensesRes.rows) {
      const a = parseFloat(e.amount) || 0;
      const d = String(e.date).substring(0, 10);

      totalExpenses += a;

      if (d === today) {
        todayExpenseTotal += a;
      }
      if (d.startsWith(currentYearMonth)) {
        monthExpenseTotal += a;
      }

      if (!dateMap[d]) dateMap[d] = { date: d, purchaseQty: 0, purchaseCost: 0, salesQty: 0, salesRevenue: 0, expenses: 0 };
      dateMap[d].expenses += a;
    }

    const currentStock = Math.max(0, totalPurchased - totalSold);
    const weightedAvgCost = totalPurchased > 0 ? (totalPurchaseCost / totalPurchased) : 0;
    const totalCOGS = totalSold * weightedAvgCost;
    const totalGrossProfit = totalSalesRevenue - totalCOGS;
    const totalNetProfit = totalGrossProfit - totalExpenses;
    const grossMargin = totalSalesRevenue > 0 ? ((totalGrossProfit / totalSalesRevenue) * 100) : 0;
    const profitPerLiter = totalSold > 0 ? (totalGrossProfit / totalSold) : 0;
    const avgSellingRate = totalSold > 0 ? (totalSalesRevenue / totalSold) : 0;

    const todayCOGS = todaySalesQty * weightedAvgCost;
    const todayGrossProfit = todaySalesRevenue - todayCOGS;
    const todayNetProfit = todayGrossProfit - todayExpenseTotal;
    const todayRemaining = todayPurchaseQty - todaySalesQty;

    const monthCOGS = monthSalesQty * weightedAvgCost;
    const monthGrossProfit = monthSalesRevenue - monthCOGS;
    const monthNetProfit = monthGrossProfit - monthExpenseTotal;

    const formattedCharts = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)).map(row => {
      const cogs = row.salesQty * weightedAvgCost;
      const grossProfit = row.salesRevenue - cogs;
      const netProfit = grossProfit - row.expenses;
      return {
        ...row,
        grossProfit: Math.round(grossProfit),
        netProfit: Math.round(netProfit),
        cogs: Math.round(cogs)
      };
    });

    res.json({
      today: {
        date: today,
        purchaseQty: todayPurchaseQty,
        purchaseCost: todayPurchaseCost,
        salesQty: todaySalesQty,
        salesRevenue: todaySalesRevenue,
        expenses: todayExpenseTotal,
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
        currentStock,
        weightedAvgCost,
        totalCOGS,
        totalGrossProfit,
        totalExpenses,
        totalNetProfit,
        grossMargin,
        profitPerLiter,
        avgSellingRate
      },
      month: {
        purchaseQty: monthPurchaseQty,
        purchaseCost: monthPurchaseCost,
        salesQty: monthSalesQty,
        salesRevenue: monthSalesRevenue,
        expenses: monthExpenseTotal,
        grossProfit: Math.round(monthGrossProfit),
        netProfit: Math.round(monthNetProfit),
      },
      latestRate: latestRateRes.rows[0] || { purchase_rate: 60, selling_rate: 85, unit: 'Liter' },
      charts: formattedCharts,
      recentPurchases: allPurchasesRes.rows.slice(0, 5).map(p => ({ ...p, date: String(p.date).substring(0, 10) })),
      recentSales: allSalesRes.rows.slice(0, 5).map(s => ({ ...s, date: String(s.date).substring(0, 10) })),
      recentExpenses: allExpensesRes.rows.slice(0, 5).map(e => ({ ...e, date: String(e.date).substring(0, 10) }))
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
      sql += ' AND (supplier_name ILIKE ? OR notes ILIKE ? OR supplier_phone ILIKE ?)';
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
      date: String(p.date).substring(0, 10),
      quantity: parseFloat(p.quantity),
      purchase_rate: parseFloat(p.purchase_rate),
      total_cost: parseFloat(p.total_cost)
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
    const hypotheticalStock = (metrics.totalPurchased - parseFloat(existing.quantity) + qty) - metrics.totalSold;
    if (hypotheticalStock < 0) {
      return res.status(400).json({ 
        error: `Cannot reduce purchase quantity to ${qty} L because ${metrics.totalSold} L has already been sold. Remaining stock would become negative (${hypotheticalStock.toFixed(1)} L).` 
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
    const hypotheticalStock = (metrics.totalPurchased - parseFloat(existing.quantity)) - metrics.totalSold;
    if (hypotheticalStock < 0) {
      return res.status(400).json({ 
        error: `Cannot delete this purchase of ${existing.quantity} L. Total sold is ${metrics.totalSold} L and deleting this purchase would cause stock to drop to ${hypotheticalStock.toFixed(1)} L.` 
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
      sql += ' AND (customer_name ILIKE ? OR notes ILIKE ? OR customer_phone ILIKE ?)';
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
      date: String(s.date).substring(0, 10),
      quantity: parseFloat(s.quantity),
      selling_rate: parseFloat(s.selling_rate),
      total_sale: parseFloat(s.total_sale)
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

// ---------------- STOCK API ----------------
app.get('/api/stock', async (req, res) => {
  try {
    const metrics = await getInventoryMetrics();
    const today = new Date().toISOString().split('T')[0];

    const todayP = await query('SELECT COALESCE(SUM(quantity), 0) as qty FROM milk_purchases WHERE date = ?', [today]);
    const todayS = await query('SELECT COALESCE(SUM(quantity), 0) as qty FROM milk_sales WHERE date = ?', [today]);

    const todayPurchase = parseFloat(todayP.rows[0].qty) || 0;
    const todaySale = parseFloat(todayS.rows[0].qty) || 0;

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
      ORDER BY date DESC, created_at DESC
      LIMIT 30
    `);

    const movements = movementsRes.rows.map(m => ({
      ...m,
      date: String(m.date).substring(0, 10),
      quantity: parseFloat(m.quantity),
      rate: parseFloat(m.rate),
      total_amount: parseFloat(m.total_amount)
    }));

    res.json({
      availableStock: metrics.currentStock,
      totalPurchased: metrics.totalPurchased,
      totalSold: metrics.totalSold,
      todayPurchase,
      todaySale,
      todayRemaining: todayPurchase - todaySale,
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
      date: String(r.date).substring(0, 10),
      purchase_rate: parseFloat(r.purchase_rate),
      selling_rate: parseFloat(r.selling_rate)
    }));
    const latest = rates[0] || { purchase_rate: 60, selling_rate: 85, unit: 'Liter', date: new Date().toISOString().split('T')[0] };
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

// ---------------- DAILY SUMMARY API ----------------
app.get('/api/daily-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let sql = `
      WITH all_dates AS (
        SELECT DISTINCT date FROM milk_purchases
        UNION
        SELECT DISTINCT date FROM milk_sales
      )
      SELECT d.date
      FROM all_dates d
      WHERE 1=1
    `;
    const params = [];
    if (startDate) {
      sql += ' AND d.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND d.date <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY d.date DESC';

    const dateRows = await query(sql, params);
    const metrics = await getInventoryMetrics();

    const dailyData = await Promise.all(dateRows.rows.map(async ({ date }) => {
      const p = await query('SELECT COALESCE(SUM(quantity), 0) as qty, COALESCE(SUM(total_cost), 0) as cost FROM milk_purchases WHERE date = ?', [date]);
      const s = await query('SELECT COALESCE(SUM(quantity), 0) as qty, COALESCE(SUM(total_sale), 0) as revenue FROM milk_sales WHERE date = ?', [date]);
      const exp = await query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?', [date]);

      const pQty = parseFloat(p.rows[0].qty) || 0;
      const pCost = parseFloat(p.rows[0].cost) || 0;
      const sQty = parseFloat(s.rows[0].qty) || 0;
      const sRev = parseFloat(s.rows[0].revenue) || 0;
      const expTotal = parseFloat(exp.rows[0].total) || 0;

      const avgPurchaseRate = pQty > 0 ? (pCost / pQty) : 0;
      const avgSellingRate = sQty > 0 ? (sRev / sQty) : 0;
      const cogs = sQty * metrics.weightedAvgCost;
      const grossProfit = sRev - cogs;
      const netProfit = grossProfit - expTotal;
      const remaining = pQty - sQty;

      return {
        date: typeof date === 'string' ? date.substring(0, 10) : new Date(date).toISOString().substring(0, 10),
        purchasedQty: pQty,
        purchaseCost: pCost,
        soldQty: sQty,
        salesRevenue: sRev,
        remaining,
        avgPurchaseRate,
        avgSellingRate,
        cogs: Math.round(cogs),
        grossProfit: Math.round(grossProfit),
        expenses: expTotal,
        netProfit: Math.round(netProfit),
        grossMargin: sRev > 0 ? ((grossProfit / sRev) * 100).toFixed(1) : '0.0'
      };
    }));

    res.json({ dailyData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// ---------------- REPORTS API ----------------
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

    const metrics = await getInventoryMetrics();

    const priorP = await query('SELECT COALESCE(SUM(quantity), 0) as qty FROM milk_purchases WHERE date < ?', [start]);
    const priorS = await query('SELECT COALESCE(SUM(quantity), 0) as qty FROM milk_sales WHERE date < ?', [start]);
    const openingStock = Math.max(0, (parseFloat(priorP.rows[0].qty) || 0) - (parseFloat(priorS.rows[0].qty) || 0));

    const periodP = await query('SELECT COALESCE(SUM(quantity), 0) as total_qty, COALESCE(SUM(total_cost), 0) as total_cost, COUNT(*) as total_orders FROM milk_purchases WHERE date >= ? AND date <= ?', [start, end]);
    const periodS = await query('SELECT COALESCE(SUM(quantity), 0) as total_qty, COALESCE(SUM(total_sale), 0) as total_revenue, COUNT(*) as total_orders FROM milk_sales WHERE date >= ? AND date <= ?', [start, end]);
    const periodE = await query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date <= ?', [start, end]);
    const expBreakdownRes = await query('SELECT category, SUM(amount) as amount, COUNT(*) as count FROM expenses WHERE date >= ? AND date <= ? GROUP BY category ORDER BY amount DESC', [start, end]);

    const purchased = parseFloat(periodP.rows[0].total_qty) || 0;
    const purchaseCost = parseFloat(periodP.rows[0].total_cost) || 0;
    const sold = parseFloat(periodS.rows[0].total_qty) || 0;
    const salesRevenue = parseFloat(periodS.rows[0].total_revenue) || 0;
    const totalExpenses = parseFloat(periodE.rows[0].total) || 0;
    const closingStock = Math.max(0, openingStock + purchased - sold);

    const avgPurchaseRate = purchased > 0 ? (purchaseCost / purchased) : 0;
    const avgSellingRate = sold > 0 ? (salesRevenue / sold) : 0;

    const cogs = sold * metrics.weightedAvgCost;
    const grossProfit = salesRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const grossMargin = salesRevenue > 0 ? ((grossProfit / salesRevenue) * 100) : 0;
    const profitPerLiter = sold > 0 ? (grossProfit / sold) : 0;

    const periodDaysRes = await query(`
      WITH all_dates AS (
        SELECT DISTINCT date FROM milk_purchases WHERE date >= ? AND date <= ?
        UNION
        SELECT DISTINCT date FROM milk_sales WHERE date >= ? AND date <= ?
      )
      SELECT date FROM all_dates ORDER BY date ASC
    `, [start, end, start, end]);

    const breakdown = await Promise.all(periodDaysRes.rows.map(async ({ date }) => {
      const p = await query('SELECT COALESCE(SUM(quantity), 0) as qty, COALESCE(SUM(total_cost), 0) as cost FROM milk_purchases WHERE date = ?', [date]);
      const s = await query('SELECT COALESCE(SUM(quantity), 0) as qty, COALESCE(SUM(total_sale), 0) as rev FROM milk_sales WHERE date = ?', [date]);
      const e = await query('SELECT COALESCE(SUM(amount), 0) as exp FROM expenses WHERE date = ?', [date]);

      const dayPQty = parseFloat(p.rows[0].qty) || 0;
      const dayPCost = parseFloat(p.rows[0].cost) || 0;
      const daySQty = parseFloat(s.rows[0].qty) || 0;
      const daySRev = parseFloat(s.rows[0].rev) || 0;
      const dayExp = parseFloat(e.rows[0].exp) || 0;
      const dayCogs = daySQty * metrics.weightedAvgCost;
      const dayGrossProfit = daySRev - dayCogs;

      return {
        date: typeof date === 'string' ? date.substring(0, 10) : new Date(date).toISOString().substring(0, 10),
        purchasedQty: dayPQty,
        purchaseCost: dayPCost,
        soldQty: daySQty,
        salesRevenue: daySRev,
        cogs: Math.round(dayCogs),
        grossProfit: Math.round(dayGrossProfit),
        expenses: dayExp,
        netProfit: Math.round(dayGrossProfit - dayExp),
      };
    }));

    res.json({
      period: { type, startDate: start, endDate: end },
      stock: { openingStock, purchased, sold, closingStock },
      purchaseSummary: { totalQty: purchased, totalCost: purchaseCost, avgRate: avgPurchaseRate, orderCount: parseInt(periodP.rows[0].total_orders, 10) || 0 },
      salesSummary: { totalQty: sold, totalRevenue: salesRevenue, avgRate: avgSellingRate, orderCount: parseInt(periodS.rows[0].total_orders, 10) || 0 },
      profitSummary: { cogs: Math.round(cogs), grossProfit: Math.round(grossProfit), grossMargin: parseFloat(grossMargin.toFixed(2)), profitPerLiter: parseFloat(profitPerLiter.toFixed(2)), expenses: totalExpenses, netProfit: Math.round(netProfit) },
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
      sql += ' AND (name ILIKE ? OR notes ILIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY date DESC, id DESC';
    const result = await query(sql, params);

    const expenses = result.rows.map(e => ({
      ...e,
      date: String(e.date).substring(0, 10),
      amount: parseFloat(e.amount)
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

// ---------------- CUSTOMERS API ----------------
app.get('/api/customers', async (req, res) => {
  try {
    const custRes = await query('SELECT * FROM customers ORDER BY name ASC');
    const customers = await Promise.all(custRes.rows.map(async (c) => {
      const stats = await query(`
        SELECT 
          COALESCE(SUM(quantity), 0) as total_qty,
          COALESCE(SUM(total_sale), 0) as total_spent,
          COUNT(*) as order_count,
          COALESCE(SUM(CASE WHEN payment_status = 'Due' THEN total_sale ELSE 0 END), 0) as total_due
        FROM milk_sales WHERE customer_id = ? OR customer_name = ?
      `, [c.id, c.name]);

      return {
        ...c,
        total_qty: parseFloat(stats.rows[0].total_qty) || 0,
        total_spent: parseFloat(stats.rows[0].total_spent) || 0,
        total_due: parseFloat(stats.rows[0].total_due) || 0,
        order_count: parseInt(stats.rows[0].order_count, 10) || 0
      };
    }));

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
      date: String(s.date).substring(0, 10),
      quantity: parseFloat(s.quantity),
      selling_rate: parseFloat(s.selling_rate),
      total_sale: parseFloat(s.total_sale)
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

// ---------------- SUPPLIERS API ----------------
app.get('/api/suppliers', async (req, res) => {
  try {
    const supRes = await query('SELECT * FROM suppliers ORDER BY name ASC');
    const suppliers = await Promise.all(supRes.rows.map(async (s) => {
      const stats = await query(`
        SELECT 
          COALESCE(SUM(quantity), 0) as total_qty,
          COALESCE(SUM(total_cost), 0) as total_paid,
          COUNT(*) as purchase_count
        FROM milk_purchases WHERE supplier_id = ? OR supplier_name = ?
      `, [s.id, s.name]);

      return {
        ...s,
        total_qty: parseFloat(stats.rows[0].total_qty) || 0,
        total_paid: parseFloat(stats.rows[0].total_paid) || 0,
        purchase_count: parseInt(stats.rows[0].purchase_count, 10) || 0
      };
    }));

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
      date: String(p.date).substring(0, 10),
      quantity: parseFloat(p.quantity),
      purchase_rate: parseFloat(p.purchase_rate),
      total_cost: parseFloat(p.total_cost)
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
