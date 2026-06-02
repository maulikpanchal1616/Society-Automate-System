-- =============================================================================
-- MIGRATION: 005_auth_sync_trigger.sql
-- Automatically creates a public.users profile when a new user signs up
-- via Supabase Auth. Requires society_id and role in raw_user_meta_data.
-- =============================================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  extracted_society_id UUID;
  extracted_role user_role;
BEGIN
  -- Extract from raw_user_meta_data with fallbacks
  
  -- 1. Get Society ID. If not provided, this will throw an error since society_id is NOT NULL in public.users.
  -- You must pass society_id in the auth.signUp options.data
  extracted_society_id := (NEW.raw_user_meta_data->>'society_id')::UUID;
  
  -- 2. Get Role. Default to resident if missing.
  extracted_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'resident'::user_role
  );

  INSERT INTO public.users (
    id, 
    society_id, 
    role, 
    full_name, 
    phone, 
    is_active
  )
  VALUES (
    NEW.id,
    extracted_society_id,
    extracted_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    TRUE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
