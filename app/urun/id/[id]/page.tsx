import type { Metadata } from "next";
import { getStorefrontProductById } from "@/lib/search";
import { urunMetasi } from "@/lib/seo";
import { grupUyesiyseYonlendir } from "@/lib/urunSayfasi";
import ProductDetail from "@/components/ProductDetail";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Görünür bir Ürün Grubu'nun üyesi bu adresten açılırsa grup adresine 308 (varyant, 2026-10; bkz. lib/urunSayfasi.ts).
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getStorefrontProductById(id);
  if (!product) return {};
  await grupUyesiyseYonlendir(product.barcode, await searchParams);
  return urunMetasi(product);
}

export default async function UrunIdPage({ params, searchParams }: Props) {
  const { id } = await params;
  const product = await getStorefrontProductById(id);
  await grupUyesiyseYonlendir(product?.barcode, await searchParams);
  return <ProductDetail product={product} />;
}
