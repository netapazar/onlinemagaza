import Skeleton, { ProductCardSkeleton } from "@/components/Skeleton";

// Anasayfa yüklenirken (sunucu verisi gelene kadar) iskelet: banner + ürün satırı. Yalnız görsel yer tutucu, veri yok.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-content px-4 py-4" role="status" aria-label="Yükleniyor">
      <div className="mb-4 grid gap-3 lg:grid-cols-3 lg:gap-4">
        <Skeleton className="h-52 rounded-2xl sm:h-72 lg:col-span-2" />
        <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
          <Skeleton className="h-28 rounded-2xl lg:h-34 lg:flex-1" />
          <Skeleton className="h-28 rounded-2xl lg:h-34 lg:flex-1" />
        </div>
      </div>
      <Skeleton className="mb-5 h-20 rounded-2xl" />
      <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
