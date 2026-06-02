-- =============================================================================
-- MIGRATION: 004_billing_refinements.sql
-- Adds columns to support permanent financial snapshotting and finalized details.
-- Updates paid bill immutable triggers to protect these new columns.
-- =============================================================================

-- Alter bills table to add new snapshotting columns
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS bill_number          TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS penalty_amount        NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS final_amount          NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS finalized_at          TIMESTAMPTZ;

-- Re-define the immutable trigger function to check the new columns
CREATE OR REPLACE FUNCTION prevent_paid_bill_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Once a bill is PAID, critical financial fields are immutable
  IF OLD.status = 'paid' THEN
    -- Reject changes to financial fields
    IF (
      NEW.maintenance_amount   != OLD.maintenance_amount   OR
      NEW.water_units          IS DISTINCT FROM OLD.water_units          OR
      NEW.water_unit_price     IS DISTINCT FROM OLD.water_unit_price     OR
      NEW.water_bill_amount    IS DISTINCT FROM OLD.water_bill_amount    OR
      NEW.penalty_amount       IS DISTINCT FROM OLD.penalty_amount       OR
      NEW.final_amount         IS DISTINCT FROM OLD.final_amount         OR
      NEW.bill_number          IS DISTINCT FROM OLD.bill_number          OR
      NEW.finalized_at         IS DISTINCT FROM OLD.finalized_at         OR
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
