'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error Boundary caught an error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F1EB] flex items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-[#2D2A26] mb-3">Critical Application Error</h2>
          <p className="text-sm text-[#54504B] mb-6 leading-relaxed">
            A fatal error occurred at the layout level. This might be due to a network failure or an unexpected bug.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-[#2D2A26] text-white py-3 px-4 rounded-xl font-semibold hover:bg-black transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
