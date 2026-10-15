import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getOnlineStoreId, getOnlineFiyatArtisOrani } from "@/lib/onlineStore";
import { computeListPriceCents } from "@/lib/pricing";
import { eticaretStokuUygula } from "@/lib/depoStok";
import { urunSatisBirimleri, type SatisBirimi } from "@/lib/satisBirimleri";
import { isDemoMode } from "@/lib/demoData";
import { grupYolu, secimSorgusu } from "@/lib/urunGrubuCore";

// Varyant (Ürün Grubu, 2026-10) — vitrin tarafı veri erişimi. Grup stoksuz bir üst kayıttır; renk/ebat kartları (Product)
// olduğu gibi kalır. Grup ile Product arasında FK yok, bağ BARKOD: üyenin online satırı = Online Mağaza'daki aynı barkodlu
// Product. Fiyat ASLA gruptan gelmez (her üye kendi online satırından, computeListPriceCents); stok Ana Depo'dan
// (eticaretStokuUygula). İçerik alanları (kısa açıklama, açıklama, özellikler, SEO) üyede boşsa gruptan okunur.
//
// Görünürlük: grup showOnStorefront && archivedAt null; üye = online satırı yayında (showOnStorefront, archivedAt null —
// vitrinin mevcut ürün görünürlük kuralı; needsReview bu kurala bugün dahil değil, o yüzden burada da değil). En az bir
// görünür üyesi olmayan grup görünür sayılmaz.

export const GORUNUR_GRUP = { showOnStorefront: true, archivedAt: null } satisfies Prisma.UrunGrubuWhereInput;

// Grup sayfasında üye başına okunan alanlar — bilerek `select` (needsReview/reviewNote gibi CRM içi alanlar sayfaya girmesin,
// bkz. lib/search.ts DETAIL_SELECT gerekçesi).
const UYE_SELECT = {
  id: true,
  slug: true,
  name: true,
  barcode: true,
  barcodeIsGenerated: true,
  productCode: true,
  salePriceCents: true,
  onlinePriceCents: true,
  stock: true,
  paketliSatis: true,
  satisBirimleri: true,
  unit: true,
  packageInfo: true,
  shortDescription: true,
  description: true,
  features: true,
  seoTitle: true,
  seoDescription: true,
  categoryId: true,
  brand: { select: { name: true } },
  category: { select: { id: true, name: true } },
  images: {
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] as Prisma.ProductImageOrderByWithRelationInput[],
    select: { id: true, url: true, altText: true },
  },
} as const;

type UyeUrunu = Prisma.ProductGetPayload<{ select: typeof UYE_SELECT }>;

export type GrupSayfaUyesi = {
  uyeId: string;
  eksen1Deger: string;
  eksen2Deger: string | null;
  renkHex: string | null;
  varsayilan: boolean;
  urun: UyeUrunu;
  listPriceCents: number;
  satisBirimleri: SatisBirimi[] | null;
  satilabilir: boolean;
};

export type GrupSayfaVerisi = {
  id: string;
  ad: string;
  slug: string;
  eksen1Ad: string;
  eksen2Ad: string | null;
  shortDescription: string | null;
  description: string | null;
  features: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  // Grubun; boşsa ilk görünür üyenin.
  brand: { name: string } | null;
  category: { id: string; name: string } | null;
  gorseller: { id: string; url: string; altText: string | null }[];
  uyeler: GrupSayfaUyesi[];
  updatedAt: Date;
};

// Satılabilir: en küçük açık satış biriminin içeriği kadar e-ticaret stoğu (ürün kartı / detaydaki kuralla aynı).
const satilabilirMi = (stock: number, birimler: SatisBirimi[] | null) => stock >= (birimler?.[0]?.adet ?? 1);

