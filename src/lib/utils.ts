// =============================================================================
// UTILITY FUNCTIONS — Common helpers used across the application
// =============================================================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

// ─────────────────────────────────────────────────────────────────────────────
// cn — Class name merger (clsx + tailwind-merge)
// Prevents Tailwind class conflicts from conditional class application
// ─────────────────────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency formatting — Indian Rupee
// ─────────────────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─────────────────────────────────────────────────────────────────────────────
// Date formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'dd MMM yyyy')
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'dd MMM yyyy, hh:mm a')
}

export function formatBillingMonth(dateString: string): string {
  return format(parseISO(dateString), 'MMMM yyyy')
}

// Returns the first day of a given month as ISO string: "2025-06-01"
export function getBillingMonthDate(year: number, month: number): string {
  return new Date(year, month - 1, 1).toISOString().split('T')[0]
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone number formatting (Indian format)
// ─────────────────────────────────────────────────────────────────────────────

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt number generator
// Format: RCPT-YYYYMM-XXXXX (e.g. RCPT-202506-00042)
// ─────────────────────────────────────────────────────────────────────────────

export function generateReceiptNumber(sequenceNumber: number): string {
  const now = new Date()
  const yearMonth = format(now, 'yyyyMM')
  const sequence = String(sequenceNumber).padStart(5, '0')
  return `RCPT-${yearMonth}-${sequence}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill status helpers
// ─────────────────────────────────────────────────────────────────────────────

import type { BillStatus } from '@/types/database'

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  overdue: 'Overdue',
  paid: 'Paid',
  waived: 'Waived',
  cancelled: 'Cancelled',
}

export const BILL_STATUS_COLORS: Record<BillStatus, string> = {
  draft: 'text-slate-400 bg-slate-400/10',
  pending: 'text-amber-400 bg-amber-400/10',
  overdue: 'text-red-400 bg-red-400/10',
  paid: 'text-emerald-400 bg-emerald-400/10',
  waived: 'text-purple-400 bg-purple-400/10',
  cancelled: 'text-slate-500 bg-slate-500/10',
}

// ─────────────────────────────────────────────────────────────────────────────
// Truncate text
// ─────────────────────────────────────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
