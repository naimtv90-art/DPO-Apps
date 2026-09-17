# 🥛 DairyPureOrganic Milk Manager (`DPO Milk Manager`)
### Production-Ready Milk Purchase, Sales, Inventory & Profit Management System

> **Brand**: Dairy Pure & Organic (DairyPureOrganic)  
> **Platform**: Mobile-First PWA (Progressive Web App) + Responsive Desktop Web  
> **Database**: PostgreSQL (Cloud Online Database: Neon / Supabase / Render / Railway)  
> **Backend**: Node.js & Express REST API with JWT Security  
> **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts & Lucide Icons  

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnaimtv90-art%2FDPO-Apps&project-name=dairypureorganic-milk-manager&repository-name=dpo-milk-manager)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/naimtv90-art/DPO-Apps)

---

## 📱 Default Demo Credentials
- **Username:** `demo`
- **Password:** `demo123`
*(Pre-seeded with realistic milk purchases, sales, suppliers, customers, and expense entries).*

---

## 🌟 Key Features

1. **Mobile-First & PWA Enabled:**
   - Installable on Android phones directly via Chrome (**"Add to Home Screen"**).
   - Dedicated Mobile Bottom Navigation (`Dashboard`, `Purchase`, `Sale`, `Stock`, `More`).
   - Quick Action Floating Action Button (FAB) for rapid 1-tap milk entries.
   - Works as a standalone native-feeling Android application.

2. **Accurate Financial & Inventory Engine:**
   - **Weighted Average Cost (WAC) COGS Calculation** for exact Gross Profit & Gross Margin.
   - **Inventory Overselling Protection**: Real-time stock validation prevents selling more milk than currently in stock.
   - **Stock Ledger & Movement History**: Automatically logs every purchase and sale with before/after balance.
   - **Historical Rate Integrity**: Rate updates only apply to new transactions, protecting past transaction records.
   - **Customer Due & Credit Tracking**: Tracks Paid, Due, and Partial status with individual ledger history.

3. **Bangladesh Localization:**
   - Currency: **BDT (৳)** formatted throughout.
   - Units: **Liter (L)** (Default) & **KG**.
   - Date Format: `DD/MM/YYYY`.
   - Contact Formats: Standard Bangladesh mobile numbers (`017XXXXXXXX`).

4. **Multi-Device Real-Time Synchronization:**
   - Cloud PostgreSQL architecture ensures that transactions saved from an Android phone in the field immediately reflect on laptops, desktops, and tablets in the office.

5. **Reports & Exports:**
   - Filterable summaries (Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, Custom Range).
   - Instant CSV export and print-ready invoices/reports with company header.

---

## 🚀 Free-Tier Cloud Deployment Guide (Step-by-Step)

Follow this 11-step guide to deploy DairyPureOrganic Milk Manager online for **100% free** and access it from your Android phone anywhere in the world.

```
                    ┌─────────────────────────┐
                    │ Neon / Supabase Cloud   │
                    │  (Online PostgreSQL)    │
                    └────────────▲────────────┘
                                 │ DATABASE_URL
                    ┌────────────┴────────────┐
                    │ Render.com (Free Tier)  │
                    │  (Node.js Express API)  │
                    └────────────▲────────────┘
                                 │ VITE_API_URL / HTTPS
                    ┌────────────┴────────────┐
                    │ Vercel.com (Free Tier)  │
                    │  (React PWA Frontend)   │
                    └────────────▲────────────┘
                                 │ HTTPS Public URL
                    ┌────────────┴────────────┐
                    │ Android Phone Chrome    │
                    │  ("Add to Home Screen") │
                    └─────────────────────────┘
```

---

### Step 1: Create a Free Cloud PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech) (or [Supabase.com](https://supabase.com)) and sign up for a free account.
2. Click **Create Project** and name it `dairypureorganic-db`.
3. Copy your PostgreSQL Connection String (`DATABASE_URL`). It looks like:
   ```env
   postgresql://username:password@ep-cool-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Configure Environment Variables
In your local repository or cloud service dashboard, copy `.env.example` to `.env` and fill in your values:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://username:password@ep-cool-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secure_random_dpo_jwt_secret_key_2026
FRONTEND_URL=https://dairypureorganic-milk-manager.vercel.app
VITE_API_URL=https://dpo-milk-manager-backend.onrender.com/api
```

