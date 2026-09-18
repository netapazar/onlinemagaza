import { getStorefrontProductBySlug } from "@/lib/search";
import ProductDetail from "@/components/ProductDetail";

export default async function UrunSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  return <ProductDetail product={product} />;
}
