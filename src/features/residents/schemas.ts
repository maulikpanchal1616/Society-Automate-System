// =============================================================================
// RESIDENTS FEATURE — Zod Schemas (reuses/re-exports from society/schemas.ts)
// Kept in residents/ for clear module ownership per TRD §5.3
// =============================================================================

export {
  CreateHouseSchema,
  UpdateHouseSchema,
  CreateFamilyMemberSchema,
} from '@/features/society/schemas'

export type {
  CreateHouseInput,
  UpdateHouseInput,
  CreateFamilyMemberInput,
} from '@/features/society/schemas'
