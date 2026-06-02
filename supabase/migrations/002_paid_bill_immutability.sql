-- =============================================================================
-- MIGRATION: 002_paid_bill_immutability.sql
-- Enforces that paid bills cannot have financial fields changed.
-- This is a hard database-level constraint in addition to application logic.
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_paid_bill_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Once a bill is PAID, critical financial fields are immutable
  IF OLD.status = 'paid' THEN
    -- Allow status column changes only for audit/admin purposes by superuser
    -- Reject changes to financial fields
    IF (
      NEW.maintenance_amount   != OLD.maintenance_amount   OR
      NEW.water_units          IS DISTINCT FROM OLD.water_units          OR
      NEW.water_unit_price     IS DISTINCT FROM OLD.water_unit_price     OR
      NEW.water_bill_amount    IS DISTINCT FROM OLD.water_bill_amount    OR
      NEW.billing_month        != OLD.billing_month        OR
      NEW.house_id             != OLD.house_id             OR
      NEW.society_id           != OLD.society_id
    ) THEN
      RAISE EXCEPTION
        'PAID BILL IS IMMUTABLE: Financial fields on a paid bill (id: %) cannot be modified. '
        'Contact system administrator for adjustments.',
        OLD.id;
    END IF;

    -- Penalty waiver: only allowed if NOT already paid (transition check)
    -- Once paid, penalty_waived cannot be changed
    IF NEW.penalty_waived != OLD.penalty_waived AND OLD.status = 'paid' THEN
      RAISE EXCEPTION
        'PAID BILL IS IMMUTABLE: Cannot change penalty waiver on a paid bill (id: %).',
        OLD.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_paid_bill_modification
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION prevent_paid_bill_modification();

-- =============================================================================
-- Prevent deletion of paid bills entirely
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_paid_bill_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'paid' THEN
    RAISE EXCEPTION
      'PAID BILL IS IMMUTABLE: Paid bills cannot be deleted (id: %). '
      'This is a permanent financial record.',
      OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_paid_bill_deletion
  BEFORE DELETE ON bills
  FOR EACH ROW EXECUTE FUNCTION prevent_paid_bill_deletion();

-- =============================================================================
-- Prevent deletion of payment records
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_payment_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'success' THEN
    RAISE EXCEPTION
      'PAYMENT RECORD IS IMMUTABLE: Successful payment records cannot be deleted (id: %). '
      'This is a permanent financial record.',
      OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_payment_deletion
  BEFORE DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION prevent_payment_deletion();

-- =============================================================================
-- Prevent deletion of receipts
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_receipt_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'RECEIPT IS IMMUTABLE: Receipts cannot be deleted (id: %). '
    'Receipts are permanent financial documents.',
    OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_receipt_deletion
  BEFORE DELETE ON receipts
  FOR EACH ROW EXECUTE FUNCTION prevent_receipt_deletion();
