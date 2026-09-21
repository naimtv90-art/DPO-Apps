import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = Boolean(process.env.DATABASE_URL);
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  const connectionString = process.env.DATABASE_URL;
  const isLocalPg = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  
  pg.types.setTypeParser(1082, (val) => val); // Returns DATE as 'YYYY-MM-DD' string
  pgPool = new pg.Pool({
    connectionString,
    ssl: isLocalPg ? false : { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pgPool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });

  console.log('🐘 Connected to Online PostgreSQL Database Pool');
} else {
  try {
    const dbPath = process.env.VERCEL 
      ? path.join('/tmp', 'dpo_milk.sqlite') 
      : path.join(__dirname, 'dpo_milk.sqlite');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    console.log('🗄️ Running on Local SQLite Database engine at', dbPath);
  } catch (sqliteErr) {
    console.warn('⚠️ SQLite init warning:', sqliteErr.message);
  }
}

// Unified Database Query Adapter
export async function query(sql, params = []) {
  if (isPostgres) {
    // Transform ? placeholders to $1, $2, ... for PostgreSQL
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pgPool.query(pgSql, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount,
      insertId: res.rows[0]?.id || null
    };
  } else {
    const isSelect = /^\s*(SELECT|PRAGMA|WITH)/i.test(sql);
    if (isSelect) {
      const stmt = sqliteDb.prepare(sql);
      const rows = stmt.all(...params);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return {
        rows: [],
        rowCount: info.changes,
        insertId: info.lastInsertRowid
      };
    }
  }
}

// Transaction execution wrapper
export async function executeTransaction(callback) {
  if (isPostgres) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const customQuery = async (sql, params = []) => {
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await client.query(pgSql, params);
        return { rows: res.rows, rowCount: res.rowCount, insertId: res.rows[0]?.id };
      };
      const result = await callback(customQuery);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    // SQLite transaction
    const runInTransaction = sqliteDb.transaction(() => {
      return callback(query);
    });
    return runInTransaction();
  }
}

