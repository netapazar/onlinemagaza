"use client";

import { useState } from "react";
import StoreImage from "@/components/StoreImage";

export default function ProductGallery({
  images,
  name,
}: {
  images: { id: string; url: string; altText: string | null }[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-400">
        Görsel yok
      </div>
    );
  }

  return (
    <div>
      {/* Ana görsel sayfanın LCP öğesi: ilk görsel için <head>'de preload (eager); sonradan seçilen görseller tembel. */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100">
        <StoreImage
          key={active.id}
          src={active.url}
          alt={active.altText ?? name}
          sizes="(max-width: 640px) 100vw, 460px"
          preload={activeIndex === 0}
          eager={activeIndex !== 0}
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
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
