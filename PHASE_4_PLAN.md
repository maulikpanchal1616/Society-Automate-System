# Phase 4 Implementation Plan: Payments, Receipts, and Financial Runtime

This plan outlines the architecture and implementation sequence for Phase 4, focusing on a production-grade, transaction-safe payment system. We will prioritize the manual Cash Payment flow first, followed by the Receipt Engine (including PDF generation), Resident UI, and finally Razorpay Integration.

## Dependency Audit

Based on the `package.json`, the following required dependencies for Phase 4 are already installed and correctly versioned:
* `razorpay` (^2.9.6) - For Razorpay SDK integration (server-side).
* `@react-pdf/renderer` (^4.5.1) - For server-side/client-side PDF receipt generation.
* `date-fns` (^4.3.0) - For date formatting on receipts.

**Conclusion:** No new dependencies are required. The environment is fully prepared for Phase 4.

## Proposed Changes

### 1. Database Transaction Architecture (Migration)
To guarantee financial audit protection, prevent race conditions, and ensure rollback safety, we will move the core payment processing logic (which updates `bills`, inserts `payments`, and inserts `receipts`) into atomic PostgreSQL functions (RPCs).

#### [NEW] `supabase/migrations/007_payment_transactions.sql`
- Create `process_cash_payment(bill_id, amount, collected_by)` RPC.
- Create `process_razorpay_payment(bill_id, razorpay_payment_id, ...)` RPC.
- These RPCs will wrap the 3-step process (Update Bill -> Insert Payment -> Insert Receipt) in a strict database transaction (`BEGIN ... COMMIT`).
- Generates unique receipt numbers (e.g., `RCPT-YYYYMM-XXXX`).
- Snapshots financial data into `receipt_data` JSONB.

### 2. Payment & Receipt Engines (Server Actions)
We will create new feature modules for payments and receipts.

#### [NEW] `src/features/payments/actions.ts`
- `recordCashPayment`: Admin-only server action. Calls the `process_cash_payment` RPC.
- `createRazorpayOrder`: Resident-facing action to generate a Razorpay order ID.

#### [NEW] `src/features/receipts/actions.ts` & `queries.ts`
- Functions to fetch receipts by house/user.
- Logic to structure data for PDF generation.

### 3. PDF Receipt System
Using `@react-pdf/renderer`, we will build a dynamic, beautifully formatted PDF template.

#### [NEW] `src/features/receipts/components/ReceiptPDF.tsx`
- React components specifically built for `@react-pdf/renderer` (`<Document>`, `<Page>`, `<View>`, `<Text>`).
- Includes society branding, receipt number, resident details, bill month, breakdown (maintenance, water, penalties), payment method, timestamps.

#### [NEW] `src/app/api/receipts/[id]/route.ts`
- A Route Handler to serve the PDF dynamically. The resident/admin can hit this URL to download/view the PDF receipt securely.

### 4. Admin Cash Payment UI
We need to give Chairman and Office Man the ability to record cash payments.

#### [MODIFY] `src/app/admin/billing/page.tsx` (and related Office Man pages)
- Add a "Record Cash Payment" modal for bills in `pending` or `overdue` status.
- Show loading states and success confirmation.
- Once paid, the bill is locked and a "Download Receipt" button appears.

### 5. Resident Payment History UI
Provide the resident with a comprehensive view of their dues and payment history.

#### [NEW] `src/app/resident/payments/page.tsx` (or modify existing dashboard)
- **Current Dues Section:** Lists unpaid bills with a dynamic penalty calculation.
- **Payment History Timeline:** Lists past payments, statuses, and a button to download the PDF receipt.
- **Pay Now Button:** Initiates Razorpay flow (disabled until Razorpay is fully integrated in Step 6).

### 6. Razorpay Integration & Webhooks
Once the internal cash flow and receipt engine are rock solid, we will activate Razorpay.

#### [NEW] `src/app/api/webhooks/razorpay/route.ts`
- Route handler for `payment.captured` webhooks.
- Verifies `x-razorpay-signature` using `crypto` HMAC.
- Calls the `process_razorpay_payment` RPC using the Service Role client to idempotently update the bill, record the payment, and generate the receipt.

## User Review Required

> [!IMPORTANT]
> **Database RPC Strategy:** To guarantee ACID compliance and avoid race conditions (where a payment is recorded but the receipt fails, or the bill status doesn't update), I propose handling the core payment/receipt insertion inside a Postgres function (RPC) in a new migration. This means the frontend/server actions will simply call `supabase.rpc('process_cash_payment', { ... })` and Postgres will handle the transaction rollback safely if anything fails. Are you comfortable with this approach?

> [!NOTE]
> We will start by implementing Steps 1, 2, 3, and 4 (Cash Payments & PDF Receipts) first, ensuring the foundation is solid before integrating Razorpay webhooks.

## Verification Plan
1. **Migration:** Apply `007_payment_transactions.sql` and test the RPC manually.
2. **Cash Flow:** Create a dummy bill, record a cash payment as Chairman, verify that the bill status changes to `paid`, a payment record is created, and a receipt is generated.
3. **PDF Generation:** Download the generated receipt via the API route and visually verify the PDF structure, amounts, and metadata.
4. **Resident UI:** Log in as a resident and verify that the payment history correctly displays the paid bill and the receipt is downloadable.
5. **Razorpay Flow:** Create an order, simulate a webhook via Postman, and verify idempotent processing.
