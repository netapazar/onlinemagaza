import { getStorefrontProductById } from "@/lib/search";
import ProductDetail from "@/components/ProductDetail";

export default async function UrunIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getStorefrontProductById(id);
  return <ProductDetail product={product} />;
}
