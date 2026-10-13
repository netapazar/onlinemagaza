"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import ProductCollage, { type CollagePhoto } from "@/components/ProductCollage";
import GecGorsel from "@/components/GecGorsel";

type Slide = {
  title: string;
  description: string;
  // Banner görsel anahtarı (public/banners/<anahtar>.<uzantı>, bkz. lib/bannerImages.ts).
  imageKey: "hero-1" | "hero-cari" | "hero-2" | "hero-3";
  // ctaText/ctaHref yoksa (ör. başvurusu inceleniyor) düğme gösterilmez.
  ctaText?: string;
  ctaHref?: string;
};

// Gerçek, uydurulmamış mesajlar. Görsel önceliği: (1) public/banners'taki dosya, (2) ürün fotoğraflı kompozisyon,
// görsel yoksa alan boş (süs dairesi/ikon yok, DESIGN.md Yapma 3). Üyelik slaydı duruma göre buildSlides'ta eklenir.
const SLIDES: Slide[] = [
  {
    imageKey: "hero-2",
    title: "Aynı Gün Kargo İmkanı",
    description: "13:30'a kadar verdiğiniz siparişler aynı gün kargoya teslim edilir.",
    ctaText: "Alışverişe Başla",
    ctaHref: "/urunler",
  },
  {
    imageKey: "hero-3",
    title: "Toplu Alımda Avantajlı Tedarik",
    description: "İşletmenizin ofis/kırtasiye ihtiyacını tek seferde, tek adresten karşılayın.",
    ctaText: "Ürünleri İncele",
    ctaHref: "/urunler",
  },
];

const ROTATE_MS = 5500;

const EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
// Soldan sağa: metin bölgesi tam teal, ürünlere doğru açılır.
const HERO_FADE =
  "linear-gradient(90deg, var(--color-brand) 0%, var(--color-brand) 46%, color-mix(in srgb, var(--color-brand) 70%, transparent) 56%, transparent 68%)";

// Ana sayfanın TEK büyük üyelik mesajı bu slayttır (DESIGN.md / Üyelik mesajı, 2026-10-13): eskiden ayrı "Firmanıza özel
// fiyat" ve "cari hesapla ödeyin" slaytları + yan kartlar + avantaj şeridi aynı çağrıyı tekrarlıyordu; ikisi tek slaytta
// birleşti. Cari hesap YALNIZCA yetki tanımlanan firmalara açık — metin bunu söylüyor. Onaylı üyeye gösterilmez;
// başvurusu bekleyene düğme yerine durum bilgisi çıkar.
export type CariHesapSlideMode = "apply-guest" | "apply-account" | "pending" | "hidden";

function buildSlides(mode: CariHesapSlideMode): Slide[] {
  if (mode === "hidden") return SLIDES;
  const uyelikSlide: Slide =
    mode === "pending"
      ? {
          imageKey: "hero-cari",
          title: "Kurumsal üyelik başvurunuz inceleniyor",
          description: "Onaylandığında firmanıza tanımlanan indirim fiyatlara otomatik yansır; cari hesap yetkisi ayrıca tanımlanır.",
        }
      : {
          imageKey: "hero-1",
          title: "Firmanıza Özel Fiyatlarla Alışveriş Yapın",
          description:
            "Onaylanan firmaya tanımlanan indirim fiyatlara otomatik yansır; cari hesap yetkisi verilen firmalar siparişini cari hesabına işletebilir.",
          ctaText: "Kurumsal Üyelik Başvurusu",
          ctaHref: mode === "apply-guest" ? "/uyelik/kayit" : "/hesabim/uyelik-basvurusu",
        };
  return [uyelikSlide, ...SLIDES];
}

