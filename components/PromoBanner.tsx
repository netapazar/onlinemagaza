import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

// Sağdaki kampanya banner'ı. Görsel önceliği: (1) public/banners dosyası ya da (2) ürün fotoğrafı (küçük, hafif eğimli,
// beyaz çerçeveli kart), (3) hiçbiri yoksa ilk hâldeki ikonlu daire. Mobilde (dar banner) yalnız ikonlu daire.
export default function PromoBanner({
  icon: Icon,
  title,
  description,
  href,
  className = "",
  image = null,
  imageIsPhoto = false,
}: {
  icon: LucideIcon;
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
      className={`group relative flex flex-1 items-center justify-between gap-3 overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      <div className="relative z-10 max-w-[62%]">
        <h3 className="mb-1 text-base leading-tight font-bold text-white">{title}</h3>
        <p className="mb-2 text-xs leading-snug text-white/85">{description}</p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
          İncele
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>

      {image ? (
        <div className="pointer-events-none absolute top-1/2 right-4 hidden h-[6.5rem] w-[6.5rem] -translate-y-1/2 sm:block" aria-hidden="true">
          {imageIsPhoto ? (
            <div className="animate-float h-full w-full rotate-[6deg] overflow-hidden rounded-xl bg-white p-1 shadow-lg shadow-black/25 transition-transform duration-300 group-hover:rotate-[3deg] group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full rounded-lg object-cover" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" loading="lazy" decoding="async" className="animate-float h-full w-full object-contain" />
          )}
        </div>
      ) : null}

      <div className={`pointer-events-none absolute -right-6 -bottom-6 flex h-32 w-32 items-center justify-center rounded-full bg-white/10 ${image ? "sm:hidden" : ""}`}>
        <div className="animate-float flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white/15">
          <Icon className="h-10 w-10 text-white" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
