// =============================================================================
// BILLING CALCULATOR — src/lib/billing/calculator.ts
// Pure, deterministic, side-effect-free functions for billing math.
// Ensures identical monetary rounding and timezone evaluation everywhere.
// =============================================================================

import {
  getCurrentISTDateString,
  calculateISTDueDate,
  getISTDaysDifference,
  parseCleanDateString
} from './timezone'

/**
 * Rounds a number to exactly 2 decimal places to prevent floating-point drift.
 * E.g., 850.0000000004 -> 850.00
 */
export function roundMonetary(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Calculates the water bill based on units consumed and price per unit.
 */
export function calculateWaterBillAmount(units: number, pricePerUnit: number): number {
  if (units < 0 || pricePerUnit < 0) return 0.00
  return roundMonetary(units * pricePerUnit)
}

/**
 * Calculates dynamic penalty based on the billing month, waiver status, and penalty rate.
 * Returns 0 if penalty is waived or date is before the due date (10th of the month).
 */
export function calculateDynamicPenalty(
  billingMonthStr: string,
  penaltyPerDay: number,
  paymentWindowEnd: number,
  isWaived: boolean,
  asOfDateStr?: string
): number {
  if (isWaived) return 0.00

  const cleanBillingMonth = parseCleanDateString(billingMonthStr)
  const dueDateStr = calculateISTDueDate(cleanBillingMonth, paymentWindowEnd)
  const todayStr = asOfDateStr || getCurrentISTDateString()

  // Cap penalty accrual to the end of the specific billing month
  const [year, month] = cleanBillingMonth.split('-')
  const endOfMonthDate = new Date(Number(year), Number(month), 0)
  const endOfMonthDay = String(endOfMonthDate.getDate()).padStart(2, '0')
  const endOfMonthStr = `${year}-${month}-${endOfMonthDay}`

  const effectiveEndDateStr = todayStr > endOfMonthStr ? endOfMonthStr : todayStr

  const daysLate = getISTDaysDifference(dueDateStr, effectiveEndDateStr)

  if (daysLate <= 0) {
    return 0.00
  }

  return roundMonetary(daysLate * penaltyPerDay)
}

/**
 * Calculates the final payable grand total, preventing float drift.
 */
export function calculateGrandTotal(
  maintenance: number,
  waterBill: number,
  penalty: number
): number {
  return roundMonetary(maintenance + waterBill + penalty)
}
