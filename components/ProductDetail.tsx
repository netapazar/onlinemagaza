import { notFound } from "next/navigation";
import { Truck, Clock } from "lucide-react";
import { resolvePrice, computeListPriceCents, centsToTl } from "@/lib/pricing";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import { getMembershipStatus } from "@/lib/membershipStatus";
import { getOnlineFiyatArtisOrani } from "@/lib/onlineStore";
import { getRelatedProducts } from "@/lib/search";
import { isBeforeShippingCutoff } from "@/lib/shipping";
import { trTitle } from "@/lib/text";
import { unitLabel } from "@/lib/units";
import ProductGallery from "@/components/ProductGallery";
import ProductMembershipBox from "@/components/ProductMembershipBox";
import CorporatePriceHint from "@/components/MemberHint";
import AddToCartButton from "@/components/AddToCartButton";
import ProductTabs from "@/components/ProductTabs";
import ProductRow from "@/components/ProductRow";

type Product = {
  id: string;
  name: string;
  description: string | null;
  salePriceCents: number;
  onlinePriceCents: number | null;
  stock: number;
  barcode: string;
  barcodeIsGenerated?: boolean;
  productCode?: string | null;
  packageInfo?: string | null;
  unit: string;
  categoryId: string | null;
  images: { id: string; url: string; altText: string | null }[];
  brand: { name: string } | null;
  category: { name: string } | null;
} | null;

export default async function ProductDetail({ product }: { product: Product }) {
  if (!product) notFound();

  const [memberDiscountPercent, membershipStatus, relatedProducts, markupPercent] = await Promise.all([
    getMemberDiscountPercent(),
    getMembershipStatus(),
    getRelatedProducts(product.categoryId, product.id, 8),
    getOnlineFiyatArtisOrani(),
  ]);
  const listPriceCents = computeListPriceCents(product, markupPercent);
  const price = resolvePrice({ listPriceCents }, memberDiscountPercent);
  const sameDayShipping = product.stock > 0 && isBeforeShippingCutoff();

  // Kurumsal alıcının hızlı bakacağı künye satırı. İç üretim (barcodeIsGenerated) barkodlar üreticiye ait olmadığı ve
  // müşteriye anlam taşımadığı için bu satırda gösterilmez (aşağıdaki "Özellikler" sekmesinde yine listelenir).
  const meta = [
    product.productCode ? { label: "Ürün kodu", value: product.productCode } : null,
    product.barcode && !product.barcodeIsGenerated ? { label: "Barkod", value: product.barcode } : null,
    { label: "Satış birimi", value: unitLabel(product.unit) },
    product.packageInfo ? { label: "Paket içeriği", value: product.packageInfo } : null,
  ].filter((m): m is { label: string; value: string } => m !== null);

  const specs = [
    product.brand ? { label: "Marka", value: product.brand.name } : null,
    product.category ? { label: "Kategori", value: trTitle(product.category.name) } : null,
    product.productCode ? { label: "Ürün Kodu", value: product.productCode } : null,
    { label: "Satış Birimi", value: unitLabel(product.unit) },
    product.packageInfo ? { label: "Paket İçeriği", value: product.packageInfo } : null,
    { label: "Barkod", value: product.barcode },
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-8 sm:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {product.brand && <p className="mb-1 text-sm text-neutral-400">{product.brand.name}</p>}
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">{product.name}</h1>
          <p className="mb-3 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-500">
            {meta.map((m) => (
              <span key={m.label}>
                {m.label}: <span className="font-medium text-neutral-700">{m.value}</span>
              </span>
            ))}
          </p>

          <div className="mb-1 flex items-baseline gap-3">
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
          <p className="text-xs text-neutral-400">KDV Dahil</p>
          <CorporatePriceHint className="mt-1" />

          {product.stock > 0 ? (
            <p className="mt-3 mb-4 text-sm text-emerald-700">Stokta var</p>
          ) : (
            <p className="mt-3 mb-4 text-sm font-medium text-red-600">Stokta yok</p>
          )}

          <div className="mb-5">
            <AddToCartButton productId={product.id} stock={product.stock} name={product.name} />
          </div>

          <div className="mb-5 space-y-2 rounded-xl border border-neutral-200 p-4 text-sm">
            <div className="flex items-center gap-2 text-neutral-700">
              <Truck className="h-4 w-4 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
              Tüm siparişlerde ücretsiz kargo
            </div>
            {sameDayShipping && (
              <div className="flex items-center gap-2 text-neutral-700">
                <Clock className="h-4 w-4 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
                Bugün 13:30&apos;a kadar verilen siparişler bugün kargoya çıkar
              </div>
            )}
          </div>

          {/* Eskiden iki ayrı mesaj vardı (cari hesap notu + üyelik başvuru kutusu); tek, derli toplu kutuda birleştirildi. */}
          <ProductMembershipBox status={membershipStatus} />
        </div>
        </div>

        <ProductTabs description={product.description} specs={specs} />
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <ProductRow title="Benzer Ürünler" products={relatedProducts} memberDiscountPercent={memberDiscountPercent} />
        </div>
      )}
    </div>
  );
}
