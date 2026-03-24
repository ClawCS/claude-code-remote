export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="p-4 pb-2">
        <div className="aspect-square skeleton" />
      </div>
      <div className="p-4 pt-2 space-y-2">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-20" />
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="bg-light py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl space-y-4">
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-12 w-1/2" />
          <div className="skeleton h-5 w-full mt-4" />
          <div className="skeleton h-5 w-2/3" />
          <div className="flex gap-4 mt-6">
            <div className="skeleton h-12 w-40 rounded-lg" />
            <div className="skeleton h-12 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
