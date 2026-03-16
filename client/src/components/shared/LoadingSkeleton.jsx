// =============================================
// Loading Skeleton — Shimmer placeholder for content
// =============================================

export function PropertyCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="bg-gray-200 aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-3 mt-3">
          <div className="h-3 bg-gray-200 rounded w-8" />
          <div className="h-3 bg-gray-200 rounded w-8" />
          <div className="h-3 bg-gray-200 rounded w-8" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
          <div className="h-3 bg-gray-200 rounded w-12" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function PropertyCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-3">
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
