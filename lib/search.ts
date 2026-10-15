import { cache } from "react";
import { urunSatisBirimleri, type SatisBirimi } from "@/lib/satisBirimleri";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getOnlineStoreId, getOnlineFiyatArtisOrani } from "@/lib/onlineStore";
import { computeListPriceCents } from "@/lib/pricing";
import { getBestSellerRanking } from "@/lib/bestSellerRanking";
import { expandTurkishIVariants } from "@/lib/turkishSearch";
import { trTitle } from "@/lib/text";
import { eticaretStokuUygula } from "@/lib/depoStok";
import { GORUNUR_GRUP, grupBaglantilariniUygula } from "@/lib/urunGrubu";
import { grupYolu, secenekEtiketi, secimSorgusu, varsayilanIndeks } from "@/lib/urunGrubuCore";
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
  // Barkod: Ana Depo stoğu ve Ürün Grubu üyeliği barkodla eşleşir (varyant, 2026-10).
  barcode: string;
  salePriceCents: number;
  onlinePriceCents: number | null;
  // Artış oranı uygulanmış, 50 kuruşa yuvarlanmış nihai liste fiyatı (KDV dahil,
  // üye indiriminden ÖNCE) — bkz. lib/pricing.ts computeListPriceCents. resolvePrice
  // bunu doğrudan kullanır, salePriceCents/onlinePriceCents'i tekrar hesaplamaz.
  listPriceCents: number;
  shortDescription: string | null;
  // Tek havuz (2026-10): Ana Depo stoğu − pazarlamaya ayrılan (e-ticarete satılabilir). Online satırın kendi
  // `stock` alanı okunmaz — listeler eticaretStokuUygula'dan geçer (bkz. lib/depoStok.ts).
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
  // Varyant (Ürün Grubu, 2026-10): ürün görünür bir grubun üyesiyse kartın bağlantısı grup adresi (+ seçim parametreleri).
  // Boşsa kart ürünün kendi adresine gider (bkz. lib/seo.ts urunHref).
  href?: string;
  // Liste kartı bir GRUBU temsil ediyorsa (ürün listesi/kategori/arama — üyeler tek kart): ad/kapak/fiyat gruptan, fiyat en
  // düşük üyenin fiyatı (fiyatFarkli ise "… ₺'den"), kartta sepete ekleme yerine seçenekleri gösteren bağlantı. id/favori
  // temsil eden üyeninkidir (aramada bulunan üye, yoksa grubun varsayılan üyesi).
  grup?: { secenekEtiketi: string | null; fiyatFarkli: boolean; stoktaVar: boolean };
};

