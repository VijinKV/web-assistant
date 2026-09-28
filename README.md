# Web Assistant 🤖📱

**Web Assistant** is a modern, mobile-friendly web application built with **Next.js 14**, **Tailwind CSS**, and **Supabase (PostgreSQL)**, optimized for seamless deployment to **Vercel** via **GitHub**.

Inside Web Assistant is the **Balance Tracker** application — an intuitive daily reconciliation tool that simplifies tracking where your money goes.

---

## 🪙 Balance Tracker Workflow

1. **Log Opening Balance (e.g. Sunday)**:
   - Enter your account/wallet balance (e.g. `$500.00`).
2. **Log Closing Balance (e.g. Monday)**:
   - Enter the next day's balance (e.g. `$420.00`).
   - The app automatically calculates the difference: `$500.00 - $420.00 = $80.00 spent`.
3. **Add Known Expenses**:
   - Add itemized expenses to reduce the difference:
     - 🍔 Lunch (Food): `$25.00`
     - 🚕 Cab (Transport): `$15.00`
     - Total Accounted: `$40.00`
     - Remaining Difference: `$40.00`
4. **Settle Remaining Difference**:
   - When you can't recall further details or are ready to close the day, tap **Settle**.
   - The remaining `$40.00` is **automatically booked into the "Others"** category.
   - Day is marked as **Settled** and balanced to `$0.00`!

---

## 🗄️ Database: Is Supabase Free?

**Yes! Supabase is 100% free to start** with no credit card required:
- **50,000 monthly active users** for Authentication (Email/Password, Google OAuth).
- **500 MB PostgreSQL database** (sufficient for millions of balance and expense records).
- **Row-Level Security (RLS)** to protect user data so each person only sees their own finances.
- **Unlimited API requests**.

> **Note:** Web Assistant also includes a zero-friction **Local Mode**. If you don't configure Supabase immediately, the app works seamlessly right in your browser using local storage, and syncs as soon as Supabase environment variables are provided.

---

## 🚀 Setup & Deployment

### 1. Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser (or mobile device on the same Wi-Fi).

### 2. Setup Free Supabase Database
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy and run the SQL code from [`supabase/schema.sql`](supabase/schema.sql).
4. Copy your **Project URL** and **Anon API Key** from Project Settings > API.

### 3. Deploy to Vercel via GitHub
1. Initialize git and push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Web Assistant with Balance Tracker"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-anon-public-key`
5. Click **Deploy**!
