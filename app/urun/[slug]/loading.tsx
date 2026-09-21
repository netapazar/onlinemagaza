import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6" role="status" aria-label="Yükleniyor">
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-8 sm:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
