// =============================================================================
// ROLE TYPES — Centralized role definitions and permission checks
// =============================================================================

import type { UserRole } from './database'

export type { UserRole }

// Role display labels
export const ROLE_LABELS: Record<UserRole, string> = {
  chairman: 'Chairman',
  office_man: 'Office Manager',
  resident: 'Resident',
}

// Route groups per role
export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  chairman: '/admin/dashboard',
  office_man: '/office/dashboard',
  resident: '/resident/dashboard',
}

// Permission helpers — used in server actions for authorization checks
export const ADMIN_ROLES: UserRole[] = ['chairman', 'office_man']

export function isAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export function isChairman(role: UserRole): boolean {
  return role === 'chairman'
}

export function isOfficeMan(role: UserRole): boolean {
  return role === 'office_man'
}

export function isResident(role: UserRole): boolean {
  return role === 'resident'
}

export function canManageResidents(role: UserRole): boolean {
  return isAdmin(role)
}

export function canWaivePenalty(role: UserRole): boolean {
  return isChairman(role)
}

export function canRecordCashPayment(role: UserRole): boolean {
  return isAdmin(role)
}

export function canManageSettings(role: UserRole): boolean {
  return isChairman(role)
}

export function canCreateNotices(role: UserRole): boolean {
  return isAdmin(role)
}

export function canViewAnalytics(role: UserRole): boolean {
  return isAdmin(role)
}

export function canManageExpenses(role: UserRole): boolean {
  return isAdmin(role)
}