### Step 3: Run Database Migrations & Initial Seed (Automated)
When the backend starts and detects a PostgreSQL connection, it automatically runs `server/schema.sql` to build the required tables, foreign keys, indexes, and seed initial demo accounts/rates.

To manually inspect or execute the DDL:
```bash
# Connect with psql (optional):
psql "YOUR_POSTGRES_CONNECTION_STRING" -f server/schema.sql
```

### Step 4: Deploy Backend to Render (Free Tier)
1. Push your project code to a GitHub repository (e.g. `https://github.com/your-username/dpo-milk-manager`).
2. Log in to [Render.com](https://render.com) and click **New + → Web Service**.
3. Select your GitHub repository.
4. Configure the settings:
   - **Name:** `dpo-milk-manager-backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Plan:** `Free`
5. In the **Environment Variables** section, add:
   - `DATABASE_URL` = *(Your Neon/Supabase PostgreSQL connection string from Step 1)*
   - `JWT_SECRET` = *(Your random secret string)*
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://dairypureorganic-milk-manager.vercel.app` (or `*` temporarily)
6. Click **Create Web Service**. Once deployed, Render will provide a public HTTPS URL (e.g., `https://dpo-milk-manager-backend.onrender.com`).

### Step 5: Deploy Frontend to Vercel (Free Tier)
1. Log in to [Vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repository.
3. In **Build and Output Settings**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://dpo-milk-manager-backend.onrender.com/api`
5. Click **Deploy**. Vercel will build and assign you an HTTPS URL (e.g., `https://dairypureorganic-milk-manager.vercel.app`).

### Step 6: Configure CORS on Backend
Go back to Render → your Web Service → **Environment Variables**, and ensure:
`FRONTEND_URL` = `https://dairypureorganic-milk-manager.vercel.app`
*(Save and restart the backend service).*

### Step 7: Verify Multi-Device Online Access
1. Open `https://dairypureorganic-milk-manager.vercel.app` on your computer.
2. Log in with `demo` / `demo123`.
3. Add a Milk Purchase (e.g. 50 Liters).
4. Open the same URL on your phone or tablet. Log in: the 50 Liters entry will be immediately visible from the cloud PostgreSQL database.

### Step 8: Install PWA on Android Phone (Add to Home Screen)
1. Open Google Chrome on your Android device.
2. Navigate to your live HTTPS URL: `https://dairypureorganic-milk-manager.vercel.app`.
3. Tap the Chrome menu (**⋮** three dots in the top right corner).
4. Tap **"Install app"** or **"Add to Home Screen"**.
5. The **DairyPureOrganic Milk Manager** icon will appear on your phone's home screen alongside your native apps.
6. Launch it to experience a full-screen, fast, app-like interface.

---

## 💻 Local Development Workflow

To run the application locally on your computer:

```bash
# 1. Install dependencies
npm install

# 2. Start the local full-stack development environment (Frontend + Backend)
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Local Fallback DB:** SQLite auto-created at `server/milk_manager.db` if `DATABASE_URL` is unset.
- **Production DB:** Connects to PostgreSQL whenever `DATABASE_URL` is set in `.env`.

---

## 📁 Repository Structure

```
├── public/
│   ├── icon-192.png        # PWA Android App Icon (192x192)
│   ├── icon-512.png        # PWA Android App Icon (512x512)
│   ├── logo.png            # Official DairyPureOrganic Branding
│   ├── manifest.json       # PWA Web App Manifest
│   └── sw.js               # Service Worker for PWA Caching
├── server/
│   ├── db.js               # Dual Database Adapter (PostgreSQL pg-pool + SQLite fallback)
│   ├── index.js            # Express REST API & JWT Authentication Routes
│   └── schema.sql          # PostgreSQL DDL with Indexes and Constraints
├── src/
│   ├── components/         # Reusable UI, Modals, Navbar, Sidebar, BottomNav, FAB
│   ├── context/            # React AppContext, State, Auth & Notification System
│   ├── services/           # Axios API Client & Endpoints
│   ├── types/              # TypeScript Interface Definitions
│   ├── views/              # Dashboard, Purchase, Sales, Stock, Rates, Reports, Expenses, etc.
│   ├── App.tsx             # Root Application Container
│   └── main.tsx            # Entry Point with ServiceWorker Registration
├── .env.example            # Environment variables template
├── render.yaml             # Render cloud backend definition
├── vercel.json             # Vercel SPA routing & cache configuration
└── package.json            # Project scripts and dependencies
```

---

© 2026 DairyPureOrganic. All rights reserved.
