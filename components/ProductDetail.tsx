import { notFound } from "next/navigation";
import { resolvePrice, centsToTl } from "@/lib/pricing";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import ProductGallery from "@/components/ProductGallery";
import MembershipBanner from "@/components/MembershipBanner";
import AddToCartButton from "@/components/AddToCartButton";

type Product = {
  id: string;
  name: string;
  description: string | null;
  salePriceCents: number;
  onlinePriceCents: number | null;
  stock: number;
  images: { id: string; url: string; altText: string | null }[];
  brand: { name: string } | null;
  category: { name: string } | null;
} | null;

export default async function ProductDetail({ product }: { product: Product }) {
  if (!product) notFound();

  const memberDiscountPercent = await getMemberDiscountPercent();
  const price = resolvePrice(product, memberDiscountPercent);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="grid gap-8 sm:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {product.brand && <p className="mb-1 text-sm text-neutral-400">{product.brand.name}</p>}
          <h1 className="mb-3 text-xl font-semibold text-neutral-900">{product.name}</h1>

          <div className="mb-4 flex items-baseline gap-3">
            {price.discounted && (
              <span className="text-sm text-neutral-400 line-through">{centsToTl(price.listCents)} ₺</span>
            )}
            <span className="text-2xl font-semibold text-neutral-900">{centsToTl(price.displayCents)} ₺</span>
            {price.discounted && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {`Üye fiyatı · %${price.discountPercent}`}
              </span>
            )}
          </div>

          {product.stock > 0 ? (
            <p className="mb-4 text-sm text-emerald-700">Stokta var</p>
          ) : (
            <p className="mb-4 text-sm font-medium text-red-600">Stokta yok</p>
          )}

          {product.description && (
            <p className="mb-6 whitespace-pre-line text-sm text-neutral-600">{product.description}</p>
          )}

          <AddToCartButton productId={product.id} stock={product.stock} />

          {memberDiscountPercent === null && (
            <div className="mt-6">
              <MembershipBanner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