// Görünür grubu slug'la, görünür üyeleri (sıralı), fiyatları ve stoklarıyla yükler; görünür değilse ya da görünür üyesi
// yoksa null. cache(): generateMetadata ve sayfa aynı istekte tek sorgu.
export const getGorunurGrupBySlug = cache(async (slug: string): Promise<GrupSayfaVerisi | null> => {
  if (isDemoMode()) return null;
  const grup = await prisma.urunGrubu.findFirst({
    where: { slug, ...GORUNUR_GRUP },
    select: {
      id: true,
      ad: true,
      slug: true,
      eksen1Ad: true,
      eksen2Ad: true,
      shortDescription: true,
      description: true,
      features: true,
      seoTitle: true,
      seoDescription: true,
      updatedAt: true,
      brand: { select: { name: true } },
      category: { select: { id: true, name: true } },
      gorseller: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        select: { id: true, url: true, altText: true },
      },
      uyeler: {
        orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
        select: { id: true, barcode: true, eksen1Deger: true, eksen2Deger: true, renkHex: true, varsayilan: true },
      },
    },
  });
  if (!grup || grup.uyeler.length === 0) return null;

  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);
  const urunler = await eticaretStokuUygula(
    prisma,
    await prisma.product.findMany({
      where: { storeId, showOnStorefront: true, archivedAt: null, barcode: { in: grup.uyeler.map((u) => u.barcode) } },
      select: UYE_SELECT,
    })
  );
  const byBarcode = new Map(urunler.map((p) => [p.barcode, p]));
  const uyeler: GrupSayfaUyesi[] = grup.uyeler.flatMap((u) => {
    const urun = byBarcode.get(u.barcode);
    if (!urun) return [];
    const satisBirimleri = urunSatisBirimleri(urun);
    return [
      {
        uyeId: u.id,
        eksen1Deger: u.eksen1Deger,
        eksen2Deger: u.eksen2Deger?.trim() || null,
        renkHex: u.renkHex && /^#[0-9a-fA-F]{6}$/.test(u.renkHex) ? u.renkHex : null,
        varsayilan: u.varsayilan,
        urun,
        listPriceCents: computeListPriceCents(urun, markupPercent),
        satisBirimleri,
        satilabilir: satilabilirMi(urun.stock, satisBirimleri),
      },
    ];
  });
  if (uyeler.length === 0) return null;

  return {
    id: grup.id,
    ad: grup.ad,
    slug: grup.slug,
    eksen1Ad: grup.eksen1Ad,
    eksen2Ad: grup.eksen2Ad?.trim() || null,
    shortDescription: grup.shortDescription,
    description: grup.description,
    features: grup.features,
    seoTitle: grup.seoTitle,
    seoDescription: grup.seoDescription,
    brand: grup.brand ?? uyeler.find((u) => u.urun.brand)?.urun.brand ?? null,
    category: grup.category ?? uyeler.find((u) => u.urun.category)?.urun.category ?? null,
    gorseller: grup.gorseller,
    uyeler,
    updatedAt: grup.updatedAt,
  };
});

export type UyeGrupBaglantisi = { grupId: string; grupSlug: string; href: string };

// Barkod → (görünür) grubundaki adresi, toplu tek sorgu. Üye bazlı listeler (Öne Çıkanlar, Çok Satanlar, Benzer, Favoriler,
// Sık Aldıklarım) ve eski üye adresinin 308 yönlendirmesi bunu kullanır. Çağıranlar yayındaki ürünlerden geldiği için grubun
// "en az bir görünür üyesi var" şartı zaten sağlanmış olur.
export async function uyeGrupBaglantilari(barkodlar: string[]): Promise<Map<string, UyeGrupBaglantisi>> {
  const tekil = [...new Set(barkodlar.filter(Boolean))];
  if (tekil.length === 0 || isDemoMode()) return new Map();
  const uyeler = await prisma.urunGrubuUyesi.findMany({
    where: { barcode: { in: tekil }, grup: GORUNUR_GRUP },
    select: {
      barcode: true,
      eksen1Deger: true,
      eksen2Deger: true,
      grup: { select: { id: true, slug: true, eksen1Ad: true, eksen2Ad: true } },
    },
  });
  return new Map(
    uyeler.map((u) => [
      u.barcode,
      {
        grupId: u.grup.id,
        grupSlug: u.grup.slug,
        href: grupYolu(u.grup.slug, secimSorgusu({ eksen1Ad: u.grup.eksen1Ad, eksen2Ad: u.grup.eksen2Ad?.trim() || null }, u)),
      },
    ])
  );
}

// Üye bazlı listelerde kartın bağlantısını grup adresine (+ seçim parametreleri) çevirir; grupta olmayan ürün aynen kalır.
export async function grupBaglantilariniUygula<T extends { barcode: string; href?: string }>(liste: T[]): Promise<T[]> {
  const harita = await uyeGrupBaglantilari(liste.map((p) => p.barcode));
  return harita.size === 0 ? liste : liste.map((p) => {
    const b = harita.get(p.barcode);
    return b ? { ...p, href: b.href } : p;
  });
}

// Site haritası için: görünür grupların adresleri (en az bir yayındaki üyesi olanlar) ve haritadan çıkacak üye barkodları.
export async function siteHaritasiGruplari(yayindakiBarkodlar: Set<string>): Promise<{
  gruplar: { slug: string; updatedAt: Date }[];
  uyeBarkodlari: Set<string>;
}> {
  if (isDemoMode()) return { gruplar: [], uyeBarkodlari: new Set() };
  const gruplar = await prisma.urunGrubu.findMany({
    where: GORUNUR_GRUP,
    select: { slug: true, updatedAt: true, uyeler: { select: { barcode: true } } },
    orderBy: { ad: "asc" },
  });
  const gorunur = gruplar.filter((g) => g.uyeler.some((u) => yayindakiBarkodlar.has(u.barcode)));
  return {
    gruplar: gorunur.map((g) => ({ slug: g.slug, updatedAt: g.updatedAt })),
    uyeBarkodlari: new Set(gorunur.flatMap((g) => g.uyeler.map((u) => u.barcode))),
  };
}
