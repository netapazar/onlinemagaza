import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getOnlineStoreId } from "@/lib/onlineStore";
import { expandTurkishIVariants } from "@/lib/turkishSearch";

export type StorefrontProductSummary = {
  id: string;
  slug: string | null;
  name: string;
  salePriceCents: number;
  onlinePriceCents: number | null;
  stock: number;
  storefrontSortOrder: number | null;
  coverImageUrl: string | null;
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
  storefrontSortOrder: true,
  categoryId: true,
  brand: { select: { name: true } },
  images: { where: { isCover: true }, take: 1, select: { url: true } },
} as const;

export function toSummary(p: {
  id: string;
  slug: string | null;
  name: string;
  salePriceCents: number;
  onlinePriceCents: number | null;
  stock: number;
  storefrontSortOrder: number | null;
  categoryId: string | null;
  brand: { name: string } | null;
  images: { url: string }[];
}): StorefrontProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    salePriceCents: p.salePriceCents,
    onlinePriceCents: p.onlinePriceCents,
    stock: p.stock,
    storefrontSortOrder: p.storefrontSortOrder,
    coverImageUrl: p.images[0]?.url ?? null,
    brandName: p.brand?.name ?? null,
    categoryId: p.categoryId,
  };
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
} = {}): Promise<StorefrontProductSummary[]> {
  const storeId = await getOnlineStoreId();

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
    return orderedIds.map((id) => byId.get(id)).filter((p) => p !== undefined).map(toSummary);
  }

  const products = await prisma.product.findMany({
    where: {
      storeId,
      archivedAt: null,
      showOnStorefront: true,
      ...(options.categoryId ? { categoryId: options.categoryId } : {}),
    },
    select: BASE_SELECT,
    orderBy: [{ storefrontSortOrder: "asc" }, { name: "asc" }],
  });

  return products.map(toSummary);
}

export async function getStorefrontCategories(): Promise<{ id: string; name: string }[]> {
  const storeId = await getOnlineStoreId();
  const categories = await prisma.category.findMany({
    where: { products: { some: { storeId, showOnStorefront: true, archivedAt: null } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return categories;
}

// Anasayfadaki "Kategoriler" kart bölümü için — kaç ürün olduğunu da
// göstermek üzere ayrı bir count sorgusu.
// cache() — Header ve layout'taki mobil alt menü aynı istek içinde ikisi de
// çağırıyor, tekrar DB'ye gitmesin diye (bkz. getWebSession'daki aynı gerekçe).
export const getStorefrontCategoriesWithCounts = cache(async (): Promise<
  { id: string; name: string; count: number }[]
> => {
  const storeId = await getOnlineStoreId();
  const categories = await prisma.category.findMany({
    where: { products: { some: { storeId, showOnStorefront: true, archivedAt: null } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { products: { where: { storeId, showOnStorefront: true, archivedAt: null } } } },
    },
  });
  return categories.map((c) => ({ id: c.id, name: c.name, count: c._count.products }));
});

// Anasayfadaki "Yeni Eklenen Ürünler" bölümü — storefrontSortOrder'dan
// bağımsız, sadece en son storefront'a eklenmiş/güncellenmiş ürünleri
// vitrine taşımak için (küçük bir kataloğa "hareket" hissi katıyor).
export async function getNewArrivals(limit: number): Promise<StorefrontProductSummary[]> {
  const storeId = await getOnlineStoreId();
  const products = await prisma.product.findMany({
    where: { storeId, archivedAt: null, showOnStorefront: true },
    select: BASE_SELECT,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return products.map(toSummary);
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

export async function getStorefrontProductBySlug(slug: string) {
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
  const storeId = await getOnlineStoreId();
  return prisma.product.findFirst({
    where: { id, storeId, showOnStorefront: true, archivedAt: null },
    include: { images: { orderBy: { sortOrder: "asc" } }, brand: true, category: true },
  });
}
