import { getBestSellers } from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";

const LIMIT = 40;

export default async function CokSatanlarPage() {
  const [products, memberDiscountPercent] = await Promise.all([
    getBestSellers(LIMIT),
    getMemberDiscountPercent(),
  ]);

  return (
    <div className="mx-auto w-full max-w-content px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">Çok Satanlar</h1>

      {products.length === 0 ? (
        <EmptyState
          title="Henüz yeterli satış verisi yok"
          description="Mağazamız yeni açıldı — siparişler birikince en çok tercih edilen ürünler burada listelenecek."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} memberDiscountPercent={memberDiscountPercent} />
          ))}
        </div>
      )}
    </div>
  );
}
