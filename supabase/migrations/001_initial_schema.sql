-- =============================================================================
-- MIGRATION: 001_initial_schema.sql
-- Society Maintenance & Water Billing Management System
-- Full production schema for Shyamved Residency
-- =============================================================================
-- Run order: This must be the first migration applied.
-- Safe to re-run: NO — use IF NOT EXISTS guards.
-- =============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CUSTOM TYPES / ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('chairman', 'office_man', 'resident');
CREATE TYPE occupancy_status AS ENUM ('owner_occupied', 'tenant_occupied', 'vacant');
CREATE TYPE bill_status AS ENUM ('draft', 'pending', 'overdue', 'paid', 'waived', 'cancelled');
CREATE TYPE payment_mode AS ENUM ('upi', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE notice_type AS ENUM ('general', 'maintenance', 'payment_reminder', 'emergency', 'meeting', 'festival');
CREATE TYPE notice_priority AS ENUM ('normal', 'important', 'emergency');
CREATE TYPE notice_audience AS ENUM ('all', 'block_specific', 'admin_only');
CREATE TYPE notice_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE event_type AS ENUM ('festival', 'general_meeting', 'emergency_meeting', 'cultural', 'maintenance');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled');
CREATE TYPE chairman_status AS ENUM ('active', 'past');
CREATE TYPE audit_action AS ENUM (
  'bill_generated', 'bill_updated', 'bill_cancelled',
  'water_unit_entered', 'water_unit_updated',
  'payment_cash_recorded', 'payment_upi_initiated', 'payment_upi_verified',
  'penalty_waived', 'receipt_generated',
  'house_created', 'house_updated',
  'resident_created', 'resident_updated',
  'family_member_added', 'family_member_updated',
  'chairman_changed', 'notice_published', 'event_published',
  'expense_created', 'settings_updated'
);

-- =============================================================================
-- SOCIETIES
-- =============================================================================

CREATE TABLE societies (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  address               TEXT,
  registration_number   TEXT,
  maintenance_amount    NUMERIC(10, 2) NOT NULL DEFAULT 850.00,
  payment_window_start  INTEGER NOT NULL DEFAULT 1,
  payment_window_end    INTEGER NOT NULL DEFAULT 10,
  penalty_per_day       NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  active_chairman_id    UUID,               -- FK added after users table
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- BLOCKS
-- =============================================================================

CREATE TABLE blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id  UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,               -- e.g. "A", "B", "C"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (society_id, name)
);

-- =============================================================================
-- HOUSES
-- =============================================================================

CREATE TABLE houses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id            UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  block_id              UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  house_number          TEXT NOT NULL,     -- e.g. "A-101"
  floor                 INTEGER,
  occupancy_status      occupancy_status NOT NULL DEFAULT 'owner_occupied',
  owner_name            TEXT NOT NULL,
  owner_phone           TEXT NOT NULL,
  owner_email           TEXT,
  tenant_name           TEXT,
  tenant_phone          TEXT,
  primary_contact_phone TEXT NOT NULL,
  water_meter_id        TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (society_id, house_number)
);

-- =============================================================================
-- FAMILY MEMBERS
-- =============================================================================

CREATE TABLE family_members (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id            UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  society_id          UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  relationship        TEXT,
  age                 INTEGER,
  phone               TEXT,
  email               TEXT,
  is_primary_contact  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- USERS (extends Supabase auth.users)
-- =============================================================================

CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  society_id  UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  house_id    UUID REFERENCES houses(id) ON DELETE SET NULL,
  full_name   TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now add the FK for active_chairman_id
ALTER TABLE societies
  ADD CONSTRAINT fk_societies_chairman
  FOREIGN KEY (active_chairman_id) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================================================
-- CHAIRMAN HISTORY
-- =============================================================================

CREATE TABLE chairman_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chairman_name   TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          chairman_status NOT NULL DEFAULT 'active',
  changed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active chairman per society
CREATE UNIQUE INDEX idx_chairman_history_one_active
  ON chairman_history (society_id)
  WHERE status = 'active';

-- =============================================================================
-- WATER RATES (historical pricing)
-- =============================================================================

CREATE TABLE water_rates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  price_per_unit  NUMERIC(10, 2) NOT NULL,
  effective_from  DATE NOT NULL,
  effective_to    DATE,               -- NULL = currently active
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active rate per society
CREATE UNIQUE INDEX idx_water_rates_one_active
  ON water_rates (society_id)
  WHERE effective_to IS NULL;

-- =============================================================================
-- WATER METER ENTRIES
-- =============================================================================

CREATE TABLE water_meter_entries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id        UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  house_id          UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  billing_month     DATE NOT NULL,   -- Always stored as first of month: 2025-06-01
  units_consumed    NUMERIC(10, 2) NOT NULL,
  unit_price        NUMERIC(10, 2) NOT NULL,   -- Snapshot of rate at entry time
  previous_reading  NUMERIC(10, 2),
  current_reading   NUMERIC(10, 2),
  entered_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (house_id, billing_month)
);

