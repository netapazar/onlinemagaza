"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Truck, Boxes, Landmark, type LucideIcon } from "lucide-react";
import ProductCollage, { type CollagePhoto } from "@/components/ProductCollage";

type Slide = {
  icon: LucideIcon;
  title: string;
  description: string;
  // Banner görsel anahtarı (public/banners/<anahtar>.<uzantı>, bkz. lib/bannerImages.ts).
  imageKey: "hero-1" | "hero-cari" | "hero-2" | "hero-3";
  // ctaText/ctaHref yoksa (ör. başvurusu inceleniyor) düğme gösterilmez.
  ctaText?: string;
  ctaHref?: string;
};

// Üç gerçek, uydurulmamış mesaj. Görsel önceliği: (1) public/banners'taki dosya, (2) ürün fotoğraflı kompozisyon,
// (3) ikonlu yedek (ilk hâl).
const SLIDES: Slide[] = [
  {
    icon: Briefcase,
    imageKey: "hero-1",
    title: "Firmanıza Özel Fiyatlarla Alışveriş Yapın",
    description: "Kurumsal üyelik başvurusu yaparak size özel indirimli fiyatlardan yararlanın.",
    ctaText: "Üyelik Başvurusu Yap",
    ctaHref: "/hesabim/uyelik-basvurusu",
  },
  {
    icon: Truck,
    imageKey: "hero-2",
    title: "Aynı Gün Kargo İmkanı",
    description: "13:30'a kadar verdiğiniz siparişler aynı gün kargoya teslim edilir.",
    ctaText: "Alışverişe Başla",
    ctaHref: "/urunler",
  },
  {
    icon: Boxes,
    imageKey: "hero-3",
    title: "Toplu Alımda Avantajlı Tedarik",
    description: "İşletmenizin ofis/kırtasiye ihtiyacını tek seferde, tek adresten karşılayın.",
    ctaText: "Ürünleri İncele",
    ctaHref: "/urunler",
  },
];

const ROTATE_MS = 5500;

// "Şimdi alın, cari hesabınızla ödeyin" slaydı (Grup 4). Cari hesap YALNIZCA yetki tanımlanan
// firmalara açık — metin bunu söylüyor. Onaylı üyelere (yetkisi açık ya da kapalı) gösterilmez;
// başvurusu bekleyene düğme yerine "inceleniyor" bilgisi çıkar.
export type CariHesapSlideMode = "apply-guest" | "apply-account" | "pending" | "hidden";

function buildSlides(mode: CariHesapSlideMode): Slide[] {
  if (mode === "hidden") return SLIDES;
  const cariSlide: Slide =
    mode === "pending"
      ? {
          icon: Landmark,
          imageKey: "hero-cari",
          title: "Şimdi alın, cari hesabınızla ödeyin",
          description: "Başvurunuz inceleniyor. Cari hesap yalnızca yetki tanımlanan kurumsal üyelerimize açıktır.",
        }
      : {
          icon: Landmark,
          imageKey: "hero-cari",
          title: "Şimdi alın, cari hesabınızla ödeyin",
          description:
            "Yetki tanımlanan kurumsal üyelerimiz siparişlerini cari hesabına işletebilir. Başvurunuz incelenip onaylanır.",
          ctaText: "Kurumsal Üyelik Başvurusu",
          ctaHref: mode === "apply-guest" ? "/uyelik/kayit" : "/hesabim/uyelik-basvurusu",
        };
  return [SLIDES[0], cariSlide, ...SLIDES.slice(1)];
}

export default function HeroSlider({
  cariHesapSlide = "hidden",
  photos = [],
  bannerImages = {},
}: {
  cariHesapSlide?: CariHesapSlideMode;
  photos?: CollagePhoto[];
  bannerImages?: Partial<Record<Slide["imageKey"], string>>;
}) {
  const [active, setActive] = useState(0);
  // Geçiş animasyonu YALNIZ slayt değiştikten sonra: ilk slayt sayfa açılışında animasyonsuz, anında görünür — aksi hâlde
  // ilk boyama/LCP (başlık) animasyon süresi kadar geciker ("kullanıcıyı asla bekletme" kuralı).
  const [animate, setAnimate] = useState(false);
  const slides = buildSlides(cariHesapSlide);
  const anim = animate ? "animate-fade-slide" : "";

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimate(true);
      setActive((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const index = active % slides.length;
  const slide = slides[index];
  const Icon = slide.icon;
  const bannerFile = bannerImages[slide.imageKey];

  return (
    <div className="relative flex h-full min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-hover)] px-6 py-7 text-white sm:px-9 sm:py-9">
      {/* Görsel alanı: dosya > ürün kolajı > ikon (yedek). Slayt değişince yumuşakça belirir. */}
      <div key={`visual-${index}`} className={`pointer-events-none absolute inset-0 ${anim}`}>
        {bannerFile ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] items-end justify-end sm:flex" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerFile} alt="" loading={index === 0 ? "eager" : "lazy"} decoding="async" className="animate-float h-[92%] w-full object-contain object-right-bottom" />
          </div>
        ) : photos.length > 0 ? (
          <ProductCollage photos={photos} offset={index} />
        ) : null}
      </div>
      {!bannerFile && photos.length === 0 && (
        <div className="pointer-events-none absolute -top-10 -right-10 flex h-64 w-64 items-center justify-center rounded-full bg-white/[0.06]">
          <div className="animate-float flex h-44 w-44 items-center justify-center rounded-full bg-white/[0.08]">
            <Icon className="h-20 w-20 text-white/90" aria-hidden="true" />
          </div>
        </div>
      )}
      {/* Mobilde (kolaj/dosya gizli) küçük ikon rozeti: metinle çakışmadan köşede */}
      {(bannerFile || photos.length > 0) && (
        <div className="pointer-events-none absolute -right-8 -bottom-8 flex h-32 w-32 items-center justify-center rounded-full bg-white/[0.07] sm:hidden">
          <Icon className="h-10 w-10 text-white/80" aria-hidden="true" />
        </div>
      )}

      <div key={`text-${index}`} className={`${anim} relative z-10 max-w-md sm:max-w-[56%]`}>
        <h1 className="mb-2.5 text-2xl font-extrabold sm:text-3xl">{slide.title}</h1>
        <p className="mb-6 text-sm text-white/85 sm:text-base">{slide.description}</p>
        {slide.ctaHref && slide.ctaText && (
          <Link
            href={slide.ctaHref}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-brand)] transition-all duration-200 hover:bg-white/90 hover:shadow-md active:scale-[0.98]"
          >
            {slide.ctaText}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="relative z-10 flex gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`${i + 1}. slayt`}
            onClick={() => {
              setAnimate(true);
              setActive(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-7 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
