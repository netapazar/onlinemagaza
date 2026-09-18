import { prisma } from "@/lib/prisma";
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

const BASE_SELECT = {
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

function toSummary(p: {
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

// Kataloğun küçüklüğü (faz 1: ~50 ürün) nedeniyle magaza-crm'in productSearch.ts'indeki
// brandId-önceden-çözme trigram-performans optimizasyonu burada gerekmiyor —
// brand adı doğrudan join'de aranıyor. Çok-kelimeli AND/OR mantığı ve
// Türkçe I-varyant genişletmesi aynı (bkz. turkishSearch.ts).
async function keywordWhere(query: string) {
  const keywords = query.trim().split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return null;
  return {
    AND: keywords.map((kw) => {
      const variants = expandTurkishIVariants(kw);
      return {
        OR: variants.flatMap((v) => [
          { name: { contains: v, mode: "insensitive" as const } },
          { description: { contains: v, mode: "insensitive" as const } },
          { brand: { name: { contains: v, mode: "insensitive" as const } } },
          { category: { name: { contains: v, mode: "insensitive" as const } } },
        ]),
      };
    }),
  };
}

export async function listStorefrontProducts(options: {
  query?: string;
  categoryId?: string;
} = {}): Promise<StorefrontProductSummary[]> {
  const storeId = await getOnlineStoreId();
  const keywords = options.query ? await keywordWhere(options.query) : null;

  const products = await prisma.product.findMany({
    where: {
      storeId,
      archivedAt: null,
      showOnStorefront: true,
      ...(options.categoryId ? { categoryId: options.categoryId } : {}),
      ...(keywords ?? {}),
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
