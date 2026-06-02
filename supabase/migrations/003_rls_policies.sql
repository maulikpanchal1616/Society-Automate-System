-- =============================================================================
-- MIGRATION: 003_rls_policies.sql
-- Row Level Security policies for all tables.
--
-- Security model:
--   - Residents: can only access their own house, bills, payments, receipts
--   - Office Man: full operational access within their society
--   - Chairman: full administrative access within their society
--   - No user can access another society's data
--   - Supabase service role bypasses RLS (used only in server-side webhooks)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE societies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chairman_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_rates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_meter_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS — used in policies to avoid repetition
-- =============================================================================

-- Get the society_id of the current authenticated user
CREATE OR REPLACE FUNCTION auth_user_society_id()
RETURNS UUID AS $$
  SELECT society_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get the role of the current authenticated user
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get the house_id of the current authenticated user (residents only)
CREATE OR REPLACE FUNCTION auth_user_house_id()
RETURNS UUID AS $$
  SELECT house_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is a chairman or office_man
CREATE OR REPLACE FUNCTION auth_user_is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('chairman', 'office_man') FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is specifically a chairman
CREATE OR REPLACE FUNCTION auth_user_is_chairman()
RETURNS BOOLEAN AS $$
  SELECT role = 'chairman' FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================================================
-- SOCIETIES — Admin can read their society; Chairman can update
-- =============================================================================

CREATE POLICY "societies_select_admin"
  ON societies FOR SELECT
  USING (id = auth_user_society_id());

CREATE POLICY "societies_update_chairman"
  ON societies FOR UPDATE
  USING (id = auth_user_society_id() AND auth_user_is_chairman())
  WITH CHECK (id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- BLOCKS — All users in a society can read blocks; admins can manage
-- =============================================================================

CREATE POLICY "blocks_select_any"
  ON blocks FOR SELECT
  USING (society_id = auth_user_society_id());

CREATE POLICY "blocks_insert_admin"
  ON blocks FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "blocks_update_admin"
  ON blocks FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "blocks_delete_chairman"
  ON blocks FOR DELETE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- HOUSES — Residents see own house only; admins see all in their society
-- =============================================================================

CREATE POLICY "houses_select_admin"
  ON houses FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "houses_select_resident"
  ON houses FOR SELECT
  USING (id = auth_user_house_id());

CREATE POLICY "houses_insert_admin"
  ON houses FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "houses_update_admin"
  ON houses FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin())
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "houses_delete_chairman"
  ON houses FOR DELETE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- FAMILY MEMBERS — Residents see own house members; admins see all
-- =============================================================================

CREATE POLICY "family_members_select_admin"
  ON family_members FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "family_members_select_resident"
  ON family_members FOR SELECT
  USING (house_id = auth_user_house_id());

CREATE POLICY "family_members_insert_admin"
  ON family_members FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "family_members_update_admin"
  ON family_members FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "family_members_delete_admin"
  ON family_members FOR DELETE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

-- =============================================================================
-- USERS — Users can read their own profile; admins read all in society
-- =============================================================================

CREATE POLICY "users_select_self"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "users_update_self"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "users_update_chairman"
  ON users FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- CHAIRMAN HISTORY — Admins can read; Chairman manages
-- =============================================================================

CREATE POLICY "chairman_history_select_admin"
  ON chairman_history FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "chairman_history_insert_chairman"
  ON chairman_history FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_chairman());

CREATE POLICY "chairman_history_update_chairman"
  ON chairman_history FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- WATER RATES — Admins read; Chairman manages
-- =============================================================================

CREATE POLICY "water_rates_select_admin"
  ON water_rates FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "water_rates_insert_chairman"
  ON water_rates FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_chairman());

CREATE POLICY "water_rates_update_chairman"
  ON water_rates FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- WATER METER ENTRIES — Admins read/write; residents cannot access
-- =============================================================================

