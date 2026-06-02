import { startOfMonth, subMonths, format } from 'date-fns'

/**
 * Normalizes any date string to the first day of the month (YYYY-MM-01).
 * This is the standard format used in the database for `billing_month`.
 */
export function normalizeToFirstOfMonth(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return format(startOfMonth(date), 'yyyy-MM-01')
}

/**
 * Returns the current active billing month based on the server's current date.
 * Example: If today is June 15, 2026, returns '2026-06-01'.
 */
export function getActiveBillingMonth(): string {
  return normalizeToFirstOfMonth(new Date())
}

/**
 * Returns the previous chronological billing month.
 * Useful for finding previous water meter readings.
 */
export function getPreviousBillingMonth(currentMonth: string): string {
  const currentDate = new Date(currentMonth)
  return normalizeToFirstOfMonth(subMonths(currentDate, 1))
}

/**
 * Helper to check if a given month is the active month or in the past.
 */
export function isHistoricalMonth(monthStr: string): boolean {
  const activeMonth = getActiveBillingMonth()
  return new Date(monthStr) < new Date(activeMonth)
}
