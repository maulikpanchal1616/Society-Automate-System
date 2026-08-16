'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application Error Boundary caught an error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-50 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-[#2D2A26] mb-3">Something went wrong</h2>
        <p className="text-sm text-[#54504B] mb-6 leading-relaxed">
          We encountered an unexpected issue while loading this page. This could be due to a network error or missing data.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-white text-[#2D2A26] border border-[#2D2A26] py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Reload Page
          </button>
          <button
            onClick={() => reset()}
            className="flex-1 bg-[#2D2A26] text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-black transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
