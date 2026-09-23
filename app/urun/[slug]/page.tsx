import type { Metadata } from "next";
import { getStorefrontProductBySlug } from "@/lib/search";
import { resolveSeoTitle, resolveSeoDescription } from "@/lib/seo";
import ProductDetail from "@/components/ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) return {};
  return { title: resolveSeoTitle(product), description: resolveSeoDescription(product) };
}

export default async function UrunSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  return <ProductDetail product={product} />;
}
