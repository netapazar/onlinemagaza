"use client";

import { useRef, useState } from "react";
import StoreImage from "@/components/StoreImage";
import ProductPlaceholder from "@/components/ProductPlaceholder";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

// Ürün sayfası galerisi. Birden fazla görselde: ana görselin iki yanında ok düğmeleri (sonda başa döner), klavyede ←/→
// (galeri odaktayken), dokunmatikte yana kaydırma ve "2 / 5" sayacı; alttaki küçük görsellerden seçim de sürer.
export default function ProductGallery({
  images,
  name,
  brandName,
}: {
  images: { id: string; url: string; altText: string | null }[];
  name: string;
  brandName?: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const active = images[activeIndex];
  const coklu = images.length > 1;

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-xl">
        <ProductPlaceholder name={name} brandName={brandName} />
      </div>
    );
  }

  const git = (adim: number) => setActiveIndex((i) => (i + adim + images.length) % images.length);
  const okClass =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md ring-1 ring-black/5 transition hover:bg-white hover:text-[var(--color-brand)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]";

  return (
    <div>
      {/* Ana görsel sayfanın LCP öğesi: ilk görsel için <head>'de preload (eager); sonradan seçilen görseller tembel. */}
      <div
        className="group relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100 outline-none"
        tabIndex={coklu ? 0 : undefined}
        role={coklu ? "region" : undefined}
        aria-roledescription={coklu ? "görsel galerisi" : undefined}
        aria-label={coklu ? `${name} görselleri` : undefined}
        onKeyDown={(e) => {
          if (!coklu) return;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            git(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            git(1);
          }
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const bas = touchStartX.current;
          touchStartX.current = null;
          if (!coklu || bas === null) return;
          const fark = e.changedTouches[0].clientX - bas;
          if (Math.abs(fark) > 40) git(fark < 0 ? 1 : -1);
        }}
      >
        <StoreImage
          key={active.id}
          src={active.url}
          alt={active.altText ?? name}
          sizes="(max-width: 640px) 100vw, 460px"
          preload={activeIndex === 0}
          eager={activeIndex !== 0}
          className="object-cover"
        />
        {coklu && (
          <>
            <button type="button" onClick={() => git(-1)} aria-label="Önceki görsel" className={`${okClass} left-2`}>
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => git(1)} aria-label="Sonraki görsel" className={`${okClass} right-2`}>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <span className="absolute right-2 bottom-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {coklu && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`${i + 1}. görsel`}
              aria-current={i === activeIndex ? "true" : undefined}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === activeIndex ? "border-[var(--color-brand)]" : "border-transparent"
              }`}
            >
              <StoreImage src={img.url} alt="" sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
