// =============================================================================
// DATABASE TYPES — Auto-generated structure matching Supabase PostgreSQL schema
// These types reflect the exact database schema. Do NOT edit manually unless
// the schema changes. Run `npx supabase gen types typescript` to regenerate.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'chairman' | 'office_man' | 'resident'

export type OccupancyStatus = 'owner_occupied' | 'tenant_occupied' | 'vacant'

export type BillStatus =
  | 'draft'
  | 'pending'
  | 'overdue'
  | 'paid'
  | 'waived'
  | 'cancelled'

export type PaymentMode = 'upi' | 'cash'

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export type NoticeType =
  | 'general'
  | 'maintenance'
  | 'payment_reminder'
  | 'emergency'
  | 'meeting'
  | 'festival'

export type NoticePriority = 'normal' | 'important' | 'emergency'

export type NoticeAudience = 'all' | 'block_specific' | 'admin_only'

export type NoticeStatus = 'draft' | 'published' | 'archived'

export type EventType =
  | 'festival'
  | 'general_meeting'
  | 'emergency_meeting'
  | 'cultural'
  | 'maintenance'

export type EventStatus = 'draft' | 'published' | 'cancelled'

export type ChairmanStatus = 'active' | 'past'

export type AuditActionType =
  | 'bill_generated'
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'expense_approved'
  | 'expense_locked'
  | 'bill_updated'
  | 'bill_cancelled'
  | 'water_unit_entered'
  | 'water_unit_updated'
  | 'payment_cash_recorded'
  | 'payment_upi_initiated'
  | 'payment_upi_verified'
  | 'penalty_waived'
  | 'receipt_generated'
  | 'house_created'
  | 'house_updated'
  | 'resident_added'
  | 'resident_removed'
  | 'resident_created'
  | 'resident_updated'
  | 'resident_access_granted'
  | 'resident_access_revoked'
  | 'family_member_added'
  | 'family_member_updated'
  | 'family_member_removed'
  | 'chairman_changed'
  | 'notice_published'
  | 'event_published'
  | 'expense_created'
  | 'settings_updated'

// ─────────────────────────────────────────────────────────────────────────────
// TABLE ROW TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Society {
  id: string
  name: string
  address: string | null
  registration_number: string | null
  maintenance_amount: number
  payment_window_start: number
  payment_window_end: number
  penalty_per_day: number
  active_chairman_id: string | null
  created_at: string
  updated_at: string
}

export interface Block {
  id: string
  society_id: string
  name: string
  created_at: string
}

export interface House {
  id: string
  society_id: string
  block_id: string
  house_number: string
  floor: number | null
  occupancy_status: OccupancyStatus
  owner_name: string
  owner_phone: string
  owner_email: string | null
  tenant_name: string | null
  tenant_phone: string | null
  primary_contact_phone: string
  water_meter_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  house_id: string
  society_id: string
  full_name: string
  relationship: string | null
  age: number | null
  phone: string | null
  email: string | null
  is_primary_contact: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  society_id: string
  role: UserRole
  house_id: string | null
  linked_family_member_id: string | null
  full_name: string | null
  phone: string | null
  is_active: boolean
  requires_password_reset: boolean
  created_at: string
  updated_at: string
}

export interface ChairmanHistory {
  id: string
  society_id: string
  user_id: string
  chairman_name: string
  phone: string | null
  email: string | null
  start_date: string
  end_date: string | null
  status: ChairmanStatus
  changed_by: string | null
  notes: string | null
  created_at: string
}

export interface WaterRate {
  id: string
  society_id: string
  price_per_unit: number
  effective_from: string
  effective_to: string | null
  created_by: string | null
  created_at: string
}

export interface WaterMeterEntry {
  id: string
  society_id: string
  house_id: string
  billing_month: string  // ISO date — always first of month: "2025-06-01"
  units_consumed: number
  unit_price: number     // snapshot of rate at entry time
  previous_reading: number | null
  current_reading: number | null
  entered_by: string | null
  entry_date: string
}

export interface Bill {
  id: string
  society_id: string
  house_id: string
  billing_month: string      // ISO date — "2025-06-01"
  bill_number: string | null
  maintenance_amount: number
  water_units: number | null
  water_unit_price: number | null  // snapshot at bill generation time
  water_bill_amount: number | null
  penalty_amount: number | null
  final_amount: number | null
  penalty_waived: boolean
  penalty_waived_by: string | null
  penalty_waiver_reason: string | null
  penalty_waived_at: string | null
  status: BillStatus
  due_date: string | null
  generated_at: string
  finalized_at: string | null
  updated_at: string
}

export interface Payment {
  id: string
  society_id: string
  bill_id: string
  house_id: string
  amount_paid: number
  payment_mode: PaymentMode
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  cash_collected_by: string | null
  receipt_number: string | null
  status: PaymentStatus
  paid_at: string | null
  created_at: string
}

export interface Receipt {
  id: string
  society_id: string
  payment_id: string
  bill_id: string
  house_id: string
  receipt_number: string
  receipt_data: Json    // Full immutable snapshot of bill + payment at generation time
  pdf_url: string | null
  generated_at: string
}

export interface Expense {
  id: string
  society_id: string
  title: string
  category: string | null
  amount: number
  expense_date: string | null
  paid_to: string | null
  payment_mode: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface Notice {
  id: string
  society_id: string
  title: string
  description: string | null
  type: NoticeType
  priority: NoticePriority
  published_by: string | null
  published_at: string | null
  expiry_date: string | null
  audience: NoticeAudience
  target_block_id: string | null
  status: NoticeStatus
  created_at: string
}

export interface SocietyEvent {
  id: string
  society_id: string
  title: string
  event_type: EventType
  description: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  published_by: string | null
  status: EventStatus
  created_at: string
}

export interface AuditLog {
  id: string
  society_id: string
  actor_id: string | null
  actor_role: UserRole | null
  action_type: AuditActionType
  entity_type: string
  entity_id: string | null
  previous_value: Json | null
  new_value: Json | null
  created_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITE TYPES (for joins used in queries)
// ─────────────────────────────────────────────────────────────────────────────

export interface HouseWithBlock extends House {
  block: Block
}

export interface BillWithHouse extends Bill {
  house: HouseWithBlock
}

export interface PaymentWithBill extends Payment {
  bill: Bill
}

export interface ReceiptWithPayment extends Receipt {
  payment: Payment
}
