"use server";

// Client bileşenlerinden (SearchAutocomplete, /favoriler sayfası) doğrudan
// çağrılabilmesi için — Next.js, fonksiyon-içi "use server" direktifini
// Client Component'lere aktarılan bir dosyadan içe aktarmaya izin vermiyor,
// dosya seviyesinde "use server" gerekiyor (bkz. proje hafızası). lib/search.ts
// ve lib/memberPricing.ts'teki asıl mantığı burada sadece sarmalıyoruz.
import { prisma } from "@/lib/prisma";
import { getOnlineStoreId, getOnlineFiyatArtisOrani } from "@/lib/onlineStore";
import { eticaretStokuUygula } from "@/lib/depoStok";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import {
  listStorefrontProducts,
  BASE_SELECT,
  toSummary,
  type StorefrontProductSummary,
  type SearchSuggestion,
} from "@/lib/search";
import { isDemoMode, demoProductsByIds } from "@/lib/demoData";

const SUGGESTION_LIMIT = 6;

// KASITLI OLARAK fiyat alanı döndürmüyor — üye/misafir fiyat farkı bu proje
// için en kritik kural (bkz. proje kısıtı): fiyat göstermek her yerde
// resolvePrice+üyelik bilgisinden geçmeli, öneri kutusu gibi ufak/hızlı bir
// bileşende bu riske hiç girmemek en güvenlisi — görsel + isim + marka yeterli.
export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const products = await listStorefrontProducts({ query: trimmed });
  return products.slice(0, SUGGESTION_LIMIT).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandName: p.brandName,
    coverImageUrl: p.coverImageUrl,
  }));
}

// Favoriler sayfası için — favoriler localStorage'da sadece id listesi
// olarak tutuluyor (bkz. FavoritesProvider), gösterim için ürün detayları
// bu server action ile client'tan çekiliyor.
export async function getStorefrontProductsByIds(ids: string[]): Promise<StorefrontProductSummary[]> {
  if (ids.length === 0) return [];
  if (isDemoMode()) return demoProductsByIds(ids);
  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);
  // Stok Ana Depo'dan (tek havuz, 2026-10).
  const products = await eticaretStokuUygula(
    prisma,
    await prisma.product.findMany({
      where: { id: { in: ids }, storeId, showOnStorefront: true, archivedAt: null },
      select: BASE_SELECT,
    })
  );
  const byId = new Map(products.map((p) => [p.id, p]));
  // Not: eskiden `.map(toSummary)` idi — map'in sıra numarası fiyat artış oranı yerine geçiyordu; oran açıkça veriliyor.
  return ids.map((id) => byId.get(id)).filter((p) => p !== undefined).map((p) => toSummary(p, markupPercent));
}

export async function getMemberDiscountPercentAction(): Promise<number | null> {
  return getMemberDiscountPercent();
}
