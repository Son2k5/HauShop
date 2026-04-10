export default function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 animate-skeleton">
      {/* Image */}
      <div className="w-full bg-gray-100 animate-skeleton" style={{ height: 320 }} />
      {/* Body */}
      <div className="px-5 pt-4 pb-5 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/3 animate-skeleton" />
        <div className="h-5 bg-gray-100 rounded w-3/4 animate-skeleton" />
        <div className="h-3 bg-gray-100 rounded w-1/2 animate-skeleton" />
        <div className="h-6 bg-gray-100 rounded w-1/3 animate-skeleton" />
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="h-11 bg-gray-100 rounded animate-skeleton" />
          <div className="h-11 bg-gray-100 rounded animate-skeleton" />
        </div>
      </div>
    </div>
  );
}
 