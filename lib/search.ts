import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getOnlineStoreId, getOnlineFiyatArtisOrani } from "@/lib/onlineStore";
import { computeListPriceCents } from "@/lib/pricing";
import { expandTurkishIVariants } from "@/lib/turkishSearch";
import { trTitle } from "@/lib/text";
import {
  isDemoMode,
  demoListStorefrontProducts,
  demoCategoriesWithCounts,
  demoBestSellers,
  demoNewArrivals,
  demoRelatedProducts,
  demoProductBySlugOrId,
  DEMO_CATEGORIES,
  DEMO_BRANDS,
} from "@/lib/demoData";

export type StorefrontProductSummary = {
  id: string;
  slug: string | null;
  name: string;
  salePriceCents: number;
  onlinePriceCents: number | null;
  // Artış oranı uygulanmış, 50 kuruşa yuvarlanmış nihai liste fiyatı (KDV dahil,
  // üye indiriminden ÖNCE) — bkz. lib/pricing.ts computeListPriceCents. resolvePrice
  // bunu doğrudan kullanır, salePriceCents/onlinePriceCents'i tekrar hesaplamaz.
  listPriceCents: number;
  stock: number;
  unit: string; // ProductUnit enum değeri (ADET/KOLI/DUZINE/KUTU/PAKET) — gösterim etiketi lib/units.ts'te
  packageInfo: string | null; // serbest metin paket/koli içeriği ("50'li paket"); boşsa vitrinde gösterilmez
  storefrontSortOrder: number | null;
  coverImageUrl: string | null;
  brandId: string | null;
  brandName: string | null;
  categoryId: string | null;
};

export const BASE_SELECT = {
  id: true,
  slug: true,
  name: true,
  salePriceCents: true,
  onlinePriceCents: true,
  stock: true,
  unit: true,
  packageInfo: true,
  storefrontSortOrder: true,
  categoryId: true,
  brand: { select: { id: true, name: true } },
  images: { where: { isCover: true }, take: 1, select: { url: true } },
} as const;

export function toSummary(
  p: {
    id: string;
    slug: string | null;
    name: string;
    salePriceCents: number;
    onlinePriceCents: number | null;
    stock: number;
    unit: string;
    packageInfo: string | null;
    storefrontSortOrder: number | null;
    categoryId: string | null;
    brand: { id: string; name: string } | null;
    images: { url: string }[];
  },
  markupPercent: number
): StorefrontProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    salePriceCents: p.salePriceCents,
    onlinePriceCents: p.onlinePriceCents,
    listPriceCents: computeListPriceCents(p, markupPercent),
    stock: p.stock,
    unit: p.unit,
    packageInfo: p.packageInfo?.trim() || null,
    storefrontSortOrder: p.storefrontSortOrder,
    coverImageUrl: p.images[0]?.url ?? null,
    brandId: p.brand?.id ?? null,
    brandName: p.brand?.name ?? null,
    categoryId: p.categoryId,
  };
}

// Etiket (liste) fiyatı — üyelik durumundan bağımsız, herkes için aynı.
// Fiyat aralığı/sıralama filtreleri bilerek bunun üzerinden çalışıyor,
// resolvePrice'ın üyeye özel indirimli fiyatı ASLA paylaşılan bir
// sorguda/filtrede hesaplanmıyor (bkz. proje kısıtı). Artış oranı toSummary'de
// zaten uygulandığı için burada yalnız listPriceCents okunuyor.
function effectiveListCents(p: { listPriceCents: number }): number {
  return p.listPriceCents;
}

export type StorefrontSort = "onerilen" | "fiyat-artan" | "fiyat-azalan" | "isim-az" | "yeni";

function sortSummaries(products: StorefrontProductSummary[], sort?: StorefrontSort): StorefrontProductSummary[] {
  switch (sort) {
    case "fiyat-artan":
      return [...products].sort((a, b) => effectiveListCents(a) - effectiveListCents(b));
    case "fiyat-azalan":
      return [...products].sort((a, b) => effectiveListCents(b) - effectiveListCents(a));
    case "isim-az":
      return [...products].sort((a, b) => a.name.localeCompare(b.name, "tr"));
    default:
      return products;
  }
}

