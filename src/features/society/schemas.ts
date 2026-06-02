// =============================================================================
// SOCIETY FEATURE — Zod Validation Schemas
// All inputs validated server-side before any DB operation.
// =============================================================================

import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Society Settings
// ─────────────────────────────────────────────────────────────────────────────

export const UpdateSocietySettingsSchema = z.object({
  name: z
    .string()
    .min(2, 'Society name must be at least 2 characters')
    .max(100, 'Society name too long'),
  address: z
    .string()
    .max(500, 'Address too long')
    .optional()
    .or(z.literal('')),
  maintenance_amount: z
    .number({ message: 'Must be a number' })
    .min(0, 'Maintenance amount cannot be negative')
    .max(50000, 'Amount seems too high — please verify'),
  payment_window_start: z
    .number()
    .int()
    .min(1)
    .max(28, 'Payment window start must be 1–28'),
  payment_window_end: z
    .number()
    .int()
    .min(1)
    .max(28, 'Payment window end must be 1–28'),
  penalty_per_day: z
    .number({ message: 'Must be a number' })
    .min(0)
    .max(1000),
}).refine(
  (data) => data.payment_window_end >= data.payment_window_start,
  {
    message: 'Payment window end must be after or equal to start',
    path: ['payment_window_end'],
  }
)

export type UpdateSocietySettingsInput = z.infer<typeof UpdateSocietySettingsSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Water Rate
// ─────────────────────────────────────────────────────────────────────────────

export const CreateWaterRateSchema = z.object({
  price_per_unit: z
    .number({ message: 'Must be a number' })
    .min(0.01, 'Price must be greater than 0')
    .max(1000, 'Price seems too high — please verify'),
  effective_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
})

export type CreateWaterRateInput = z.infer<typeof CreateWaterRateSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Block
// ─────────────────────────────────────────────────────────────────────────────

export const CreateBlockSchema = z.object({
  name: z
    .string()
    .min(1, 'Block name is required')
    .max(10, 'Block name too long')
    .regex(/^[A-Z0-9]+$/i, 'Block name should be alphanumeric (e.g. A, B, Wing1)'),
})

export type CreateBlockInput = z.infer<typeof CreateBlockSchema>

// ─────────────────────────────────────────────────────────────────────────────
// House
// ─────────────────────────────────────────────────────────────────────────────

const BaseHouseSchema = z.object({
  block_id: z.string().uuid('Invalid block'),
  house_number: z
    .string()
    .min(1, 'House number is required')
    .max(20, 'House number too long'),
  floor: z
    .number()
    .int()
    .min(0)
    .max(99)
    .optional()
    .nullable(),
  occupancy_status: z.enum(['owner_occupied', 'tenant_occupied', 'vacant']),
  owner_name: z
    .string()
    .min(2, 'Owner name is required')
    .max(100),
  owner_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  owner_email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  tenant_name: z
    .string()
    .max(100)
    .optional()
    .or(z.literal('')),
  tenant_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  primary_contact_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  water_meter_id: z
    .string()
    .max(50)
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(true),
})

export const CreateHouseSchema = BaseHouseSchema.refine(
  (data) => {
    if (data.occupancy_status === 'tenant_occupied') {
      return data.tenant_name && data.tenant_name.length >= 2
    }
    return true
  },
  {
    message: 'Tenant name is required when house is tenant-occupied',
    path: ['tenant_name'],
  }
).refine(
  (data) => {
    if (data.occupancy_status === 'tenant_occupied') {
      return data.tenant_phone && /^[6-9]\d{9}$/.test(data.tenant_phone)
    }
    return true
  },
  {
    message: 'Tenant phone is required when house is tenant-occupied',
    path: ['tenant_phone'],
  }
)

export type CreateHouseInput = z.infer<typeof CreateHouseSchema>

export const UpdateHouseSchema = BaseHouseSchema.partial().extend({
  id: z.string().uuid(),
}).refine(
  (data) => {
    if (data.occupancy_status === 'tenant_occupied') {
      return data.tenant_name && data.tenant_name.length >= 2
    }
    return true
  },
  {
    message: 'Tenant name is required when house is tenant-occupied',
    path: ['tenant_name'],
  }
).refine(
  (data) => {
    if (data.occupancy_status === 'tenant_occupied') {
      return data.tenant_phone && /^[6-9]\d{9}$/.test(data.tenant_phone)
    }
    return true
  },
  {
    message: 'Tenant phone is required when house is tenant-occupied',
    path: ['tenant_phone'],
  }
)

export type UpdateHouseInput = z.infer<typeof UpdateHouseSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Family Member
// ─────────────────────────────────────────────────────────────────────────────

export const CreateFamilyMemberSchema = z.object({
  house_id: z.string().uuid('Invalid house'),
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100),
  relationship: z
    .string()
    .max(50)
    .optional()
    .or(z.literal('')),
  age: z
    .number()
    .int()
    .min(0)
    .max(120)
    .optional()
    .nullable(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  is_primary_contact: z.boolean().default(false),
})

export type CreateFamilyMemberInput = z.infer<typeof CreateFamilyMemberSchema>
