import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import GecGorsel from "@/components/GecGorsel";

// Hero'nun yanındaki kısayol kartı. Görsel önceliği: (1) public/banners dosyası ya da (2) ürün fotoğrafı (küçük, hafif eğimli,
// beyaz çerçeveli kart); hiçbiri yoksa görsel yok.
export default function PromoBanner({
  title,
  description,
  href,
  className = "",
  image = null,
  imageIsPhoto = false,
}: {
  title: string;
  description: string;
  href: string;
  className?: string;
  image?: string | null;
  // true: ürün fotoğrafı (çerçeveli kart olarak); false: banner dosyası (kırpmadan, saydam arka planlı olabilir)
  imageIsPhoto?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-1 flex-col justify-between gap-2 overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:gap-3 ${className}`}
    >
      {/* Telefonda başlık tam genişlikte (2026-10-13: yanında fotoğrafa yer ayrılınca "Yeni Eklenenler" kesiliyordu);
          "İncele" ve fotoğraf altta tek satırda. Geniş ekranda metin solda, fotoğraf sağda ortalı. */}
      <div className="relative z-10 sm:max-w-[56%] md:max-w-[62%]">
        <h3 className="mb-1 text-base leading-tight font-bold text-white">{title}</h3>
        {/* Dar mobil sütununda açıklama 6 satıra taşıyordu — mobilde yalnız başlık + "İncele" */}
        <p className="mb-2 hidden text-xs leading-snug text-white/85 sm:block">{description}</p>
        <Incele className="hidden sm:inline-flex" />
      </div>

      <div className="flex items-end justify-between gap-2 sm:contents">
        <Incele className="inline-flex sm:hidden" />
        {/* Gerçek ürün fotoğrafı her ekranda (DESIGN.md Yapma 3). Dar ekranda sayfa yüklemesinden sonra istenir (GecGorsel).
            Görsel yoksa boş. */}
        {image && (
          <div
            className="pointer-events-none relative h-12 w-12 shrink-0 sm:absolute sm:top-1/2 sm:right-4 sm:h-[6.5rem] sm:w-[6.5rem] sm:-translate-y-1/2"
            aria-hidden="true"
          >
            {imageIsPhoto ? (
              <div className="h-full w-full rotate-[6deg] overflow-hidden rounded-xl bg-white p-1 shadow-lg shadow-black/25 transition-transform duration-300 group-hover:rotate-[3deg] group-hover:scale-105">
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-neutral-100">
                  <GecGorsel src={image} sizes="(min-width: 640px) 104px, 48px" className="rounded-lg object-cover" />
                </div>
              </div>
            ) : (
              // Banner dosyası (public/banners) yerel statik dosya: olduğu gibi (saydam PNG/WebP olabilir)
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function Incele({ className }: { className: string }) {
  return (
    <span className={`items-center gap-1 text-xs font-semibold text-white ${className}`}>
      İncele
      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
    </span>
  );
}
