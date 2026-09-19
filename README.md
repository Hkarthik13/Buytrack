# BuyTrack 🧾

> **“Buy it once. Never lose track of it.”**

**BuyTrack** is a personal purchase intelligence platform. Upload or photograph your purchase receipts, and BuyTrack will extract product details, warranty coverage, and EMI repayment plans into an unified, mobile-first responsive dashboard.

---

## 🌟 Key Features

1. **True Mobile-First Responsive Design**:
   - **Mobile**: Touch-optimized bottom navigation, camera scan action, responsive data cards with zero horizontal scrolling.
   - **Desktop**: Full sidebar navigation, deep data tables, interactive Recharts analytics, and multi-tab detail inspectors.

2. **OCR + AI Receipt Extraction**:
   - Camera photograph or file upload (JPG, PNG, WEBP, PDF).
   - Animated laser scanner with progressive status stages.
   - Structured field extraction (Product, Brand, Store, Date, Price, Discount, Tax, Warranty duration, EMI parameters).
   - **Review Receipt Confirmation Screen**: Allows editing extracted fields before saving with live calculations.

3. **Deterministic Financial EMI Management**:
   - Accurate mathematical formulas for No-Cost EMI and Standard reducing-balance bank interest amortization (AI is never trusted for financial math).
   - Visual progress bars, total loan vs remaining balance tracking.
   - Interactive installment schedule table (Mark installments as Paid, Pending, or Overdue).
   - Standalone interactive EMI Calculator.

4. **Warranty Hub & Countdown Alerts**:
   - Precision day countdowns and categorization (Active, Expiring Soon, Expired).
   - Urgency color-coding (🔴 within 7 days, 🟠 within 30 days, 🟢 active).
   - Configurable reminder preferences (30 days, 7 days, 1 day before).

5. **“Ask My Purchases” Grounded AI Assistant**:
   - Answers queries strictly using the user's isolated data.
   - Supports English, Tamil (தமிழ் - *“என் TV EMI எப்போ முடியும்?”*, *“இந்த மாதம் என்ன EMI payments இருக்கு?”*), Hindi, etc.

6. **Deep Visual Analytics**:
   - Category spend donut charts, monthly purchase spending trend bars, payment method breakdown, and warranty health meters.

7. **Account & Security Isolation**:
   - User-isolated databases (Supabase PostgreSQL with Row Level Security + smart offline demo mode).
   - Dark / Light mode toggle with preference persistence.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS & CSS Variables Design System
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Visuals**: Canvas Confetti
- **Database & Auth**: Supabase PostgreSQL + Auth (with complete RLS policies in `supabase/schema.sql`)
- **AI & OCR**: Google Gemini 1.5/2.0 Flash Vision API + Deterministic NLP fallback engine

---

## 🗄️ Database Schema

The database schema is defined in [`supabase/schema.sql`](file:///e:/Buytrack/supabase/schema.sql) and includes:
- `profiles` (User metadata and preferences)
- `purchases` (Main purchase records)
- `warranties` (Durations, start/end dates, warranty types)
- `emi_plans` (Loan amounts, monthly installments, down payments, interest rates)
- `emi_payments` (Individual installment schedule rows and status)
- `notification_preferences` (Reminder alert thresholds)
- Row Level Security (RLS) policies ensuring complete multi-tenant isolation.

---

## 🚀 Local Setup

### 1. Clone & Install Dependencies
```bash
cd Buytrack
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Optional: If no keys are provided, BuyTrack operates in a pre-seeded, zero-config local storage demo mode immediately).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Production Deployment (Vercel)

1. Push this repository to GitHub / GitLab.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (Optional for live Gemini Vision extraction)
4. Click **Deploy**. Vercel will automatically build the Next.js application.

---

## 📱 Responsive Testing Viewports Tested

- **Mobile Phones**: 320px, 375px, 390px, 430px
- **Tablets**: 768px
- **Laptops / Desktops**: 1024px, 1280px, 1440px, 1920px
