// =============================================================================
// LOADING STATE — /admin
// Premium animated skeleton loader for admin routes (Light Theme)
// =============================================================================

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="h-8 w-48 bg-[#E6D5B8]/60 rounded-lg"></div>
        <div className="h-4 w-64 bg-[#E6D5B8]/40 rounded-lg"></div>
      </div>

      {/* Main Content Skeleton Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <div className="h-32 bg-white rounded-xl shadow-sm border border-[#E6D5B8]/40"></div>
        <div className="h-32 bg-white rounded-xl shadow-sm border border-[#E6D5B8]/40"></div>
        <div className="h-32 bg-white rounded-xl shadow-sm border border-[#E6D5B8]/40"></div>
      </div>

      {/* Large Data Table/Chart Skeleton */}
      <div className="h-96 w-full bg-white rounded-xl shadow-sm border border-[#E6D5B8]/40 mt-6"></div>
    </div>
  )
}
