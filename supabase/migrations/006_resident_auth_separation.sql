-- =============================================================================
-- MIGRATION: 006_resident_auth_separation.sql
-- Adds linked_family_member_id and requires_password_reset to public.users
-- so that resident app accounts are explicitly linked to family_members.
--
-- BACKWARD COMPATIBLE: Existing rows get NULL for linked_family_member_id
-- and FALSE for requires_password_reset. No data is deleted or modified.
-- =============================================================================

-- 1. Add new columns to public.users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS linked_family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS requires_password_reset BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create an index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_linked_family_member 
  ON users(linked_family_member_id) 
  WHERE linked_family_member_id IS NOT NULL;

-- 3. Update the auth sync trigger to handle the new columns
-- This preserves the existing behavior for chairman/office_man signups
-- and adds support for resident accounts created via grantAppAccess.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  extracted_society_id UUID;
  extracted_role user_role;
  extracted_house_id UUID;
  extracted_family_member_id UUID;
  extracted_requires_reset BOOLEAN;
BEGIN
  -- Only attempt insert if society_id is present in metadata.
  -- If society_id is missing (e.g. admin-created users with no metadata),
  -- skip the insert gracefully — the calling code will insert manually.
  IF NEW.raw_user_meta_data->>'society_id' IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extract from raw_user_meta_data with fallbacks
  extracted_society_id := (NEW.raw_user_meta_data->>'society_id')::UUID;
  
  extracted_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'resident'::user_role
  );

  extracted_house_id := (NEW.raw_user_meta_data->>'house_id')::UUID;
  extracted_family_member_id := (NEW.raw_user_meta_data->>'linked_family_member_id')::UUID;
  extracted_requires_reset := COALESCE(
    (NEW.raw_user_meta_data->>'requires_password_reset')::BOOLEAN,
    FALSE
  );

  INSERT INTO public.users (
    id, society_id, role, house_id, linked_family_member_id, full_name, phone, is_active, requires_password_reset
  )
  VALUES (
    NEW.id, extracted_society_id, extracted_role, extracted_house_id, extracted_family_member_id,
    NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone', TRUE, extracted_requires_reset
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotent: skip if row already exists
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but NEVER block auth user creation.
  -- The application-level code will handle profile creation as a fallback.
  RAISE WARNING 'handle_new_user trigger failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Re-create the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Add RLS policy so residents can update their own requires_password_reset
-- (needed for the password reset flow)
-- The existing "users_update_self" policy already allows self-updates,
-- but it blocks role changes. We keep that behavior intact.