export default function HeroSlider({
  cariHesapSlide = "hidden",
  photos = [],
  bannerImages = {},
  backgroundPhoto = null,
}: {
  cariHesapSlide?: CariHesapSlideMode;
  photos?: CollagePhoto[];
  bannerImages?: Partial<Record<Slide["imageKey"], string>>;
  /** Tüm slaytların ortak arka plan fotoğrafı (public/banners/hero-arka.*); varsa slayt görseli ve kolaj çizilmez. */
  backgroundPhoto?: string | null;
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
  const bannerFile = backgroundPhoto ? undefined : bannerImages[slide.imageKey];
  const showCollage = !backgroundPhoto && photos.length > 0;

  return (
    <div className="relative flex h-full min-h-[280px] flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-hover)] px-6 py-7 text-white sm:px-9 sm:py-9">
      {/* Ortak arka plan fotoğrafı yalnız sm ve üstünde: <source media> sayesinde mobil tarayıcı dosyayı hiç İNDİRMEZ (yedek img boş
          GIF). Kutu genişliği 656–933 px arasında değişir; fotoğraf sağa yaslı kırpılır (ürünler sağda). Soldan teal geçiş beyaz
          metni okunur kılar — slayt değişince yeniden çizilmez, sabit durur. */}
      {backgroundPhoto && (
        <>
          <picture className="pointer-events-none absolute inset-0 hidden sm:block">
            <source media="(min-width: 640px)" srcSet={backgroundPhoto} />
            <img src={EMPTY_GIF} alt="" decoding="async" fetchPriority="high" className="h-full w-full object-cover object-right" />
          </picture>
          <div className="pointer-events-none absolute inset-0 hidden sm:block" style={{ background: HERO_FADE }} aria-hidden="true" />
        </>
      )}
      {/* Görsel alanı: dosya > ürün kolajı > ikon (yedek). Slayt değişince yumuşakça belirir. */}
      <div key={`visual-${index}`} className={`pointer-events-none absolute inset-0 ${anim}`}>
        {bannerFile ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] items-end justify-end sm:flex" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerFile} alt="" loading={index === 0 ? "eager" : "lazy"} decoding="async" className="h-[92%] w-full object-contain object-right-bottom" />
          </div>
        ) : showCollage ? (
          <ProductCollage photos={photos} offset={index} />
        ) : null}
      </div>
      {/* 2026-10-13 (DESIGN.md Yapma 3): fotoğraf yerine çizilen yarı saydam daireler + ikon kaldırıldı. Görsel yoksa alan boş
          kalır; mobilde altta gerçek ürün fotoğrafları (bkz. slayt noktalarının yanı). */}

      <div key={`text-${index}`} className={`${anim} relative z-10 max-w-md sm:max-w-[56%]`}>
        {/* lg–xl arasında (1024–1279 px) kutu 656 px'e daralır: başlık bir kademe küçük, üç satıra taşmasın */}
        <h1 className="mb-2.5 text-2xl font-extrabold sm:text-3xl lg:text-[1.625rem] xl:text-3xl">{slide.title}</h1>
        <p className="mb-6 text-sm text-white/85 sm:text-base">{slide.description}</p>
        {slide.ctaHref && slide.ctaText && (
          <Link
            href={slide.ctaHref}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-brand)] transition-all duration-200 hover:bg-white/90 hover:shadow-md active:scale-[0.98]"
          >
            {slide.ctaText}
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
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
        {/* Mobil: geniş ekrandaki fotoğraf/kolaj gizli olduğundan, gerçek ürün fotoğrafları küçük beyaz çerçevede (en çok 3).
            Sayfa yüklemesi bittikten sonra istenir (GecGorsel) — mobil tam yükleme süresine eklenmez. */}
        {photos.length > 0 && (
          <div className="flex gap-2 sm:hidden" aria-hidden="true">
            {photos.slice(0, 3).map((p) => (
              <div key={p.url} className="h-12 w-12 overflow-hidden rounded-lg bg-white p-0.5 shadow-sm">
                <div className="relative h-full w-full overflow-hidden rounded-md bg-neutral-100">
                  <GecGorsel src={p.url} sizes="48px" className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
