-- =============================================================================
-- CONTROLLED FINANCIAL RESET
-- Executed via migration to bypass immutability triggers temporarily.
-- DO NOT modify users, houses, authentication, or physical society structures.
-- =============================================================================

BEGIN;

-- 1. Temporarily disable triggers to bypass immutability guards
ALTER TABLE receipts DISABLE TRIGGER USER;
ALTER TABLE payments DISABLE TRIGGER USER;
ALTER TABLE bills DISABLE TRIGGER USER;
ALTER TABLE audit_logs DISABLE TRIGGER USER;

-- 2. Clear transactional tables (foreign key hierarchy strictly respected)
DELETE FROM receipts;
DELETE FROM payments;
DELETE FROM bills;

-- 3. Clear only specific billing/payment related audit logs
DELETE FROM audit_logs 
WHERE action_type IN (
  'bill_generated',
  'bill_updated',
  'bill_cancelled',
  'payment_cash_recorded',
  'payment_upi_initiated',
  'payment_upi_verified',
  'penalty_waived',
  'receipt_generated'
);

-- 4. Re-enable all triggers
ALTER TABLE receipts ENABLE TRIGGER USER;
ALTER TABLE payments ENABLE TRIGGER USER;
ALTER TABLE bills ENABLE TRIGGER USER;
ALTER TABLE audit_logs ENABLE TRIGGER USER;

COMMIT;
