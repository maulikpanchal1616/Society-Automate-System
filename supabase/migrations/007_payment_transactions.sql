-- =============================================================================
-- MIGRATION: 007_payment_transactions.sql
-- Enforces atomic database-level transactions for all payments.
-- =============================================================================

CREATE OR REPLACE FUNCTION process_payment_transaction(
  p_bill_id UUID,
  p_amount NUMERIC,
  p_payment_mode payment_mode,
  p_collected_by UUID,
  p_razorpay_order_id TEXT,
  p_razorpay_payment_id TEXT,
  p_razorpay_signature TEXT,
  p_receipt_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_bill bills%ROWTYPE;
  v_payment_id UUID;
  v_receipt_id UUID;
  v_receipt_number TEXT;
BEGIN
  -- Lock the bill row to prevent concurrent transactions (race conditions)
  SELECT * INTO v_bill FROM bills WHERE id = p_bill_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found';
  END IF;

  -- Idempotency and State Safety checks
  IF v_bill.status = 'paid' THEN
    -- If it's a razorpay webhook retry, we might just want to return silently,
    -- but for safety we'll raise an exception to ensure the caller handles it.
    -- The webhook handler can catch 'Bill is already paid' and return 200 to Razorpay.
    RAISE EXCEPTION 'Bill is already paid';
  END IF;
  
  IF v_bill.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot pay a cancelled bill';
  END IF;

  IF v_bill.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot pay a draft bill. Finalize water entries first.';
  END IF;

  -- Generate unique receipt number (e.g. RCPT-20260527-AB12CD)
  v_receipt_number := 'RCPT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 6));

  -- Inject receipt number and timestamps into the receipt_data JSON snapshot
  p_receipt_data := p_receipt_data || jsonb_build_object(
    'receipt_number', v_receipt_number,
    'payment_mode', p_payment_mode,
    'paid_at', now()
  );

  -- 1. Insert Payment
  INSERT INTO payments (
    society_id, bill_id, house_id, amount_paid, payment_mode,
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    cash_collected_by, receipt_number, status, paid_at
  ) VALUES (
    v_bill.society_id, p_bill_id, v_bill.house_id, p_amount, p_payment_mode,
    p_razorpay_order_id, p_razorpay_payment_id, p_razorpay_signature,
    p_collected_by, v_receipt_number, 'success', now()
  ) RETURNING id INTO v_payment_id;

  -- 2. Update Bill Status to Paid
  UPDATE bills
  SET status = 'paid', updated_at = now()
  WHERE id = p_bill_id;

  -- 3. Insert Immutable Receipt
  INSERT INTO receipts (
    society_id, payment_id, bill_id, house_id, receipt_number, receipt_data
  ) VALUES (
    v_bill.society_id, v_payment_id, p_bill_id, v_bill.house_id, v_receipt_number, p_receipt_data
  ) RETURNING id INTO v_receipt_id;

  -- Return payload containing transaction identifiers
  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'receipt_id', v_receipt_id,
    'receipt_number', v_receipt_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