-- =============================================================================
-- BILLS
-- =============================================================================

CREATE TABLE bills (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id            UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  house_id              UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  billing_month         DATE NOT NULL,       -- Always first of month: 2025-06-01
  maintenance_amount    NUMERIC(10, 2) NOT NULL,
  water_units           NUMERIC(10, 2),
  water_unit_price      NUMERIC(10, 2),      -- Snapshot at bill generation time
  water_bill_amount     NUMERIC(10, 2),
  penalty_waived        BOOLEAN NOT NULL DEFAULT FALSE,
  penalty_waived_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  penalty_waiver_reason TEXT,
  penalty_waived_at     TIMESTAMPTZ,
  status                bill_status NOT NULL DEFAULT 'draft',
  due_date              DATE,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One bill per house per month — hard constraint
  UNIQUE (house_id, billing_month)
);

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id            UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  bill_id               UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  house_id              UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  amount_paid           NUMERIC(10, 2) NOT NULL,
  payment_mode          payment_mode NOT NULL,
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT UNIQUE,
  razorpay_signature    TEXT,
  cash_collected_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  receipt_number        TEXT UNIQUE,
  status                payment_status NOT NULL DEFAULT 'pending',
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- RECEIPTS
-- =============================================================================

CREATE TABLE receipts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE UNIQUE,
  bill_id         UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  house_id        UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  receipt_number  TEXT NOT NULL UNIQUE,
  receipt_data    JSONB NOT NULL,     -- Full immutable snapshot at time of generation
  pdf_url         TEXT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- EXPENSES
-- =============================================================================

CREATE TABLE expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id    UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  category      TEXT,
  amount        NUMERIC(10, 2) NOT NULL,
  expense_date  DATE,
  paid_to       TEXT,
  payment_mode  TEXT,
  notes         TEXT,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- NOTICES
-- =============================================================================

CREATE TABLE notices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  type            notice_type NOT NULL DEFAULT 'general',
  priority        notice_priority NOT NULL DEFAULT 'normal',
  published_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at    TIMESTAMPTZ,
  expiry_date     TIMESTAMPTZ,
  audience        notice_audience NOT NULL DEFAULT 'all',
  target_block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
  status          notice_status NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- EVENTS
-- =============================================================================

CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id    UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  event_type    event_type NOT NULL DEFAULT 'general_meeting',
  description   TEXT,
  event_date    DATE NOT NULL,
  start_time    TIME,
  end_time      TIME,
  location      TEXT,
  published_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  status        event_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role      user_role,
  action_type     audit_action NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  previous_value  JSONB,
  new_value       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs are append-only — no updates or deletes allowed
CREATE RULE no_update_audit_logs AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit_logs AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Bills
CREATE INDEX idx_bills_house_id ON bills(house_id);
CREATE INDEX idx_bills_society_billing_month ON bills(society_id, billing_month);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);

-- Payments
CREATE INDEX idx_payments_bill_id ON payments(bill_id);
CREATE INDEX idx_payments_house_id ON payments(house_id);
CREATE INDEX idx_payments_society_id ON payments(society_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- Houses
CREATE INDEX idx_houses_society_block ON houses(society_id, block_id);
CREATE INDEX idx_houses_is_active ON houses(is_active);
CREATE INDEX idx_houses_owner_phone ON houses(owner_phone);

-- Users
CREATE INDEX idx_users_society_role ON users(society_id, role);

-- Notices / Events
CREATE INDEX idx_notices_society_status ON notices(society_id, status);
CREATE INDEX idx_events_society_date ON events(society_id, event_date);

-- Audit logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_society ON audit_logs(society_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);

-- Water meter entries
CREATE INDEX idx_water_entries_billing_month ON water_meter_entries(billing_month);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- Automatically update updated_at on row changes
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_societies_updated_at
  BEFORE UPDATE ON societies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_houses_updated_at
  BEFORE UPDATE ON houses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
