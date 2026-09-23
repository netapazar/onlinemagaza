import type { Metadata } from "next";
import { getStorefrontProductById } from "@/lib/search";
import { resolveSeoTitle, resolveSeoDescription } from "@/lib/seo";
import ProductDetail from "@/components/ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getStorefrontProductById(id);
  if (!product) return {};
  return { title: resolveSeoTitle(product), description: resolveSeoDescription(product) };
}

export default async function UrunIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getStorefrontProductById(id);
  return <ProductDetail product={product} />;
}
