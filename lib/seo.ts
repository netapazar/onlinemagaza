import type { Metadata } from "next";

// Ürün sayfası için sayfa başlığı/meta açıklaması — CRM'de elle girilmişse
// (Product.seoTitle/seoDescription) aynen kullanılır, boşsa ürün adı/kısa
// açıklamadan üretilir (fiyat hesaplamasındaki nullable-override kuralıyla aynı desen).
// CRM'deki başlıkların bir kısmında marka eki var, bir kısmında yok: yoksa eklenir.
export function resolveSeoTitle(product: { name: string; seoTitle?: string | null }): string {
  const baslik = product.seoTitle?.trim() || product.name;
  return /tedarikhane/i.test(baslik) ? baslik : `${baslik} | Tedarikhane`;
}

export function resolveSeoDescription(product: {
  shortDescription?: string | null;
  description?: string | null;
  seoDescription?: string | null;
}): string {
  const fallback = product.shortDescription?.trim() || product.description?.trim() || "Tedarikhane — Online Mağaza";
  return (product.seoDescription?.trim() || fallback).slice(0, 160);
}

// Sitenin asıl adresi: çıplak alan adı (tedarikhane.com) buraya 308 ile yönlenir — robots.txt ve sitemap bu adresi kullanır.
export const SITE_URL = "https://www.tedarikhane.com";

// Ürün listesinde (/urunler) "filtre" sayılan parametreler (2026-10-12, bot tarama yükü — GPTBot vb. marka/sıralama
// birleşimlerinde sonsuz URL uzayında dolaşıyordu): bunlardan biri varsa sayfa noindex (app/urunler/page.tsx) ve robots.txt'de
// yasak (app/robots.ts). Kategori (kategori) ve sayfa (sayfa) parametreleri filtre DEĞİL — taranır ve dizinlenir.
export const FILTRE_PARAMETRELERI = ["marka", "q", "min", "max", "sirala", "gorunum"] as const;

// Sayfa başlığı, açıklaması, canonical ve paylaşım önizlemesi (Open Graph / X) tek yerden (2026-10-13). Next'in metadata
// birleştirmesi openGraph nesnesini sayfada TAMAMEN değiştirdiği için her sayfa site adı, dil ve görseli de buradan alır.
// Görsel verilmezse varsayılan paylaşım görseli (public/og-varsayilan.png: logo + "Ofis malzemesi ve kırtasiye").
export const MARKA = "Tedarikhane";
export const VARSAYILAN_PAYLASIM_GORSELI = { url: `${SITE_URL}/og-varsayilan.png`, width: 1200, height: 630, alt: MARKA };

export function sayfaMetasi({
  baslik,
  aciklama,
  yol,
  gorseller,
  paylasimBasligi,
}: {
  /** <title> — marka eki dahil, tam metin. */
  baslik: string;
  aciklama: string;
  /** Canonical yol, ör. "/sss" ya da "/urunler?kategori=…" */
  yol: string;
  gorseller?: { url: string; alt?: string }[];
  /** Paylaşım kartı başlığı (verilmezse <title>). */
  paylasimBasligi?: string;
}): Metadata {
  const url = `${SITE_URL}${yol}`;
  const images = gorseller && gorseller.length > 0 ? gorseller : [VARSAYILAN_PAYLASIM_GORSELI];
  return {
    title: baslik,
    description: aciklama,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: MARKA,
      locale: "tr_TR",
      title: paylasimBasligi ?? baslik,
      description: aciklama,
      images,
    },
    twitter: { card: "summary_large_image", title: paylasimBasligi ?? baslik, description: aciklama, images: images.map((g) => g.url) },
  };
}

export const ANA_SAYFA_BASLIGI = "Ofis Malzemesi ve Kırtasiye Tedariği | Tedarikhane";
export const ANA_SAYFA_ACIKLAMASI =
  "Ofis malzemesi ve kırtasiye tek adreste: kâğıt, kalem, dosya, defter, okul malzemeleri. Firmalara kurumsal fiyat, 13:30'a kadar aynı gün kargo.";

// Ürün sayfası metadata'sı: canonical her zaman slug adresi (slug'ı olmayan ürün /urun/id/… adresinde kalır).
export function urunMetasi(p: {
  id: string;
  slug: string | null;
  name: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  images: { url: string; altText: string | null }[];
}): Metadata {
  return sayfaMetasi({
    baslik: resolveSeoTitle(p),
    aciklama: resolveSeoDescription(p),
    yol: urunYolu(p),
    gorseller: p.images.slice(0, 1).map((g) => ({ url: g.url, alt: g.altText ?? p.name })),
    paylasimBasligi: p.name,
  });
}

export const urunYolu = (p: { id: string; slug: string | null }) => (p.slug ? `/urun/${p.slug}` : `/urun/id/${p.id}`);
