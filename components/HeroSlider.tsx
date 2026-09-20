"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Truck, Boxes, Landmark, type LucideIcon } from "lucide-react";

type Slide = {
  icon: LucideIcon;
  title: string;
  description: string;
  // ctaText/ctaHref yoksa (ör. başvurusu inceleniyor) düğme gösterilmez.
  ctaText?: string;
  ctaHref?: string;
};

// Üç gerçek, uydurulmamış mesaj — kampanya görseli/vitrin verisi olmadığı
// için düz renk yerine katmanlı-daire-arkalı büyük ikonlarla desteklendi.
const SLIDES: Slide[] = [
  {
    icon: Briefcase,
    title: "Firmanıza Özel Fiyatlarla Alışveriş Yapın",
    description: "Kurumsal üyelik başvurusu yaparak size özel indirimli fiyatlardan yararlanın.",
    ctaText: "Üyelik Başvurusu Yap",
    ctaHref: "/hesabim/uyelik-basvurusu",
  },
  {
    icon: Truck,
    title: "Aynı Gün Kargo İmkanı",
    description: "13:30'a kadar verdiğiniz siparişler aynı gün kargoya teslim edilir.",
    ctaText: "Alışverişe Başla",
    ctaHref: "/urunler",
  },
  {
    icon: Boxes,
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
          title: "Şimdi alın, cari hesabınızla ödeyin",
          description: "Başvurunuz inceleniyor. Cari hesap yalnızca yetki tanımlanan kurumsal üyelerimize açıktır.",
        }
      : {
          icon: Landmark,
          title: "Şimdi alın, cari hesabınızla ödeyin",
          description:
            "Yetki tanımlanan kurumsal üyelerimiz siparişlerini cari hesabına işletebilir. Başvurunuz incelenip onaylanır.",
          ctaText: "Kurumsal Üyelik Başvurusu",
          ctaHref: mode === "apply-guest" ? "/uyelik/kayit" : "/hesabim/uyelik-basvurusu",
        };
  return [SLIDES[0], cariSlide, ...SLIDES.slice(1)];
}

export default function HeroSlider({ cariHesapSlide = "hidden" }: { cariHesapSlide?: CariHesapSlideMode }) {
  const [active, setActive] = useState(0);
  const slides = buildSlides(cariHesapSlide);

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[active % slides.length];
  const Icon = slide.icon;

  return (
    <div className="relative flex h-full min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-hover)] px-6 py-7 text-white sm:px-9 sm:py-9">
      <div className="pointer-events-none absolute -top-10 -right-10 flex h-64 w-64 items-center justify-center rounded-full bg-white/[0.06]">
        <div className="flex h-44 w-44 items-center justify-center rounded-full bg-white/[0.08]">
          <Icon className="h-20 w-20 text-white/90" aria-hidden="true" />
        </div>
      </div>

      <div className="relative z-10 max-w-md">
        <h1 className="mb-2.5 text-2xl font-extrabold sm:text-3xl">{slide.title}</h1>
        <p className="mb-6 text-sm text-white/85 sm:text-base">{slide.description}</p>
        {slide.ctaHref && slide.ctaText && (
          <Link
            href={slide.ctaHref}
            className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-brand)] hover:bg-white/90"
          >
            {slide.ctaText}
          </Link>
        )}
      </div>

      <div className="relative z-10 flex gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`${i + 1}. slayt`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${i === active ? "w-7 bg-white" : "w-1.5 bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