CREATE POLICY "water_entries_select_admin"
  ON water_meter_entries FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "water_entries_insert_admin"
  ON water_meter_entries FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "water_entries_update_admin"
  ON water_meter_entries FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

-- =============================================================================
-- BILLS — Residents see own bills; admins see all
-- =============================================================================

CREATE POLICY "bills_select_admin"
  ON bills FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "bills_select_resident"
  ON bills FOR SELECT
  USING (
    house_id = auth_user_house_id()
    AND society_id = auth_user_society_id()
  );

CREATE POLICY "bills_insert_admin"
  ON bills FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "bills_update_admin"
  ON bills FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin())
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

-- Residents cannot delete bills at all
-- Admins cannot delete paid bills (enforced by trigger in migration 002)
CREATE POLICY "bills_delete_chairman"
  ON bills FOR DELETE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- PAYMENTS — Residents see own payments; admins see all
-- =============================================================================

CREATE POLICY "payments_select_admin"
  ON payments FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "payments_select_resident"
  ON payments FOR SELECT
  USING (
    house_id = auth_user_house_id()
    AND society_id = auth_user_society_id()
  );

CREATE POLICY "payments_insert_admin"
  ON payments FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

-- Residents can insert UPI payment initiation (pending status only)
CREATE POLICY "payments_insert_resident_upi"
  ON payments FOR INSERT
  WITH CHECK (
    house_id = auth_user_house_id()
    AND society_id = auth_user_society_id()
    AND payment_mode = 'upi'
    AND status = 'pending'
  );

-- Payments cannot be updated by anyone via RLS (webhook uses service role)
-- Successful payments cannot be deleted (enforced by trigger in migration 002)

-- =============================================================================
-- RECEIPTS — Residents see own receipts; admins see all
-- =============================================================================

CREATE POLICY "receipts_select_admin"
  ON receipts FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "receipts_select_resident"
  ON receipts FOR SELECT
  USING (
    house_id = auth_user_house_id()
    AND society_id = auth_user_society_id()
  );

-- Receipt inserts are service role only (from webhook/server action)
-- Receipt deletes are prevented by trigger in migration 002

-- =============================================================================
-- EXPENSES — Admins read and write; residents have no access
-- =============================================================================

CREATE POLICY "expenses_select_admin"
  ON expenses FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "expenses_insert_admin"
  ON expenses FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "expenses_update_admin"
  ON expenses FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "expenses_delete_chairman"
  ON expenses FOR DELETE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- NOTICES — Published notices visible to relevant residents; admins manage
-- =============================================================================

CREATE POLICY "notices_select_admin"
  ON notices FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "notices_select_resident"
  ON notices FOR SELECT
  USING (
    society_id = auth_user_society_id()
    AND status = 'published'
    AND (audience = 'all' OR audience = 'block_specific')
    AND (expiry_date IS NULL OR expiry_date > NOW())
  );

CREATE POLICY "notices_insert_admin"
  ON notices FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "notices_update_admin"
  ON notices FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "notices_delete_chairman"
  ON notices FOR DELETE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- EVENTS — Published events visible to all residents; admins manage
-- =============================================================================

CREATE POLICY "events_select_admin"
  ON events FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "events_select_resident"
  ON events FOR SELECT
  USING (
    society_id = auth_user_society_id()
    AND status = 'published'
  );

CREATE POLICY "events_insert_admin"
  ON events FOR INSERT
  WITH CHECK (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "events_update_admin"
  ON events FOR UPDATE
  USING (society_id = auth_user_society_id() AND auth_user_is_admin());

CREATE POLICY "events_delete_chairman"
  ON events FOR DELETE
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- =============================================================================
-- AUDIT LOGS — Chairman can read; no user can modify or delete
-- =============================================================================

CREATE POLICY "audit_logs_select_chairman"
  ON audit_logs FOR SELECT
  USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- Inserts are service role only via server actions
-- Updates and deletes are blocked by database rules in migration 001
