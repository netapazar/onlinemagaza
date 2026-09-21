// İskelet kutu (yükleniyor durumu): hafif parıltı efekti globals.css'te (.skeleton). Erişilebilirlik: dekoratif.
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-2.5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
