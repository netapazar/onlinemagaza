"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Slide = {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
};

// Şu an kampanya görseli/vitrin verisi yok — gerçek, uydurulmamış iki mesaj
// (genel değer önerisi + kurumsal üyelik çağrısı) sabit olarak tanımlı.
// İleride kampanya görselleri eklenince bu dizi genişletilebilir, bileşenin
// kendisi zaten çoklu slayda göre tasarlandı.
const SLIDES: Slide[] = [
  {
    title: "İşletmenizin Tüm Tedarik İhtiyacı Tek Adreste",
    description: "Kaliteli ürünler, hızlı teslimat ve üyelere özel fiyatlarla Tedarikhane yanınızda.",
    ctaText: "Alışverişe Başla",
    ctaHref: "#tum-urunler",
  },
  {
    title: "Firmanıza Özel Fiyatlarla Alışveriş Yapın",
    description: "Kurumsal üyelik başvurusu yaparak size özel indirimli fiyatlardan yararlanın.",
    ctaText: "Üyelik Başvurusu Yap",
    ctaHref: "/hesabim/uyelik-basvurusu",
  },
];

const ROTATE_MS = 5500;

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const multiple = SLIDES.length > 1;

  useEffect(() => {
    if (!multiple) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [multiple]);

  const slide = SLIDES[active];

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-hover)] px-5 py-8 text-white sm:px-8 sm:py-10">
      <h1 className="mb-2 max-w-lg text-xl font-semibold sm:text-2xl">{slide.title}</h1>
      <p className="mb-5 max-w-md text-sm text-white/85">{slide.description}</p>
      <Link
        href={slide.ctaHref}
        className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand)] hover:bg-white/90"
      >
        {slide.ctaText}
      </Link>

      {multiple && (
        <div className="mt-6 flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`${i + 1}. slayt`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
