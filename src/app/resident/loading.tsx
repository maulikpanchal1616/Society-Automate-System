// =============================================================================
// LOADING STATE — /resident
// Premium animated skeleton loader for resident routes
// =============================================================================

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="h-8 w-48 bg-slate-800/50 rounded-lg backdrop-blur-sm border border-slate-700/50"></div>
        <div className="h-4 w-64 bg-slate-800/30 rounded-lg backdrop-blur-sm"></div>
      </div>

      {/* Main Content Skeleton Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <div className="h-32 bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-700/30"></div>
        <div className="h-32 bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-700/30"></div>
        <div className="h-32 bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-700/30"></div>
      </div>

      {/* Large Data Table/Chart Skeleton */}
      <div className="h-96 w-full bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-700/30 mt-6"></div>
    </div>
  )
}
