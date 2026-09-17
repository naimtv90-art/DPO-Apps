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
  const dbPath = path.join(__dirname, 'dpo_milk.sqlite');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  console.log('🗄️ Running on Local SQLite Database engine');
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

  // Check if purchases table needs initial seeding
  const pCheck = await query('SELECT COUNT(*) as count FROM milk_purchases');
  if (parseInt(pCheck.rows[0].count, 10) === 0) {
    await seedInitialData();
  }
}

async function seedInitialData() {
  // Insert suppliers
  await query('INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)', ['Kadir Dairy Farm', '01711223344', 'Savar, Dhaka', 'Primary wholesale cow milk supplier']);
  await query('INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)', ['Rahim Molla Dairy', '01822334455', 'Singair, Manikganj', 'Direct farm pure morning milk']);
  await query('INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)', ['Haji Organic Dairy', '01933445566', 'Gazipur Sadar', 'Grass-fed cow milk']);
  await query('INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)', ['Bogra Local Cooperative', '01644556677', 'Bogra', 'High fat evening delivery']);

  // Insert customers
  await query('INSERT INTO customers (name, phone, address, customer_type, notes) VALUES (?, ?, ?, ?, ?)', ['Mirpur DOHS Club', '01710998877', 'House 45, Road 2, Mirpur DOHS', 'Wholesale', 'Daily morning 25L delivery']);
  await query('INSERT INTO customers (name, phone, address, customer_type, notes) VALUES (?, ?, ?, ?, ?)', ['Pallabi Sweet Meat & Cafe', '01812345678', 'Plot 12, Main Road, Pallabi', 'Restaurant', 'Commercial daily supply']);
  await query('INSERT INTO customers (name, phone, address, customer_type, notes) VALUES (?, ?, ?, ?, ?)', ['Rafiqul Islam (Gold Member)', '01923456789', 'Avenue 5, Block B, Mirpur 12', 'Regular Customer', 'DPO Lifetime Member card #042']);
  await query('INSERT INTO customers (name, phone, address, customer_type, notes) VALUES (?, ?, ?, ?, ?)', ['Nazmul Hasan', '01634567890', 'House 14, Road 8, Rupnagar R/A', 'Retail', 'Weekly family purchase']);
  await query('INSERT INTO customers (name, phone, address, customer_type, notes) VALUES (?, ?, ?, ?, ?)', ['Eastern Housing Resident Forum', '01745678901', 'Eastern Housing Phase 2, Pallabi', 'Regular Customer', 'Morning bulk delivery']);

  // Insert rates
  await query('INSERT INTO milk_rates (date, purchase_rate, selling_rate, unit, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-01', 60.0, 85.0, 'Liter', 'September standard base rates']);
  await query('INSERT INTO milk_rates (date, purchase_rate, selling_rate, unit, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-08', 61.0, 85.0, 'Liter', 'Adjusted purchase rate for fuel transport']);
  await query('INSERT INTO milk_rates (date, purchase_rate, selling_rate, unit, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-14', 62.0, 88.0, 'Liter', 'Current market rate update']);

  // Sample transactions
  const sampleDays = [
    { date: '2026-09-01', pQty: 120, pRate: 60, sQty: 100, sRate: 85, sup: 'Kadir Dairy Farm', supPh: '01711223344', cust: 'Mirpur DOHS Club', custPh: '01710998877' },
    { date: '2026-09-02', pQty: 110, pRate: 60, sQty: 95, sRate: 85, sup: 'Rahim Molla Dairy', supPh: '01822334455', cust: 'Pallabi Sweet Meat & Cafe', custPh: '01812345678' },
    { date: '2026-09-03', pQty: 130, pRate: 60, sQty: 110, sRate: 85, sup: 'Kadir Dairy Farm', supPh: '01711223344', cust: 'Rafiqul Islam (Gold Member)', custPh: '01923456789' },
    { date: '2026-09-04', pQty: 125, pRate: 60, sQty: 105, sRate: 85, sup: 'Haji Organic Dairy', supPh: '01933445566', cust: 'Mirpur DOHS Club', custPh: '01710998877' },
    { date: '2026-09-05', pQty: 140, pRate: 60, sQty: 120, sRate: 85, sup: 'Kadir Dairy Farm', supPh: '01711223344', cust: 'Nazmul Hasan', custPh: '01634567890' },
    { date: '2026-09-06', pQty: 115, pRate: 60, sQty: 90, sRate: 85, sup: 'Rahim Molla Dairy', supPh: '01822334455', cust: 'Eastern Housing Resident Forum', custPh: '01745678901' },
    { date: '2026-09-07', pQty: 135, pRate: 60, sQty: 115, sRate: 85, sup: 'Bogra Local Cooperative', supPh: '01644556677', cust: 'Pallabi Sweet Meat & Cafe', custPh: '01812345678' },
    { date: '2026-09-08', pQty: 120, pRate: 61, sQty: 100, sRate: 85, sup: 'Kadir Dairy Farm', supPh: '01711223344', cust: 'Mirpur DOHS Club', custPh: '01710998877' },
    { date: '2026-09-09', pQty: 125, pRate: 61, sQty: 105, sRate: 85, sup: 'Rahim Molla Dairy', supPh: '01822334455', cust: 'Rafiqul Islam (Gold Member)', custPh: '01923456789' },
    { date: '2026-09-10', pQty: 130, pRate: 61, sQty: 110, sRate: 85, sup: 'Haji Organic Dairy', supPh: '01933445566', cust: 'Eastern Housing Resident Forum', custPh: '01745678901' },
    { date: '2026-09-11', pQty: 140, pRate: 61, sQty: 125, sRate: 85, sup: 'Kadir Dairy Farm', supPh: '01711223344', cust: 'Pallabi Sweet Meat & Cafe', custPh: '01812345678' },
    { date: '2026-09-12', pQty: 110, pRate: 61, sQty: 95, sRate: 85, sup: 'Rahim Molla Dairy', supPh: '01822334455', cust: 'Nazmul Hasan', custPh: '01634567890' },
    { date: '2026-09-13', pQty: 125, pRate: 61, sQty: 100, sRate: 85, sup: 'Bogra Local Cooperative', supPh: '01644556677', cust: 'Mirpur DOHS Club', custPh: '01710998877' },
    { date: '2026-09-14', pQty: 135, pRate: 62, sQty: 110, sRate: 88, sup: 'Kadir Dairy Farm', supPh: '01711223344', cust: 'Rafiqul Islam (Gold Member)', custPh: '01923456789' },
    { date: '2026-09-15', pQty: 130, pRate: 62, sQty: 105, sRate: 88, sup: 'Haji Organic Dairy', supPh: '01933445566', cust: 'Eastern Housing Resident Forum', custPh: '01745678901' },
    { date: '2026-09-16', pQty: 145, pRate: 62, sQty: 120, sRate: 88, sup: 'Rahim Molla Dairy', supPh: '01822334455', cust: 'Pallabi Sweet Meat & Cafe', custPh: '01812345678' },
    { date: '2026-09-17', pQty: 125, pRate: 62, sQty: 100, sRate: 88, sup: 'Kadir Dairy Farm', supPh: '01711223344', cust: 'Mirpur DOHS Club', custPh: '01710998877' }
  ];

  for (const day of sampleDays) {
    await query(`
      INSERT INTO milk_purchases (date, supplier_name, quantity, unit, purchase_rate, total_cost, supplier_phone, supplier_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [day.date, day.sup, day.pQty, 'Liter', day.pRate, day.pQty * day.pRate, day.supPh, 'Farm Collection Point', 'Fresh morning milking batch']);

    await query(`
      INSERT INTO milk_sales (date, customer_name, quantity, unit, selling_rate, total_sale, customer_phone, customer_address, payment_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [day.date, day.cust, day.sQty, 'Liter', day.sRate, day.sQty * day.sRate, day.custPh, 'Home delivery direct', 'Paid', 'Delivered in sanitized chilled milk cans']);
  }

  // Insert expenses
  await query('INSERT INTO expenses (date, name, category, amount, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-02', 'Delivery Van Fuel', 'Transport', 850, 'Mirpur & Pallabi morning delivery route']);
  await query('INSERT INTO expenses (date, name, category, amount, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-05', 'Chilling Unit Electricity', 'Electricity', 2400, 'Cold room power bill - Sept 1st week']);
  await query('INSERT INTO expenses (date, name, category, amount, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-07', 'Sanitary Food-Grade Milk Pouches', 'Packaging', 1200, '500ml & 1L pouch rolls']);
  await query('INSERT INTO expenses (date, name, category, amount, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-10', 'Milk Delivery Staff Salary Part', 'Employee', 4500, 'Bi-weekly advance payout']);
  await query('INSERT INTO expenses (date, name, category, amount, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-12', 'Shop & Hub Rental Advance', 'Shop Rent', 6000, 'Mirpur 12 distribution hub']);
  await query('INSERT INTO expenses (date, name, category, amount, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-14', 'Lactometer & Chiller Calibration', 'Maintenance', 750, 'Quality checking tool calibration']);
  await query('INSERT INTO expenses (date, name, category, amount, notes) VALUES (?, ?, ?, ?, ?)', ['2026-09-17', 'Daily Transport & Ice Bags', 'Transport', 500, 'Insulated boxes ice replenishment']);
}

export default { query, executeTransaction, initDatabase };
