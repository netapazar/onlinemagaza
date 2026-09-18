import { listStorefrontProducts } from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";

export default async function AraPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [products, memberDiscountPercent] = await Promise.all([
    query ? listStorefrontProducts({ query }) : Promise.resolve([]),
    getMemberDiscountPercent(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-sm text-neutral-500">
        {`"${query}" için ${products.length} sonuç`}
      </h1>

      {products.length === 0 ? (
        <EmptyState
          title="Aramanızla eşleşen ürün bulunamadı"
          description="Farklı bir anahtar kelime deneyin ya da kategorilere göz atın."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} memberDiscountPercent={memberDiscountPercent} />
          ))}
        </div>
      )}
    </div>
  );
}