// pg_trgm bu veritabanında zaten kurulu (magaza-crm'in Product trigram
// index'leri için, bkz. migration 20260804140000_add_product_search_trgm_indexes)
// — o yüzden burada yeni bir extension kurulumu gerekmiyor. Yazım hatalarını
// da yakalayabilmek için (kullanıcının özellikle vurguladığı "çok gelişmiş
// arama" isteği) düz `contains` yetmiyor: her anahtar kelime için ya bir alt
// dize eşleşmesi ya da trigram benzerliği yeterli sayılıyor, kelimeler arası
// hâlâ AND. **`similarity()` değil `word_similarity()` kullanılıyor** —
// `similarity(p.name, 'defme')` gibi kısa bir kelimeyi UZUN bir ürün adının
// TAMAMIYLA kıyaslar ve skor sulanır (gerçek bir yazım hatası testinde
// "defme" "DEFNE AYRAÇLI..." adını bulamadı, doğrulanan bir hata) —
// `word_similarity(kelime, ad)` ise kelimenin ad içindeki EN İYİ eşleşen alt
// dizeyle kıyaslanmasını sağlıyor, kısa kelime/uzun metin senaryosu için
// doğru araç bu. Sonuç, en iyi benzerlik skoruna göre sıralanıyor.
async function fuzzyMatchProductIds(
  storeId: string,
  query: string,
  categoryId?: string
): Promise<string[]> {
  const keywords = query.trim().split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return [];

  const keywordConditions = keywords.map((kw) => {
    const variants = expandTurkishIVariants(kw);
    const fragments = variants.flatMap((v) => [
      Prisma.sql`p.name ILIKE ${"%" + v + "%"}`,
      Prisma.sql`p.description ILIKE ${"%" + v + "%"}`,
      Prisma.sql`b.name ILIKE ${"%" + v + "%"}`,
      Prisma.sql`c.name ILIKE ${"%" + v + "%"}`,
      Prisma.sql`word_similarity(${v}, p.name) > 0.4`,
    ]);
    return Prisma.sql`(${Prisma.join(fragments, " OR ")})`;
  });

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT p.id,
      GREATEST(
        word_similarity(${query}, p.name),
        word_similarity(${query}, coalesce(b.name, '')),
        0
      ) AS rank
    FROM "Product" p
    LEFT JOIN "Brand" b ON b.id = p."brandId"
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    WHERE p."storeId" = ${storeId}
      AND p."showOnStorefront" = true
      AND p."archivedAt" IS NULL
      ${categoryId ? Prisma.sql`AND p."categoryId" = ${categoryId}` : Prisma.empty}
      AND (${Prisma.join(keywordConditions, " AND ")})
    ORDER BY rank DESC
    LIMIT 50
  `);
  return rows.map((r) => r.id);
}

export async function listStorefrontProducts(options: {
  query?: string;
  categoryId?: string;
  brandIds?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: StorefrontSort;
} = {}): Promise<StorefrontProductSummary[]> {
  if (isDemoMode()) return demoListStorefrontProducts(options);

  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);

  let summaries: StorefrontProductSummary[];

  if (options.query) {
    const orderedIds = await fuzzyMatchProductIds(storeId, options.query, options.categoryId);
    if (orderedIds.length === 0) return [];
    const products = await prisma.product.findMany({
      where: { id: { in: orderedIds } },
      select: BASE_SELECT,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    // $queryRaw'ın döndürdüğü sıralama (en iyi eşleşme önce) korunuyor —
    // Prisma'nın `id: { in: [...] }` sorgusu bu sırayı garanti etmiyor.
    summaries = orderedIds.map((id) => byId.get(id)).filter((p) => p !== undefined).map((p) => toSummary(p, markupPercent));
  } else {
    const products = await prisma.product.findMany({
      where: {
        storeId,
        archivedAt: null,
        showOnStorefront: true,
        ...(options.categoryId ? { categoryId: options.categoryId } : {}),
      },
      select: BASE_SELECT,
      orderBy: options.sort === "yeni" ? { updatedAt: "desc" } : [{ storefrontSortOrder: "asc" }, { name: "asc" }],
    });
    summaries = products.map((p) => toSummary(p, markupPercent));
  }

  // Marka/fiyat aralığı filtreleri — küçük katalog boyutunda DB'den sonra
  // JS'te filtrelemek raw SQL'e gerek bırakmıyor, ölçek büyürse burası
  // doğrudan sorguya taşınabilir.
  if (options.brandIds && options.brandIds.length > 0) {
    const brandSet = new Set(options.brandIds);
    summaries = summaries.filter((p) => p.brandId && brandSet.has(p.brandId));
  }
  if (options.minPriceCents !== undefined) {
    summaries = summaries.filter((p) => effectiveListCents(p) >= options.minPriceCents!);
  }
  if (options.maxPriceCents !== undefined) {
    summaries = summaries.filter((p) => effectiveListCents(p) <= options.maxPriceCents!);
  }

  if (options.sort && options.sort !== "yeni") {
    summaries = sortSummaries(summaries, options.sort);
  }

  return summaries;
}

export async function getStorefrontCategories(): Promise<{ id: string; name: string }[]> {
  // Kategori adları YALNIZ gösterimde düzgün Türkçe büyük/küçük harfe çevrilir (trTitle) — veritabanına dokunulmaz.
  if (isDemoMode()) return DEMO_CATEGORIES.map((c) => ({ ...c, name: trTitle(c.name) }));
  const storeId = await getOnlineStoreId();
  const categories = await prisma.category.findMany({
    where: { products: { some: { storeId, showOnStorefront: true, archivedAt: null } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return categories.map((c) => ({ ...c, name: trTitle(c.name) }));
}

// Anasayfadaki "Kategoriler" kart bölümü için — kaç ürün olduğunu da
// göstermek üzere ayrı bir count sorgusu.
// cache() — Header ve layout'taki mobil alt menü aynı istek içinde ikisi de
// çağırıyor, tekrar DB'ye gitmesin diye (bkz. getWebSession'daki aynı gerekçe).
export const getStorefrontCategoriesWithCounts = cache(async (): Promise<
  { id: string; name: string; count: number; imageUrl: string | null }[]
> => {
  if (isDemoMode()) return demoCategoriesWithCounts().map((c) => ({ ...c, name: trTitle(c.name) }));
  const storeId = await getOnlineStoreId();
  const categories = await prisma.category.findMany({
    where: { products: { some: { storeId, showOnStorefront: true, archivedAt: null } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { products: { where: { storeId, showOnStorefront: true, archivedAt: null } } } },
      // Anasayfadaki kategori kartında görsel için — kategorinin herhangi bir
      // kapak görselli ürününden temsili bir görsel (uydurma değil).
      products: {
        where: { storeId, showOnStorefront: true, archivedAt: null, images: { some: { isCover: true } } },
        take: 1,
        orderBy: [{ storefrontSortOrder: "asc" }, { name: "asc" }],
        select: { images: { where: { isCover: true }, take: 1, select: { url: true } } },
      },
    },
  });
  return categories.map((c) => ({
    id: c.id,
    name: trTitle(c.name),
    count: c._count.products,
    imageUrl: c.products[0]?.images[0]?.url ?? null,
  }));
});

// Anasayfadaki "Yeni Eklenen Ürünler" bölümü — storefrontSortOrder'dan
// bağımsız, sadece en son storefront'a eklenmiş/güncellenmiş ürünleri
// vitrine taşımak için (küçük bir kataloğa "hareket" hissi katıyor).
export async function getNewArrivals(limit: number): Promise<StorefrontProductSummary[]> {
  if (isDemoMode()) return demoNewArrivals(limit);
  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);
  const products = await prisma.product.findMany({
    where: { storeId, archivedAt: null, showOnStorefront: true },
    select: BASE_SELECT,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return products.map((p) => toSummary(p, markupPercent));
}

// Ürün detay sayfasındaki "Benzer Ürünler" bölümü — aynı kategoriden,
// mevcut ürün hariç.
export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit: number
): Promise<StorefrontProductSummary[]> {
  if (!categoryId) return [];
  if (isDemoMode()) return demoRelatedProducts(categoryId, excludeId, limit);
  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);
  const products = await prisma.product.findMany({
    where: { storeId, archivedAt: null, showOnStorefront: true, categoryId, id: { not: excludeId } },
    select: BASE_SELECT,
    orderBy: [{ storefrontSortOrder: "asc" }, { name: "asc" }],
    take: limit,
  });
  return products.map((p) => toSummary(p, markupPercent));
}

// Header'daki yazarken-öneri kutusu için — KASITLI OLARAK fiyat alanı
// döndürmüyor. Üye/misafir fiyat farkı bu proje için en kritik kural
// (bkz. proje kısıtı): fiyat göstermek her yerde resolvePrice+üyelik
// bilgisinden geçmeli, öneri kutusu gibi ufak/hızlı bir bileşende bu riske
// hiç girmemek en güvenlisi — görsel + isim + marka yeterli.
export type SearchSuggestion = {
  id: string;
  slug: string | null;
  name: string;
  brandName: string | null;
  coverImageUrl: string | null;
};

// Anasayfadaki "Çok Satanlar" bölümü — gerçek satış verisine (WebOrderItem)
// dayanıyor, uydurma bir "popülerlik" skoru değil. Henüz ödenmemiş
// (ODEME_BEKLIYOR) ve iptal edilmiş (IPTAL_EDILDI) siparişler sayılmıyor —
// sadece fiilen işlenmiş siparişler "satış" sayılır. Online mağaza yeni
// açıldığı için bu liste gerçek sipariş birikene kadar boş dönecek; anasayfa
// bunu zaten göstermeyerek karşılıyor (bkz. proje kısıtı: veri yoksa vitrin
// bölümü nazikçe gizlenmeli).
export async function getBestSellers(limit: number): Promise<StorefrontProductSummary[]> {
  if (isDemoMode()) return demoBestSellers(limit);
  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);
  const grouped = await prisma.webOrderItem.groupBy({
    by: ["productId"],
    where: { webOrder: { status: { notIn: ["ODEME_BEKLIYOR", "IPTAL_EDILDI"] } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const ids = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, storeId, showOnStorefront: true, archivedAt: null },
    select: BASE_SELECT,
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p) => p !== undefined).map((p) => toSummary(p, markupPercent));
}

// Anasayfadaki marka şeridi — sadece storefront'ta ürünü olan markalar,
// uydurma bir liste değil.
export async function getStorefrontBrands(): Promise<{ id: string; name: string }[]> {
  if (isDemoMode()) return DEMO_BRANDS;
  const storeId = await getOnlineStoreId();
  return prisma.brand.findMany({
    where: { products: { some: { storeId, showOnStorefront: true, archivedAt: null } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getStorefrontProductBySlug(slug: string) {
  if (isDemoMode()) return demoProductBySlugOrId(slug);
  const storeId = await getOnlineStoreId();
  return prisma.product.findFirst({
    where: { storeId, slug, showOnStorefront: true, archivedAt: null },
    include: { images: { orderBy: { sortOrder: "asc" } }, brand: true, category: true },
  });
}

// Fallback for a showOnStorefront product that was never given a slug —
// ProductCard links here (/urun/id/[id]) instead of /urun/[slug] whenever
// product.slug is null, so nothing ever 404s just because a slug is missing.
export async function getStorefrontProductById(id: string) {
  if (isDemoMode()) return demoProductBySlugOrId(id);
  const storeId = await getOnlineStoreId();
  return prisma.product.findFirst({
    where: { id, storeId, showOnStorefront: true, archivedAt: null },
    include: { images: { orderBy: { sortOrder: "asc" } }, brand: true, category: true },
  });
}