export const BASE_SELECT = {
  id: true,
  slug: true,
  name: true,
  salePriceCents: true,
  onlinePriceCents: true,
  shortDescription: true,
  stock: true,
  // Ana Depo eşlemesi (stok) barkodla yapılır.
  barcode: true,
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
    barcode: string;
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
    barcode: p.barcode,
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
// Ürünün görünür Ürün Grubu (varyant, 2026-10) — barkod UrunGrubuUyesi'nde tekil olduğu için satır çoğalmaz.
const GRUP_JOIN = Prisma.sql`
    LEFT JOIN "UrunGrubuUyesi" gu ON gu.barcode = p.barcode
    LEFT JOIN "UrunGrubu" g ON g.id = gu."grupId" AND g."showOnStorefront" = true AND g."archivedAt" IS NULL`;

// Kategori süzgeci: ürünün kendi kategorisi ya da (görünür grubun üyesiyse) grubun site kategorisi.
function kategoriKosulu(categoryIds?: string[]) {
  return categoryIds
    ? Prisma.sql`AND (p."categoryId" IN (${Prisma.join(categoryIds)}) OR g."categoryId" IN (${Prisma.join(categoryIds)}))`
    : Prisma.empty;
}

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
      // Varyant (2026-10): görünür Ürün Grubu üyesinde grubun adı/arama kelimeleri ve üyenin eksen değeri de aranır
      // ("matara mor" → mor matara üyesi). g yalnız görünür grupta dolu (LEFT JOIN koşulu).
      Prisma.sql`g.ad ILIKE ${"%" + v + "%"}`,
      Prisma.sql`g."searchKeywords" ILIKE ${"%" + v + "%"}`,
      Prisma.sql`(g.id IS NOT NULL AND (gu."eksen1Deger" ILIKE ${"%" + v + "%"} OR gu."eksen2Deger" ILIKE ${"%" + v + "%"}))`,
    ]);
    return Prisma.sql`(${Prisma.join(fragments, " OR ")})`;
  });

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT p.id,
      GREATEST(
        word_similarity(${query}, p.name),
        word_similarity(${query}, coalesce(b.name, '')),
        word_similarity(${query}, coalesce(g.ad, '')),
        0
      ) AS rank
    FROM "Product" p
    LEFT JOIN "Brand" b ON b.id = p."brandId"
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    ${GRUP_JOIN}
    WHERE p."storeId" = ${storeId}
      AND p."showOnStorefront" = true
      AND p."archivedAt" IS NULL
      ${kategoriKosulu(categoryIds)}
      AND (${Prisma.join(keywordConditions, " AND ")})
    ORDER BY rank DESC
    LIMIT 50
  `);
  return rows.map((r) => r.id);
}

// Barkod / ürün kodu araması (2026-10, kullanıcı: "barkod araması yok"). Sorgu TEK parça (boşluksuz) ve kod gibi
// görünüyorsa (harf/rakam/tire, 3-32 karakter) tam eşleşme aranır:
//   * ürün barkodu, paketli satış birim barkodları (Product.satisBirimleri) ve kutu/koli barkodları
//     (ProductBarcodeVariant — hangi mağaza satırına girildiyse, aynı barkodlu online ürüne bağlanır);
//     baştaki sıfırlar yok sayılır (03086129626663 = 3086129626663, GTIN-14/EAN-13 farkı);
//   * ürün kodu: büyük/küçük harf ve İ/I/ı farkı yok sayılır (COPİERA4 = copiera4).
// Bulunanlar fuzzy sonuçların ÖNÜNE konur (öneri kutusunda da ilk sırada).
async function exactCodeMatchProductIds(storeId: string, query: string, categoryIds?: string[]): Promise<string[]> {
  const q = query.trim();
  if (!/^[0-9A-Za-zÇĞİÖŞÜçğıöşü-]{3,32}$/.test(q)) return [];
  const sifirsiz = q.replace(/^0+/, "");
  if (!sifirsiz) return [];
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT p.id
    FROM "Product" p
    ${GRUP_JOIN}
    WHERE p."storeId" = ${storeId}
      AND p."showOnStorefront" = true
      AND p."archivedAt" IS NULL
      ${kategoriKosulu(categoryIds)}
      AND (
        ltrim(p.barcode, '0') = ${sifirsiz}
        OR lower(translate(coalesce(p."productCode", ''), 'İIı', 'iii')) = lower(translate(${q}, 'İIı', 'iii'))
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(p."satisBirimleri") = 'array' THEN p."satisBirimleri" ELSE '[]'::jsonb END
          ) AS b
          WHERE ltrim(b->>'barkod', '0') = ${sifirsiz}
        )
        OR EXISTS (
          SELECT 1 FROM "ProductBarcodeVariant" v
          JOIN "Product" vp ON vp.id = v."productId"
          WHERE vp.barcode = p.barcode AND ltrim(v.barcode, '0') = ${sifirsiz}
        )
      )
    LIMIT 20
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
    const [exactIds, fuzzyIds] = await Promise.all([
      exactCodeMatchProductIds(storeId, options.query, categoryIds),
      fuzzyMatchProductIds(storeId, options.query, categoryIds),
    ]);
    const orderedIds = [...new Set([...exactIds, ...fuzzyIds])];
    if (orderedIds.length === 0) return [];
    const products = await eticaretStokuUygula(
      prisma,
      await prisma.product.findMany({
        where: { id: { in: orderedIds } },
        select: BASE_SELECT,
      })
    );
    const byId = new Map(products.map((p) => [p.id, p]));
    // $queryRaw'ın döndürdüğü sıralama (en iyi eşleşme önce) korunuyor —
    // Prisma'nın `id: { in: [...] }` sorgusu bu sırayı garanti etmiyor.
    summaries = orderedIds.map((id) => byId.get(id)).filter((p) => p !== undefined).map((p) => toSummary(p, markupPercent));
  } else {
    const products = await eticaretStokuUygula(
      prisma,
      await prisma.product.findMany({
        where: {
          storeId,
          archivedAt: null,
          showOnStorefront: true,
          ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
        },
        select: BASE_SELECT,
        orderBy: options.sort === "yeni" ? { updatedAt: "desc" } : [{ storefrontSortOrder: "asc" }, { name: "asc" }],
      })
    );
    summaries = products.map((p) => toSummary(p, markupPercent));
  }

  // Varyant (2026-10): görünür grubun üyeleri TEK kart olur — sayfalama/toplam sayı grubu bir ürün sayar. Marka/fiyat
  // süzgeci ve sıralama bu yüzden daraltmadan SONRA, kartın (grubun) değerleriyle çalışır: fiyat = en düşük üye fiyatı.
  summaries = await gruplariDaralt(await cokSatanIsaretle(summaries), {
    storeId,
    markupPercent,
    categoryIds,
    arama: Boolean(options.query),
    sort: options.sort,
  });

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

// Varsayılan liste sırası (DB'deki orderBy ile aynı anlam): storefrontSortOrder artan (boşlar sonda), sonra ad.
function varsayilanSiraKarsilastir(a: StorefrontProductSummary, b: StorefrontProductSummary): number {
  const sa = a.storefrontSortOrder ?? Number.POSITIVE_INFINITY;
  const sb = b.storefrontSortOrder ?? Number.POSITIVE_INFINITY;
  if (sa !== sb) return sa < sb ? -1 : 1;
  return a.name.localeCompare(b.name, "tr");
}

// Ürün listesinde görünür Ürün Grubu üyelerini tek grup kartında birleştirir (varyant, 2026-10). Ek sorgu: grup bilgisi
// (barkodla, tek sorgu) + listede olmayan görünür üyeler (aramada/kategoride yalnız bir kısmı bulunduysa; fiyat aralığı,
// stok ve seçenek sayısı grubun TÜM görünür üyeleriyle hesaplanır) + onların Ana Depo stoğu. Grup yoksa tek sorgu.
// Kart sırası: üyelerden listede ilk görüneninin yeri (aramada en iyi eşleşme, varsayılan sırada en öndeki üye).
// Kategori: grubun site kategorisi doluysa o geçerli — üye başka kategorideyse de kart grubun kategorisinde görünür,
// grubun kategorisi süzgeç dışındaysa üye bu listeden çıkar. Arama bir üyeyi bulduysa kart o üyenin seçimiyle açılır.
async function gruplariDaralt(
  liste: StorefrontProductSummary[],
  o: { storeId: string; markupPercent: number; categoryIds?: string[]; arama: boolean; sort?: StorefrontSort }
): Promise<StorefrontProductSummary[]> {
  const kategoriyleEkle = o.categoryIds && !o.arama;
  if (liste.length === 0 && !kategoriyleEkle) return liste;
  const gruplar = await prisma.urunGrubu.findMany({
    where: {
      ...GORUNUR_GRUP,
      OR: [
        { uyeler: { some: { barcode: { in: liste.map((p) => p.barcode) } } } },
        ...(kategoriyleEkle ? [{ categoryId: { in: o.categoryIds! } }] : []),
      ],
    },
    select: {
      id: true,
      ad: true,
      slug: true,
      eksen1Ad: true,
      eksen2Ad: true,
      shortDescription: true,
      categoryId: true,
      storefrontSortOrder: true,
      brand: { select: { id: true, name: true } },
      gorseller: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
      uyeler: {
        orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
        select: { barcode: true, eksen1Deger: true, eksen2Deger: true, varsayilan: true },
      },
    },
  });
  if (gruplar.length === 0) return liste;

  const byBarcode = new Map(liste.map((p) => [p.barcode, p]));
  const eksik = gruplar.flatMap((g) => g.uyeler.map((u) => u.barcode)).filter((b) => !byBarcode.has(b));
  if (eksik.length > 0) {
    const ek = await eticaretStokuUygula(
      prisma,
      await prisma.product.findMany({
        where: { storeId: o.storeId, showOnStorefront: true, archivedAt: null, barcode: { in: [...new Set(eksik)] } },
        select: BASE_SELECT,
      })
    );
    for (const p of await cokSatanIsaretle(ek.map((r) => toSummary(r, o.markupPercent)))) byBarcode.set(p.barcode, p);
  }

  type Grup = (typeof gruplar)[number];
  const grupByBarcode = new Map<string, Grup>();
  for (const g of gruplar) for (const u of g.uyeler) grupByBarcode.set(u.barcode, g);
  const kategoriDisi = (g: Grup) => Boolean(o.categoryIds && g.categoryId && !o.categoryIds.includes(g.categoryId));

  const kart = (g: Grup, bulunanBarkod: string | null): StorefrontProductSummary | null => {
    const eksenler = { eksen1Ad: g.eksen1Ad, eksen2Ad: g.eksen2Ad?.trim() || null };
    const uyeler = g.uyeler.flatMap((u) => {
      const p = byBarcode.get(u.barcode);
      return p ? [{ u: { ...u, eksen2Deger: u.eksen2Deger?.trim() || null }, p, satilabilir: satilabilir(p) }] : [];
    });
    if (uyeler.length === 0) return null;
    const varsayilan = uyeler[varsayilanIndeks(uyeler.map((x) => ({ ...x.u, satilabilir: x.satilabilir })))];
    const temsil = (bulunanBarkod && uyeler.find((x) => x.u.barcode === bulunanBarkod)) || varsayilan;
    const enUcuz = uyeler.reduce((a, b) => (b.p.listPriceCents < a.p.listPriceCents ? b : a));
    const r = temsil.p;
    return {
      ...r,
      slug: g.slug,
      name: g.ad,
      salePriceCents: enUcuz.p.salePriceCents,
      onlinePriceCents: enUcuz.p.onlinePriceCents,
      listPriceCents: enUcuz.p.listPriceCents,
      shortDescription: g.shortDescription?.trim() || r.shortDescription,
      coverImageUrl: g.gorseller[0]?.url ?? varsayilan.p.coverImageUrl ?? r.coverImageUrl,
      brandId: g.brand?.id ?? r.brandId,
      brandName: g.brand?.name ?? r.brandName,
      categoryId: g.categoryId ?? r.categoryId,
      storefrontSortOrder: g.storefrontSortOrder ?? r.storefrontSortOrder,
      cokSatan: uyeler.some((x) => x.p.cokSatan) || undefined,
      href: grupYolu(g.slug, bulunanBarkod ? secimSorgusu(eksenler, temsil.u) : undefined),
      grup: {
        secenekEtiketi: secenekEtiketi(eksenler, uyeler.map((x) => x.u)),
        fiyatFarkli: uyeler.some((x) => x.p.listPriceCents !== enUcuz.p.listPriceCents),
        stoktaVar: uyeler.some((x) => x.satilabilir),
      },
    };
  };

  const islenen = new Set<string>();
  const sonuc: StorefrontProductSummary[] = [];
  for (const p of liste) {
    const g = grupByBarcode.get(p.barcode);
    if (!g) {
      sonuc.push(p);
      continue;
    }
    if (islenen.has(g.id) || kategoriDisi(g)) continue;
    islenen.add(g.id);
    const k = kart(g, o.arama ? p.barcode : null);
    if (k) sonuc.push(k);
  }
  // Kategoriye grubun kendi kategorisiyle giren (üyeleri listede olmayan) gruplar: varsayılan sırada yerine, "yeni"de sona.
  if (kategoriyleEkle) {
    for (const g of gruplar) {
      if (islenen.has(g.id) || kategoriDisi(g) || !g.categoryId) continue;
      islenen.add(g.id);
      const k = kart(g, null);
      if (!k) continue;
      const yer = o.sort === "yeni" ? -1 : sonuc.findIndex((x) => varsayilanSiraKarsilastir(k, x) < 0);
      if (yer < 0) sonuc.push(k);
      else sonuc.splice(yer, 0, k);
    }
  }
  return sonuc;
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

// Ana sayfa ürün satırları (Çok Satanlar, Yeni Eklenenler) yalnız sitede SATILABİLİR ürünleri gösterir (kullanıcı kararı
// 2026-10-12, yalnizSatilabilir seçeneği): stoksuz ürün satırdan çıkar, yerine sıradaki gelir. Kural ürün kartındaki "Stokta yok" ile aynı — en küçük açık
// satış biriminin içeriği kadar e-ticaret stoğu (bkz. components/ProductCard.tsx inStock). Ürün listesi/kategori sayfaları
// (/cok-satanlar dahil) bu süzgeçten geçmez; orada stoksuz ürünler görünmeye devam eder.
function satilabilir(p: StorefrontProductSummary): boolean {
  return p.stock >= (p.satisBirimleri?.[0]?.adet ?? 1);
}

// Anasayfadaki "Yeni Eklenen Ürünler" bölümü — storefrontSortOrder'dan
// bağımsız, sadece en son storefront'a eklenmiş/güncellenmiş ürünleri
// vitrine taşımak için (küçük bir kataloğa "hareket" hissi katıyor).
export async function getNewArrivals(limit: number, { yalnizSatilabilir = false } = {}): Promise<StorefrontProductSummary[]> {
  if (isDemoMode()) return demoNewArrivals(limit);
  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);
  // Stoksuzlar süzüldüğü için sayfa sayfa okunur: satır dolana ya da yayındaki ürünler bitene kadar (en fazla 5 sayfa).
  const sayfa = limit * 2;
  const secilen: StorefrontProductSummary[] = [];
  for (let i = 0; i < 5 && secilen.length < limit; i++) {
    const products = await prisma.product.findMany({
      where: { storeId, archivedAt: null, showOnStorefront: true },
      select: BASE_SELECT,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: i * sayfa,
      take: sayfa,
    });
    const ozet = (await eticaretStokuUygula(prisma, products)).map((p) => toSummary(p, markupPercent));
    secilen.push(...(yalnizSatilabilir ? ozet.filter(satilabilir) : ozet));
    if (products.length < sayfa) break;
  }
  // Üye bazlı liste (varyant, 2026-10): grup üyesi kendi kartıyla kalır, bağlantısı grup adresine (+ seçim) gider.
  return grupBaglantilariniUygula(await cokSatanIsaretle(secilen.slice(0, limit)));
}

// Ürün detay sayfasındaki "Benzer Ürünler" bölümü — aynı kategoriden,
// mevcut ürün hariç. Ürün grubu sayfasında grubun kendi üyeleri de hariç (excludeBarcodes).
export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit: number,
  excludeBarcodes: string[] = []
): Promise<StorefrontProductSummary[]> {
  if (!categoryId) return [];
  if (isDemoMode()) return demoRelatedProducts(categoryId, excludeId, limit);
  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);
  // Görselli ürünler önce; görselsiz (yer tutuculu) ürünler yalnız liste dolmazsa ve EN SONDA gösterilir —
  // gerçek fotoğrafların yanında yer tutucu göze batıyordu (tasarım turu 2026-10).
  const where = {
    storeId,
    archivedAt: null,
    showOnStorefront: true,
    categoryId,
    id: { not: excludeId },
    ...(excludeBarcodes.length > 0 ? { barcode: { notIn: excludeBarcodes } } : {}),
  };
  const orderBy = [{ storefrontSortOrder: "asc" as const }, { name: "asc" as const }];
  const gorselli = await prisma.product.findMany({ where: { ...where, images: { some: {} } }, select: BASE_SELECT, orderBy, take: limit });
  const gorselsiz =
    gorselli.length < limit
      ? await prisma.product.findMany({ where: { ...where, images: { none: {} } }, select: BASE_SELECT, orderBy, take: limit - gorselli.length })
      : [];
  return grupBaglantilariniUygula(
    await cokSatanIsaretle((await eticaretStokuUygula(prisma, [...gorselli, ...gorselsiz])).map((p) => toSummary(p, markupPercent)))
  );
}

// Header'daki yazarken-öneri kutusu için — KASITLI OLARAK fiyat alanı
// döndürmüyor. Üye/misafir fiyat farkı bu proje için en kritik kural
// (bkz. proje kısıtı): fiyat göstermek her yerde resolvePrice+üyelik
// bilgisinden geçmeli, öneri kutusu gibi ufak/hızlı bir bileşende bu riske
// hiç girmemek en güvenlisi — görsel + isim + marka yeterli.
export type SearchSuggestion = {
  id: string;
  slug: string | null;
  // Grup kartı ya da grup üyesi: grup adresi (+ bulunan üyenin seçimi). Boşsa ürün adresi.
  href?: string;
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

export async function getBestSellers(limit: number, { yalnizSatilabilir = false } = {}): Promise<StorefrontProductSummary[]> {
  if (isDemoMode()) return demoBestSellers(limit);
  // Sıra günde bir hesaplanır (bkz. lib/bestSellerRanking.ts — pazarlama + online, son 90 gün, belge sayısı);
  // ürün bilgisi (fiyat, stok, yayın) her istekte güncel okunur. Yayında olmayanlar atlanır.
  const [ranking, storeId, markupPercent] = await Promise.all([
    getBestSellerRanking(),
    getOnlineStoreId(),
    getOnlineFiyatArtisOrani(),
  ]);
  if (ranking.length === 0) return [];

  const products = await eticaretStokuUygula(
    prisma,
    await prisma.product.findMany({
      where: { storeId, showOnStorefront: true, archivedAt: null, barcode: { in: ranking.map((r) => r.barcode) } },
      select: BASE_SELECT,
    })
  );
  const byBarcode = new Map(products.map((p) => [p.barcode, p]));
  // Bu listede rozet işaretlenmez: "Çok Satanlar" başlığı aynı bilgiyi zaten veriyor (her kartta rozet gürültü olurdu).
  // Üye bazlı liste (varyant, 2026-10): grup üyesi kendi kartıyla kalır, bağlantısı grup adresine (+ seçim) gider.
  return grupBaglantilariniUygula(
    ranking
      .map((r) => byBarcode.get(r.barcode))
      .filter((p) => p !== undefined)
      .map((p) => toSummary(p, markupPercent))
      .filter((p) => !yalnizSatilabilir || satilabilir(p))
      .slice(0, limit)
  );
}

// Anasayfa marka şeridi (kullanıcı kararı 2026-10-07): ELLE tanımlı, tanınırlığa göre sabit 20 markalık sıra — üstte ofis
// sarf markaları, lüks/teknik kalem altta. Bu liste yalnız HANGİ markaların ve hangi SIRAYLA gösterileceğini belirler;
// gösterilen ad veritabanındaki marka adıdır (2026-10-13 — kart ve ürün sayfasıyla aynı yazım, ör. "BIC"). Eşleştirme
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
  const byKey = new Map(brands.map((b) => [markaAnahtari(b.name), b]));
  return VITRIN_MARKALARI.flatMap((ad) => {
    const brand = byKey.get(markaAnahtari(ad));
    return brand ? [{ id: brand.id, name: brand.name }] : [];
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
  slug: true,
  name: true,
  // CRM'de girilen SEO başlığı/açıklaması (2026-10-13'e kadar seçilmiyordu → sayfa başlığı hep ürün adından üretiliyordu).
  seoTitle: true,
  seoDescription: true,
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
  // Kapak önce (vitrin kartıyla aynı görselle başlasın), sonra CRM'de sürükle-bırakla verilen sıra.
  images: {
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] as Prisma.ProductImageOrderByWithRelationInput[],
    select: { id: true, url: true, altText: true },
  },
  brand: { select: { name: true } },
  category: { select: { name: true } },
} as const;

// Detayda stok Ana Depo'dan (e-ticaret kuralı) — bkz. StorefrontProductSummary.stock.
async function detayStogu<T extends { barcode: string; stock: number }>(p: T | null): Promise<T | null> {
  if (!p) return null;
  return (await eticaretStokuUygula(prisma, [p]))[0];
}

export async function getStorefrontProductBySlug(slug: string) {
  if (isDemoMode()) return demoProductBySlugOrId(slug);
  const storeId = await getOnlineStoreId();
  return detayStogu(
    await prisma.product.findFirst({
      where: { storeId, slug, showOnStorefront: true, archivedAt: null },
      select: DETAIL_SELECT,
    })
  );
}

// Fallback for a showOnStorefront product that was never given a slug —
// ProductCard links here (/urun/id/[id]) instead of /urun/[slug] whenever
// product.slug is null, so nothing ever 404s just because a slug is missing.
export async function getStorefrontProductById(id: string) {
  if (isDemoMode()) return demoProductBySlugOrId(id);
  const storeId = await getOnlineStoreId();
  return detayStogu(
    await prisma.product.findFirst({
      where: { id, storeId, showOnStorefront: true, archivedAt: null },
      select: DETAIL_SELECT,
    })
  );
}

// Kategori sayfasının başlık/açıklaması için (2026-10-13): kategori adı, ana kategorisi, yayındaki ürün sayısı ve en çok
// ürünü olan 3 marka. Ana kategoride alt kategorilerin ürünleri de sayılır. Bilinmeyen kategori → null.
export const getKategoriSeoBilgisi = cache(
  async (kategoriId: string): Promise<{ ad: string; ustAd: string | null; urunSayisi: number; markalar: string[]; altKategoriler: string[] } | null> => {
    if (isDemoMode()) return null;
    const gruplar = await getStorefrontCategoriesWithCounts();
    const ana = gruplar.find((g) => g.id === kategoriId);
    const alt = ana ? null : gruplar.flatMap((g) => g.children.map((c) => ({ c, g }))).find((x) => x.c.id === kategoriId);
    if (!ana && !alt) return null;
    const kategoriIdleri = ana ? [ana.id, ...ana.children.map((c) => c.id)] : [kategoriId];
    const storeId = await getOnlineStoreId();
    const sayim = await prisma.product.groupBy({
      by: ["brandId"],
      where: { storeId, showOnStorefront: true, archivedAt: null, categoryId: { in: kategoriIdleri }, brandId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { brandId: "desc" } },
      take: 3,
    });
    const markalar = await prisma.brand.findMany({
      where: { id: { in: sayim.map((s) => s.brandId!) } },
      select: { id: true, name: true },
    });
    const ad = new Map(markalar.map((m) => [m.id, m.name]));
    return {
      ad: ana ? ana.name : alt!.c.name,
      ustAd: alt ? alt.g.name : null,
      urunSayisi: ana ? ana.count : alt!.c.count,
      markalar: sayim.map((s) => ad.get(s.brandId!)).filter((x): x is string => Boolean(x)),
      altKategoriler: ana ? ana.children.map((c) => c.name) : [],
    };
  }
);
