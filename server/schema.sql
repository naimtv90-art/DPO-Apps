-- ==============================================================================
-- DairyPureOrganic Milk Manager - Production PostgreSQL Database Schema
-- Compatible with Neon, Supabase, Render PostgreSQL, Railway, AWS RDS
-- ==============================================================================

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
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  due_amount NUMERIC(12, 2) DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) DEFAULT 'KG',
  default_price NUMERIC(12, 2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_sales (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) DEFAULT 'KG',
  selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
  total_amount NUMERIC(12, 2) NOT NULL,
  customer_name VARCHAR(255) DEFAULT 'Cash Customer',
  customer_phone VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'Paid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_purchases (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) DEFAULT 'KG',
  purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
  total_amount NUMERIC(12, 2) NOT NULL,
  supplier_name VARCHAR(255) DEFAULT 'General Supplier',
  supplier_phone VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'Paid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_purchases_date ON milk_purchases(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON milk_sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_rates_date ON milk_rates(date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON milk_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON milk_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_investments_date ON partner_investments(date DESC);
CREATE INDEX IF NOT EXISTS idx_investments_partner ON partner_investments(partner_name);
CREATE INDEX IF NOT EXISTS idx_waste_date ON product_waste(date DESC);
CREATE INDEX IF NOT EXISTS idx_product_sales_date ON product_sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_product_purchases_date ON product_purchases(date DESC);

