import React from 'react'

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse max-w-6xl mx-auto space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-3 w-full sm:w-1/2">
          <div className="h-8 bg-black/5 rounded-md w-3/4"></div>
          <div className="h-4 bg-black/5 rounded-md w-1/2"></div>
        </div>
      </div>

      {/* Main KPI Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-6 rounded-2xl h-32 flex flex-col justify-center">
            <div className="h-4 bg-black/5 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-black/5 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Secondary KPI Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-4 rounded-xl h-20 flex flex-col justify-center">
            <div className="h-3 bg-black/5 rounded w-2/3 mb-2"></div>
            <div className="h-5 bg-black/5 rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl h-[400px]"></div>
        <div className="glass-card rounded-2xl h-[400px] p-6 flex flex-col justify-center space-y-8">
          <div className="h-4 bg-black/5 rounded w-1/2 mx-auto"></div>
          <div className="space-y-6 w-full">
            <div className="space-y-2">
              <div className="h-3 bg-black/5 rounded w-full"></div>
              <div className="h-2 bg-black/10 rounded-full w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-black/5 rounded w-full"></div>
              <div className="h-2 bg-black/10 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
