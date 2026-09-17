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
    const schemaFile = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaFile)) {
      const schemaSql = fs.readFileSync(schemaFile, 'utf8');
      await pgPool.query(schemaSql);
    }
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

