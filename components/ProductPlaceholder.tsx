import { Package } from "lucide-react";

// Görseli olmayan ürünler için yer tutucu. Veritabanına kaydedilmez: yalnız ürünün
// kapak görseli yokken çizilir, gerçek görsel eklendiği an kendiliğinden yerini ona bırakır.
// Tamamen HTML/CSS (resim dosyası değil) — kırık resim veya boş kutu oluşmaz.
//  - "full": ürün kartı ve detay galerisi (kare alanı doldurur; marka + ürün adı yazılı)
//  - "compact": liste satırı (küçük; ikon + kısaltılmış ad)
//  - "icon": sepet / arama önerisi küçük kareleri (yalnız ikon)
export default function ProductPlaceholder({
  name,
  brandName,
  variant = "full",
}: {
  name: string;
  brandName?: string | null;
  variant?: "full" | "compact" | "icon";
}) {
  const label = brandName ? `${brandName} ${name}` : name;

  if (variant === "icon") {
    return (
      <div
        role="img"
        aria-label={label}
        className="flex h-full w-full items-center justify-center bg-[var(--color-brand-50)] text-[var(--color-brand-400)]"
      >
        <Package className="h-1/2 w-1/2" strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  const compact = variant === "compact";
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-brand-100)] text-center ${
        compact ? "gap-1 p-2" : "gap-2 p-4 sm:gap-3 sm:p-6"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-white/80 text-[var(--color-brand-600)] shadow-sm ${
          compact ? "h-8 w-8" : "h-12 w-12 sm:h-16 sm:w-16"
        }`}
      >
        <Package className={compact ? "h-4 w-4" : "h-6 w-6 sm:h-8 sm:w-8"} strokeWidth={1.5} aria-hidden="true" />
      </span>
      {brandName && !compact && (
        <span className="text-[10px] font-semibold tracking-wider text-[var(--color-brand-600)] uppercase sm:text-xs">
          {brandName}
        </span>
      )}
      <span
        className={`font-medium text-[var(--color-brand-800)] ${
          compact ? "line-clamp-2 text-[9px] leading-tight" : "line-clamp-3 text-xs leading-snug sm:text-sm"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
