import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getOnlineStoreId } from "@/lib/onlineStore";
import { getStorefrontCategoriesWithCounts } from "@/lib/search";
import { isDemoMode } from "@/lib/demoData";
import { SITE_URL } from "@/lib/seo";
import { siteHaritasiGruplari } from "@/lib/urunGrubu";

// sitemap.xml (2026-10-12): yayındaki ürünler, yayında ürünü olan kategoriler (ana + alt) ve içerik sayfaları. Filtreli liste
// adresleri YOK (bkz. app/robots.ts). Saatte bir yeniden üretilir — botların her okuması veritabanına gitmesin.
export const revalidate = 3600;

const ICERIK_SAYFALARI = [
  "/",
  "/urunler",
  "/cok-satanlar",
  "/hakkimizda",
  "/sss",
  "/hukuki/mesafeli-satis-sozlesmesi",
  "/hukuki/teslimat-ve-iade",
  "/hukuki/gizlilik-politikasi",
  "/hukuki/kvkk",
  "/hukuki/cerez-politikasi",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sayfalar: MetadataRoute.Sitemap = ICERIK_SAYFALARI.map((yol) => ({ url: `${SITE_URL}${yol}` }));
  if (isDemoMode()) return sayfalar;

  const storeId = await getOnlineStoreId();
  const [urunler, gruplar] = await Promise.all([
    prisma.product.findMany({
      where: { storeId, showOnStorefront: true, archivedAt: null },
      select: { id: true, slug: true, barcode: true, updatedAt: true },
      orderBy: { name: "asc" },
    }),
    getStorefrontCategoriesWithCounts(),
  ]);

  // Varyant (2026-10): görünür Ürün Grubu adresi haritada; üyelerin kendi adresleri (grup adresine 308 yönlenir) çıkar.
  const urunGruplari = await siteHaritasiGruplari(new Set(urunler.map((u) => u.barcode)));
  const kategoriler = gruplar.flatMap((g) => [g.id, ...g.children.map((c) => c.id)]);
  return [
    ...sayfalar,
    ...kategoriler.map((id) => ({ url: `${SITE_URL}/urunler?kategori=${id}` })),
    ...urunGruplari.gruplar.map((g) => ({ url: `${SITE_URL}/urun/${g.slug}`, lastModified: g.updatedAt })),
    ...urunler.filter((u) => !urunGruplari.uyeBarkodlari.has(u.barcode)).map((u) => ({
      url: `${SITE_URL}${u.slug ? `/urun/${u.slug}` : `/urun/id/${u.id}`}`,
      lastModified: u.updatedAt,
    })),
  ];
}
