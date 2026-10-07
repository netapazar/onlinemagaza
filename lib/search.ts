import { cache } from "react";
import { urunSatisBirimleri, type SatisBirimi } from "@/lib/satisBirimleri";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getOnlineStoreId, getOnlineFiyatArtisOrani } from "@/lib/onlineStore";
import { computeListPriceCents } from "@/lib/pricing";
import { getBestSellerRanking } from "@/lib/bestSellerRanking";
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
  shortDescription: string | null;
  stock: number;
  unit: string; // ProductUnit enum değeri (ADET/KOLI/DUZINE/KUTU/PAKET) — gösterim etiketi lib/units.ts'te
  packageInfo: string | null; // serbest metin paket/koli içeriği ("50'li paket"); boşsa vitrinde gösterilmez
  // Paketli satış: açık birimler (içeriğe göre artan); null = normal adet satışı. Fiyatlar bu durumda ADET fiyatı.
  satisBirimleri: SatisBirimi[] | null;
  storefrontSortOrder: number | null;
  coverImageUrl: string | null;
  brandId: string | null;
  brandName: string | null;
  categoryId: string | null;
  // Kart rozeti (tasarım turu 2026-10, kullanıcı kararı: kartta yalnız "Çok Satan" rozeti): sıralamada yayındaki ilk 10 ürün.
  cokSatan?: boolean;
};

