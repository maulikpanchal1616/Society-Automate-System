// =============================================================================
// NOT FOUND — admin route group
// =============================================================================

import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <div className="w-20 h-20 bg-[#F5F1EB] rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">🔍</span>
      </div>
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        The page you are looking for doesn't exist or you don't have permission to view it.
      </p>
      <Link href="/admin/dashboard" className="btn btn-primary text-sm">
        ← Back to Dashboard
      </Link>
    </div>
  )
}
