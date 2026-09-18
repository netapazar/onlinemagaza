import Link from "next/link";
import { listStorefrontProducts, getStorefrontCategories } from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import ProductCard from "@/components/ProductCard";
import MembershipBanner from "@/components/MembershipBanner";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const [products, categories, memberDiscountPercent] = await Promise.all([
    listStorefrontProducts({ categoryId: kategori }),
    getStorefrontCategories(),
    getMemberDiscountPercent(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {memberDiscountPercent === null && (
        <div className="mb-6">
          <MembershipBanner />
        </div>
      )}

      {categories.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/"
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              !kategori
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            Tümü
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?kategori=${c.id}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                kategori === c.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">
          Şu anda burada gösterilecek ürün yok.
        </p>
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
