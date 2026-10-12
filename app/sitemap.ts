import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getOnlineStoreId } from "@/lib/onlineStore";
import { getStorefrontCategoriesWithCounts } from "@/lib/search";
import { isDemoMode } from "@/lib/demoData";
import { SITE_URL } from "@/lib/seo";

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
      select: { id: true, slug: true, updatedAt: true },
      orderBy: { name: "asc" },
    }),
    getStorefrontCategoriesWithCounts(),
  ]);

  const kategoriler = gruplar.flatMap((g) => [g.id, ...g.children.map((c) => c.id)]);
  return [
    ...sayfalar,
    ...kategoriler.map((id) => ({ url: `${SITE_URL}/urunler?kategori=${id}` })),
    ...urunler.map((u) => ({
      url: `${SITE_URL}${u.slug ? `/urun/${u.slug}` : `/urun/id/${u.id}`}`,
      lastModified: u.updatedAt,
    })),
  ];
}
