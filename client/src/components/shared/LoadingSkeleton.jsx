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

export function EmergencyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 w-2/3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 bg-gray-100 rounded-lg p-2.5 h-10 w-full" />
    </div>
  );
}

export function EssentialsListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex gap-2 pt-2">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-72" />
      ))}
    </div>
  );
}