# Complete Setup & Installation Guide: Shyamved Residency

Follow this step-by-step guide to set up the Society Management System on any computer (Windows, macOS, or Linux) and run it successfully from scratch.

---

## 📋 Prerequisites
Ensure you have the following installed on your computer before starting:
1.  **Node.js** (Version 18.x or 20.x recommended)
    *   Download from [https://nodejs.org](https://nodejs.org)
2.  **Git** (For cloning/managing code)
    *   Download from [https://git-scm.com](https://git-scm.com)
3.  **Visual Studio Code** (or any text editor)
    *   Download from [https://code.visualstudio.com](https://code.visualstudio.com)

---

## 🚀 Step 1: Clone or Copy the Project
Open your terminal (PowerShell, Command Prompt, or Terminal) and run:
```bash
# Clone the repository
git clone https://github.com/maulikpanchal1616/Society-Automate-System.git

# Navigate into the project folder
cd Society-Automate-System
```

---

## 📦 Step 2: Install Project Dependencies
Run the following command to download and install all necessary packages (like Next.js, React, Tailwind, and Supabase client libraries):
```bash
npm install
```

---

## 🗄️ Step 3: Set Up the Database (Supabase)

The project uses Supabase as its database. Follow these steps to configure it:

### 3.1 Create a Supabase Project
1.  Go to [https://supabase.com](https://supabase.com) and log in or sign up.
2.  Click **New Project** in your dashboard.
3.  Fill in the project details:
    *   **Name**: `shyamved-residency`
    *   **Database Password**: Create a strong password (save this password!)
    *   **Region**: Select the region closest to you (e.g., `South Asia (Mumbai)` for India)
4.  Click **Create new project** and wait 2 minutes for it to prepare.

### 3.2 Run Schema Migrations
We need to create the tables, triggers, and security rules.
1.  In your Supabase project dashboard, click on **SQL Editor** on the left menu.
2.  Click **New Query**.
3.  Open the files inside the project's `supabase/migrations/` directory using your text editor.
4.  Copy the SQL queries inside each file and run them in the SQL Editor **in order**:
    *   **File 1**: Run `001_initial_schema.sql` (Creates all tables and initial triggers).
    *   **File 2**: Run `002_paid_bill_immutability.sql` (Creates security locks for paid bills).
    *   **File 3**: Run `003_rls_policies.sql` (Configures Row-Level Security permissions).
    *   **File 4**: Run `007_payment_transactions.sql` (Creates the payment processing stored procedure).

### 3.3 Create Seed Users & Data
1.  In the Supabase dashboard, go to **Authentication -> Users** and click **Add User -> Invite User** to create the initial admin logins:
    *   **Chairman Email**: `chairman@shyamved.com`
    *   **Office Manager Email**: `office@shyamved.com`
2.  Once added, copy the **User ID (UUID)** for both accounts from the users list.
3.  Open `supabase/seed.sql` in your text editor:
    *   Go to **STEP 5: Users** and replace the placeholder UUIDs with your actual user UUIDs from the dashboard.
    *   Go to **STEP 6: Chairman history** and replace the chairman UUID placeholder.
4.  Copy the entire content of `supabase/seed.sql`, paste it into a **New Query** in your Supabase SQL Editor, and click **Run**. This populates your database with blocks, houses, base water rates, and sample historical bills.

### 3.4 Storage & Realtime Config
1.  **Storage**: Go to **Storage** in Supabase, click **New Bucket**, name it `receipts`, and set it to **Private** (used for storing receipt PDFs).
2.  **Realtime**: Go to **Database -> Replication** in Supabase. Under tables list, enable replication for `bills`, `payments`, `notices`, and `events` to support instant UI updates.

---

## 💳 Step 4: Configure Razorpay Payments
1.  Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com).
2.  Switch to **Test Mode** (look at the top right toggle).
3.  Go to **Account & Settings -> API Keys** and click **Generate Key**.
4.  Copy the generated **Key ID** and **Key Secret**.

---

## 🔑 Step 5: Configure Environment Variables
1.  In the root directory of the project, create a new file named:
    ```
    .env.local
    ```
2.  Copy the content below and paste it into `.env.local`, filling in your actual Supabase and Razorpay credentials:
    ```env
    # SUPABASE (Get these from Supabase Project Settings -> API)
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-private-key

    # RAZORPAY (Get these from Razorpay Dashboard settings)
    NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_yourKeyID
    RAZORPAY_KEY_SECRET=yourKeySecret

    # APPLICATION SETTINGS
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    NEXT_PUBLIC_APP_NAME="Shyamved Residency"
    NODE_ENV=development
    ```

---

## ⚡ Step 6: Start the Local Development Server
Now you are ready to start the application! Run:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your web browser.

### Login Accounts for Testing:
*   **Chairman**: Login using `chairman@shyamved.com` and password `ShyamvedAdmin@2025`
*   **Office Manager**: Login using `office@shyamved.com` and password `ShyamvedOffice@2025`
*   **Resident (Flat A-101)**: Register a new account from the home screen using flat code `A-101`. The app will link you to the pre-seeded resident details automatically.

---

## 🛠️ Troubleshooting
*   **Module Not Found / Dependency Issue**: Delete the `node_modules` folder and run `npm install` again.
*   **Environment Variables Not Loading**: Make sure you saved the file exactly as `.env.local` (with a dot at the beginning) and restarted the server (`Ctrl+C` then `npm run dev`).
*   **Supabase Database Connection Error**: Verify that the database credentials in `.env.local` match your active project settings.
