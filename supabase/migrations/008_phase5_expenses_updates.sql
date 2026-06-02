-- Migration: Phase 5 Expenses Updates
-- Adds expense status lifecycle and attachment support, and refines RLS policies.

-- 1. Create expense status enum
CREATE TYPE expense_status AS ENUM ('draft', 'approved', 'locked');

-- 2. Alter expenses table
ALTER TABLE expenses 
  ADD COLUMN status expense_status NOT NULL DEFAULT 'draft',
  ADD COLUMN attachment_url text;

-- 3. Update audit_action enum (Postgres ENUMs are safely appended)
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'expense_updated';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'expense_deleted';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'expense_approved';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'expense_locked';

-- 4. Refine RLS Policies for Expenses

-- Drop existing generic update/delete policies
DROP POLICY IF EXISTS expenses_update_admin ON expenses;
DROP POLICY IF EXISTS expenses_delete_chairman ON expenses;

-- Chairman: Full Update Access (can edit ANY expense, approve, etc.)
CREATE POLICY "expenses_update_chairman"
ON expenses FOR UPDATE
USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- Chairman: Full Delete Access (can delete ANY expense)
CREATE POLICY "expenses_delete_chairman"
ON expenses FOR DELETE
USING (society_id = auth_user_society_id() AND auth_user_is_chairman());

-- Office Manager: Can only update 'draft' expenses. Cannot modify 'approved' or 'locked' expenses.
CREATE POLICY "expenses_update_officeman"
ON expenses FOR UPDATE
USING (
  society_id = auth_user_society_id() AND 
  auth_user_role() = 'office_man' AND 
  status = 'draft'
)
WITH CHECK (
  society_id = auth_user_society_id() AND 
  auth_user_role() = 'office_man' AND 
  status = 'draft' -- Office manager cannot change status to 'approved' or 'locked'
);

-- Office Manager: Can only delete 'draft' expenses.
CREATE POLICY "expenses_delete_officeman"
ON expenses FOR DELETE
USING (
  society_id = auth_user_society_id() AND 
  auth_user_role() = 'office_man' AND 
  status = 'draft'
);
