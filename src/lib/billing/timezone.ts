// =============================================================================
// IST TIMEZONE UTILITIES — src/lib/billing/timezone.ts
// Centralized timezone utilities to run billing calendar calculations in IST.
// Enforces that late fees begin exactly on the 11th of the month, IST.
// =============================================================================

/**
 * Gets the current date and time formatted in Indian Standard Time (IST)
 * Returns a string format: YYYY-MM-DD
 */
export function getCurrentISTDateString(): string {
  const now = new Date()
  // Format now using Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const parts = formatter.formatToParts(now)
  const day = parts.find(p => p.type === 'day')?.value || '01'
  const month = parts.find(p => p.type === 'month')?.value || '01'
  const year = parts.find(p => p.type === 'year')?.value || '2025'
  
  return `${year}-${month}-${day}`
}

/**
 * Gets the full IST timestamp as a string
 */
export function getCurrentISTString(): string {
  return new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
}

/**
 * Parses an ISO date string (YYYY-MM-DD or full timestamp) and returns a clean date string
 */
export function parseCleanDateString(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const parts = formatter.formatToParts(d)
  const day = parts.find(p => p.type === 'day')?.value || '01'
  const month = parts.find(p => p.type === 'month')?.value || '01'
  const year = parts.find(p => p.type === 'year')?.value || '2025'
  return `${year}-${month}-${day}`
}

/**
 * Generates the due date string (paymentWindowEnd day of the NEXT month) in IST based on the billing month.
 * billingMonth: '2026-04-01' -> returns '2026-05-15' (if paymentWindowEnd is 15)
 */
export function calculateISTDueDate(billingMonthStr: string, paymentWindowEnd: number = 10): string {
  // billingMonthStr is in format YYYY-MM-DD (typically first of month)
  const [yearStr, monthStr] = billingMonthStr.split('-')
  let year = parseInt(yearStr)
  let month = parseInt(monthStr)

  // Bills are due in the following month
  month += 1
  if (month > 12) {
    month = 1
    year += 1
  }

  const paddedMonth = String(month).padStart(2, '0')
  const paddedDay = String(paymentWindowEnd).padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}`
}

/**
 * Calculates number of calendar days between two IST date strings (YYYY-MM-DD).
 * Returns positive if dateB is after dateA, negative if dateB is before dateA.
 */
export function getISTDaysDifference(startDateStr: string, endDateStr: string): number {
  const start = new Date(`${startDateStr}T00:00:00+05:30`)
  const end = new Date(`${endDateStr}T00:00:00+05:30`)
  
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  return diffDays;
}
