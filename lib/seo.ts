// Ürün sayfası için sayfa başlığı/meta açıklaması — CRM'de elle girilmişse
// (Product.seoTitle/seoDescription) aynen kullanılır, boşsa ürün adı/kısa
// açıklamadan üretilir (fiyat hesaplamasındaki nullable-override kuralıyla aynı desen).
export function resolveSeoTitle(product: { name: string; seoTitle?: string | null }): string {
  return product.seoTitle?.trim() || `${product.name} | Tedarikhane`;
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