export const BASE_SELECT = {
  id: true,
  slug: true,
  name: true,
  salePriceCents: true,
  onlinePriceCents: true,
  shortDescription: true,
  stock: true,
  unit: true,
  packageInfo: true,
  paketliSatis: true,
  satisBirimleri: true,
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
    shortDescription: string | null;
    stock: number;
    unit: string;
    packageInfo: string | null;
    paketliSatis: boolean;
    satisBirimleri: unknown;
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
    shortDescription: p.shortDescription,
    stock: p.stock,
    unit: p.unit,
    packageInfo: p.packageInfo?.trim() || null,
    satisBirimleri: urunSatisBirimleri(p),
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
  categoryIds?: string[]
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
      // Müşteriye gösterilmeyen eş anlamlı/alternatif yazımlar (ör. "a4 kağıt"
      // "fotokopi kağıdı" adında geçmese de aramada bulunsun diye) + CRM'de
      // girilen serbest özellik değerleri (ör. "Gramaj: 80 gr" araması "80 gr" ile bulunsun).
      Prisma.sql`p."searchKeywords" ILIKE ${"%" + v + "%"}`,
      Prisma.sql`p.features::text ILIKE ${"%" + v + "%"}`,
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
      ${categoryIds ? Prisma.sql`AND p."categoryId" IN (${Prisma.join(categoryIds)})` : Prisma.empty}
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
  const categoryIds = options.categoryId ? await kategoriVeAltlari(options.categoryId) : undefined;

  if (options.query) {
    const orderedIds = await fuzzyMatchProductIds(storeId, options.query, categoryIds);
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
        ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
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

  return cokSatanIsaretle(summaries);
}

// Kategori ağacı iki seviyeli (ana kategori > alt kategori, 2026-10-07 sanaldepom ağacı). Vitrinde ana kategoriler
// gruplanır: menü/anasayfa/alt bilgi ana kategorileri, mega menü ve filtre alt kategorileri de gösterir.
export type StorefrontSubCategory = { id: string; name: string; count: number; imageUrl: string | null };
export type StorefrontCategoryGroup = {
  id: string;
  name: string;
  count: number; // ana kategori + tüm alt kategorilerindeki yayındaki ürün
  imageUrl: string | null;
  children: StorefrontSubCategory[];
};

// Ana kategori seçilince alt kategorilerindeki ürünler de listelenir.
async function kategoriVeAltlari(categoryId: string): Promise<string[]> {
  const children = await prisma.category.findMany({ where: { parentId: categoryId }, select: { id: true } });
  return [categoryId, ...children.map((c) => c.id)];
}

// Filtre listesi ve başlık için: ana kategoriler ve (ayrı satırlarda) alt kategorileri, parentId ile.
export async function getStorefrontCategories(): Promise<{ id: string; name: string; parentId: string | null }[]> {
  // Kategori adları YALNIZ gösterimde düzgün Türkçe büyük/küçük harfe çevrilir (trTitle) — veritabanına dokunulmaz.
  if (isDemoMode()) return DEMO_CATEGORIES.map((c) => ({ ...c, name: trTitle(c.name), parentId: null }));
  const groups = await getStorefrontCategoriesWithCounts();
  return groups.flatMap((g) => [
    { id: g.id, name: g.name, parentId: null },
    ...g.children.map((c) => ({ id: c.id, name: c.name, parentId: g.id })),
  ]);
}

// Anasayfadaki "Kategoriler" kart bölümü, menüler ve alt bilgi için — ana kategoriler, ürün sayıları ve alt kategorileriyle.
// cache() — Header ve layout'taki mobil alt menü aynı istek içinde ikisi de
// çağırıyor, tekrar DB'ye gitmesin diye (bkz. getWebSession'daki aynı gerekçe).
export const getStorefrontCategoriesWithCounts = cache(async (): Promise<StorefrontCategoryGroup[]> => {
  if (isDemoMode()) return demoCategoriesWithCounts().map((c) => ({ ...c, name: trTitle(c.name), children: [] }));
  const storeId = await getOnlineStoreId();
  const yayinda = { storeId, showOnStorefront: true, archivedAt: null };
  const categories = await prisma.category.findMany({
    where: { products: { some: yayinda } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      parent: { select: { id: true, name: true } },
      _count: { select: { products: { where: yayinda } } },
      // Anasayfadaki kategori kartında görsel için — kategorinin herhangi bir
      // kapak görselli ürününden temsili bir görsel (uydurma değil).
      products: {
        where: { ...yayinda, images: { some: { isCover: true } } },
        take: 1,
        orderBy: [{ storefrontSortOrder: "asc" }, { name: "asc" }],
        select: { images: { where: { isCover: true }, take: 1, select: { url: true } } },
      },
    },
  });
  const groups = new Map<string, StorefrontCategoryGroup>();
  const grup = (id: string, name: string) => {
    let g = groups.get(id);
    if (!g) groups.set(id, (g = { id, name: trTitle(name), count: 0, imageUrl: null, children: [] }));
    return g;
  };
  for (const c of categories) {
    const imageUrl = c.products[0]?.images[0]?.url ?? null;
    const g = c.parent ? grup(c.parent.id, c.parent.name) : grup(c.id, c.name);
    g.count += c._count.products;
    g.imageUrl ??= imageUrl;
    if (c.parent) g.children.push({ id: c.id, name: trTitle(c.name), count: c._count.products, imageUrl });
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
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
  return cokSatanIsaretle(products.map((p) => toSummary(p, markupPercent)));
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
  // Görselli ürünler önce; görselsiz (yer tutuculu) ürünler yalnız liste dolmazsa ve EN SONDA gösterilir —
  // gerçek fotoğrafların yanında yer tutucu göze batıyordu (tasarım turu 2026-10).
  const where = { storeId, archivedAt: null, showOnStorefront: true, categoryId, id: { not: excludeId } };
  const orderBy = [{ storefrontSortOrder: "asc" as const }, { name: "asc" as const }];
  const gorselli = await prisma.product.findMany({ where: { ...where, images: { some: {} } }, select: BASE_SELECT, orderBy, take: limit });
  const gorselsiz =
    gorselli.length < limit
      ? await prisma.product.findMany({ where: { ...where, images: { none: {} } }, select: BASE_SELECT, orderBy, take: limit - gorselli.length })
      : [];
  return cokSatanIsaretle([...gorselli, ...gorselsiz].map((p) => toSummary(p, markupPercent)));
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
// "Çok Satan" rozeti: sıralamada (günde bir hesaplanan, bkz. bestSellerRanking.ts) yayındaki İLK 10 ürünün id'leri.
// cache(): aynı istekte birden çok liste işaretlenirse tek sorgu.
export const COK_SATAN_ROZET_SAYISI = 10;
const getCokSatanIdleri = cache(async (): Promise<Set<string>> => {
  if (isDemoMode()) return new Set();
  const [ranking, storeId] = await Promise.all([getBestSellerRanking(), getOnlineStoreId()]);
  if (ranking.length === 0) return new Set();
  const products = await prisma.product.findMany({
    where: { storeId, showOnStorefront: true, archivedAt: null, barcode: { in: ranking.map((r) => r.barcode) } },
    select: { id: true, barcode: true },
  });
  const byBarcode = new Map(products.map((p) => [p.barcode, p.id]));
  return new Set(
    ranking
      .map((r) => byBarcode.get(r.barcode))
      .filter((id): id is string => id !== undefined)
      .slice(0, COK_SATAN_ROZET_SAYISI)
  );
});

async function cokSatanIsaretle(list: StorefrontProductSummary[]): Promise<StorefrontProductSummary[]> {
  const ids = await getCokSatanIdleri();
  return ids.size === 0 ? list : list.map((p) => (ids.has(p.id) ? { ...p, cokSatan: true } : p));
}

export async function getBestSellers(limit: number): Promise<StorefrontProductSummary[]> {
  if (isDemoMode()) return demoBestSellers(limit);
  // Sıra günde bir hesaplanır (bkz. lib/bestSellerRanking.ts — pazarlama + online, son 90 gün, belge sayısı);
  // ürün bilgisi (fiyat, stok, yayın) her istekte güncel okunur. Yayında olmayanlar atlanır.
  const [ranking, storeId, markupPercent] = await Promise.all([
    getBestSellerRanking(),
    getOnlineStoreId(),
    getOnlineFiyatArtisOrani(),
  ]);
  if (ranking.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { storeId, showOnStorefront: true, archivedAt: null, barcode: { in: ranking.map((r) => r.barcode) } },
    select: { ...BASE_SELECT, barcode: true },
  });
  const byBarcode = new Map(products.map((p) => [p.barcode, p]));
  // Bu listede rozet işaretlenmez: "Çok Satanlar" başlığı aynı bilgiyi zaten veriyor (her kartta rozet gürültü olurdu).
  return ranking
    .map((r) => byBarcode.get(r.barcode))
    .filter((p) => p !== undefined)
    .slice(0, limit)
    .map((p) => toSummary(p, markupPercent));
}

// Anasayfa marka şeridi (kullanıcı kararı 2026-10-07): ELLE tanımlı, tanınırlığa göre sabit 20 markalık sıra — üstte ofis
// sarf markaları, lüks/teknik kalem altta. Gösterilen ad bu listedeki yazım; eşleştirme veritabanındaki marka adıyla
// büyük/küçük harf, boşluk ve tire farkı gözetmeden yapılır. Yayında ürünü olmayan marka sessizce atlanır.
// Tüm markalar ürün listesinin marka filtresinde (getStorefrontBrands) kalır.
export const VITRIN_MARKALARI = [
  "Faber-Castell", "Bic", "Pensan", "Gıpta", "Schneider", "Casio", "Mas", "Edding", "Pritt", "Uni-ball",
  "Noki", "Mikro", "Pelikan", "Adel", "Scrikss", "Monami", "Rotring", "Waterman", "Duracell", "Varta",
];
const markaAnahtari = (ad: string) => ad.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/[^a-z0-9çğöşü]/g, "");

export async function getVitrinMarkalari(): Promise<{ id: string; name: string }[]> {
  if (isDemoMode()) return DEMO_BRANDS.slice(0, VITRIN_MARKALARI.length);
  const storeId = await getOnlineStoreId();
  const brands = await prisma.brand.findMany({
    where: { products: { some: { storeId, showOnStorefront: true, archivedAt: null } } },
    select: { id: true, name: true },
  });
  const byKey = new Map(brands.map((b) => [markaAnahtari(b.name), b.id]));
  return VITRIN_MARKALARI.flatMap((ad) => {
    const id = byKey.get(markaAnahtari(ad));
    return id ? [{ id, name: ad }] : [];
  });
}

// Ürün listesinin marka filtresi — storefront'ta ürünü olan TÜM markalar, uydurma bir liste değil.
export async function getStorefrontBrands(): Promise<{ id: string; name: string }[]> {
  if (isDemoMode()) return DEMO_BRANDS;
  const storeId = await getOnlineStoreId();
  return prisma.brand.findMany({
    where: { products: { some: { storeId, showOnStorefront: true, archivedAt: null } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

// Ürün detay sayfasının ihtiyacı olan alanların TAM listesi — bilerek `include`
// DEĞİL `select`. `include` Product'ın TÜM skaler alanlarını döndürür; bu da
// needsReview/reviewNote gibi yalnız CRM içi alanların (bkz. proje kısıtı: bu
// ikisi müşteriye asla görünmemeli) sayfa/RSC payload'una hiç girmemesini
// KODUN KENDİSİNİN garanti etmesi anlamına gelir — "zaten render edilmiyor"
// gibi kırılgan bir varsayıma değil.
const DETAIL_SELECT = {
  id: true,
  name: true,
  shortDescription: true,
  description: true,
  features: true,
  salePriceCents: true,
  onlinePriceCents: true,
  stock: true,
  barcode: true,
  barcodeIsGenerated: true,
  productCode: true,
  packageInfo: true,
  paketliSatis: true,
  satisBirimleri: true,
  unit: true,
  categoryId: true,
  images: { orderBy: { sortOrder: "asc" as const }, select: { id: true, url: true, altText: true } },
  brand: { select: { name: true } },
  category: { select: { name: true } },
} as const;

export async function getStorefrontProductBySlug(slug: string) {
  if (isDemoMode()) return demoProductBySlugOrId(slug);
  const storeId = await getOnlineStoreId();
  return prisma.product.findFirst({
    where: { storeId, slug, showOnStorefront: true, archivedAt: null },
    select: DETAIL_SELECT,
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
    select: DETAIL_SELECT,
  });
}
