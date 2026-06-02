'use server'

// =============================================================================
// AUDIT LOGGER — lib/audit/logger.ts
// Writes to audit_logs using service role (bypasses RLS intentionally).
// Called from server actions after every significant mutation.
// RLS on audit_logs: SELECT for Chairman only; INSERT via service role only.
// =============================================================================

import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { AuditActionType, UserRole } from '@/types/database'
import type { Json } from '@/types/database'

interface AuditLogParams {
  societyId: string
  actorId: string
  actorRole: UserRole
  actionType: AuditActionType
  entityType: string
  entityId?: string
  previousValue?: Json
  newValue?: Json
}

// ─────────────────────────────────────────────────────────────────────────────
// writeAuditLog — non-throwing, fire-and-forget style
// Audit failure must never break the primary operation.
// Errors are logged server-side only.
// ─────────────────────────────────────────────────────────────────────────────

export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const serviceClient = createSupabaseServiceClient()

    const { error } = await serviceClient.from('audit_logs').insert({
      society_id: params.societyId,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      previous_value: params.previousValue ?? null,
      new_value: params.newValue ?? null,
    })

    if (error) {
      console.error('[AuditLog] Insert failed:', error.message, {
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
      })
    }
  } catch (err) {
    // Audit failure must not break the calling server action
    console.error('[AuditLog] Unexpected error:', err)
  }
}