// Initialize Database Schema & Seed Data
export async function initDatabase() {
  if (isPostgres) {
    const postgresSchema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        customer_type VARCHAR(50) DEFAULT 'Regular Customer',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS milk_purchases (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        supplier_name VARCHAR(255) NOT NULL,
        quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
        unit VARCHAR(20) DEFAULT 'Liter',
        purchase_rate NUMERIC(12, 2) NOT NULL CHECK (purchase_rate > 0),
        total_cost NUMERIC(12, 2) NOT NULL,
        supplier_phone VARCHAR(50),
        supplier_address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS milk_sales (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(255) NOT NULL,
        quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
        unit VARCHAR(20) DEFAULT 'Liter',
        selling_rate NUMERIC(12, 2) NOT NULL CHECK (selling_rate > 0),
        total_sale NUMERIC(12, 2) NOT NULL,
        customer_phone VARCHAR(50),
        customer_address TEXT,
        payment_status VARCHAR(50) DEFAULT 'Paid',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS milk_rates (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        purchase_rate NUMERIC(12, 2) NOT NULL CHECK (purchase_rate > 0),
        selling_rate NUMERIC(12, 2) NOT NULL CHECK (selling_rate > 0),
        unit VARCHAR(20) DEFAULT 'Liter',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        type VARCHAR(50) NOT NULL,
        quantity NUMERIC(12, 2) NOT NULL,
        unit VARCHAR(20) DEFAULT 'Liter',
        party_name VARCHAR(255),
        reference_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(100) DEFAULT 'Partner / Shareholder',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS partner_investments (
        id SERIAL PRIMARY KEY,
        partner_name VARCHAR(255) NOT NULL,
        partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        date DATE NOT NULL,
        investment_type VARCHAR(100) DEFAULT 'Capital Investment',
        payment_method VARCHAR(100) DEFAULT 'Bank Transfer',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_waste (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        product_name VARCHAR(255) DEFAULT 'Raw Milk',
        quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
        unit VARCHAR(20) DEFAULT 'Liter',
        reason VARCHAR(100) NOT NULL,
        estimated_loss NUMERIC(12, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_purchases_date ON milk_purchases(date DESC);
      CREATE INDEX IF NOT EXISTS idx_sales_date ON milk_sales(date DESC);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
      CREATE INDEX IF NOT EXISTS idx_rates_date ON milk_rates(date DESC);
      CREATE INDEX IF NOT EXISTS idx_investments_date ON partner_investments(date DESC);
      CREATE INDEX IF NOT EXISTS idx_waste_date ON product_waste(date DESC);
    `;
    await pgPool.query(postgresSchema);
  } else {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        customer_type TEXT DEFAULT 'Regular Customer',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS milk_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        supplier_id INTEGER,
        supplier_name TEXT,
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'Liter',
        purchase_rate REAL NOT NULL,
        total_cost REAL NOT NULL,
        supplier_phone TEXT,
        supplier_address TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      );

      CREATE TABLE IF NOT EXISTS milk_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        customer_id INTEGER,
        customer_name TEXT,
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'Liter',
        selling_rate REAL NOT NULL,
        total_sale REAL NOT NULL,
        customer_phone TEXT,
        customer_address TEXT,
        payment_status TEXT DEFAULT 'Paid',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS milk_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        purchase_rate REAL NOT NULL,
        selling_rate REAL NOT NULL,
        unit TEXT DEFAULT 'Liter',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'Partner / Shareholder',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS partner_investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partner_name TEXT NOT NULL,
        partner_id INTEGER,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        investment_type TEXT DEFAULT 'Capital Investment',
        payment_method TEXT DEFAULT 'Bank Transfer',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES partners(id)
      );

      CREATE TABLE IF NOT EXISTS product_waste (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        product_name TEXT DEFAULT 'Raw Milk',
        quantity REAL NOT NULL,
        unit TEXT DEFAULT 'Liter',
        reason TEXT NOT NULL,
        estimated_loss REAL NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_purchases_date ON milk_purchases(date DESC);
      CREATE INDEX IF NOT EXISTS idx_sales_date ON milk_sales(date DESC);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
      CREATE INDEX IF NOT EXISTS idx_rates_date ON milk_rates(date DESC);
      CREATE INDEX IF NOT EXISTS idx_investments_date ON partner_investments(date DESC);
      CREATE INDEX IF NOT EXISTS idx_waste_date ON product_waste(date DESC);
    `);
  }

  // Seed default admin user
  const userCheck = await query('SELECT COUNT(*) as count FROM users');
  const count = parseInt(userCheck.rows[0].count, 10);
  if (count === 0) {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await query(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      ['demo', hashedPassword, 'DairyPureOrganic Admin', 'admin']
    );
  }

  // Seed / Sync 4 Business Partners
  const requiredPartners = [
    { name: 'Md Naim Khan', role: 'Managing Partner (২৫%)' },
    { name: 'Saiful Islam Sohag', role: 'Partner / Shareholder (২৫%)' },
    { name: 'Monirul Islam', role: 'Partner / Shareholder (২৫%)' },
    { name: 'Maruf Sikder', role: 'Partner / Shareholder (২৫%)' }
  ];

  const partnerCheck = await query('SELECT * FROM partners ORDER BY id ASC');
  if (partnerCheck.rows.length === 0) {
    for (const p of requiredPartners) {
      await query('INSERT INTO partners (name, phone, role) VALUES (?, ?, ?)', [p.name, '', p.role]);
    }
  } else {
    // Update existing partner rows if they had placeholder names
    for (let i = 0; i < requiredPartners.length; i++) {
      if (partnerCheck.rows[i]) {
        await query('UPDATE partners SET name = ?, role = ? WHERE id = ?', [requiredPartners[i].name, requiredPartners[i].role, partnerCheck.rows[i].id]);
      } else {
        await query('INSERT INTO partners (name, phone, role) VALUES (?, ?, ?)', [requiredPartners[i].name, '', requiredPartners[i].role]);
      }
    }
  }

  // Seed default company settings
  const defaultSettings = [
    ['company_name', 'DairyPureOrganic'],
    ['business_name', 'Dairy Pure & Organic'],
    ['app_name', 'DairyPureOrganic Milk Manager'],
    ['owner_name', 'Md. Imran Hossain'],
    ['phone', '+880 1712-281861'],
    ['whatsapp', '+880 1775-002340'],
    ['address', 'House 18, Road 4, Block C, Mirpur 12, Dhaka-1216'],
    ['default_unit', 'Liter'],
    ['default_purchase_rate', '60'],
    ['default_selling_rate', '85'],
    ['currency', '৳'],
    ['currency_code', 'BDT'],
    ['theme', 'light']
  ];

  for (const [k, v] of defaultSettings) {
    if (isPostgres) {
      await query('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING', [k, v]);
    } else {
      await query('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [k, v]);
    }
  }

  // Ensure default base rate exists if empty
  const rateCheck = await query('SELECT COUNT(*) as count FROM milk_rates');
  if (parseInt(rateCheck.rows[0].count, 10) === 0) {
    await query(
      'INSERT INTO milk_rates (date, purchase_rate, selling_rate, unit, notes) VALUES (?, ?, ?, ?, ?)',
      [new Date().toISOString().substring(0, 10), 60.0, 85.0, 'Liter', 'Base standard rates']
    );
  }
}

export default { query, executeTransaction, initDatabase };

