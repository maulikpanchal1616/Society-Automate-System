'use client'

// =============================================================================
// SIGN OUT BUTTON — used in all sidebar footers
// =============================================================================

import { useTransition } from 'react'
import { signOut } from '@/features/auth/actions'

interface Props { compact?: boolean }

export default function SignOutButton({ compact }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="transition-colors p-1"
        style={{ color: '#8C8680', fontSize: '0.75rem' }}
        title="Sign out"
      >
        {isPending ? '...' : '↩'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="btn btn-secondary w-full text-sm py-2"
    >
      {isPending ? (
        <><span className="spinner spinner-brand" /> Signing out...</>
      ) : (
        <>↩ Sign Out</>
      )}
    </button>
  )
}
