import Skeleton, { ProductCardSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-content px-4 py-4" role="status" aria-label="Yükleniyor">
      <Skeleton className="mb-4 h-7 w-48" />
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <Skeleton className="hidden h-72 rounded-2xl md:block" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
