// =============================================================================
// NOT FOUND — office route group
// =============================================================================

import Link from 'next/link'

export default function OfficeNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
      <p className="text-6xl mb-4">🔍</p>
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-2">Page Not Found</h1>
      <p className="text-slate-400 mb-6 text-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/office/dashboard" className="btn btn-primary text-sm">
        ← Back to Dashboard
      </Link>
    </div>
  )
}
