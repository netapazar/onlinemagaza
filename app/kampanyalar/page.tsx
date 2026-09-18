import { listStorefrontProducts } from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import { resolvePrice } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";

// İndirim/kampanya rozeti sadece üyeler için anlamlı — resolvePrice, üyelik
// bilgisi olmayan bir ziyaretçi için discounted:false döndürür (bkz. proje
// kısıtı: misafir asla üye fiyatı görmemeli). Bu sayfa da aynı fonksiyonu
// kullanıyor, yeni bir fiyat/indirim hesaplama mantığı icat edilmedi.
export default async function KampanyalarPage() {
  const memberDiscountPercent = await getMemberDiscountPercent();
  const allProducts = await listStorefrontProducts();
  const discounted = allProducts.filter((p) => resolvePrice(p, memberDiscountPercent).discounted);

  return (
    <div className="mx-auto w-full max-w-content px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-neutral-900">Kampanyalı Ürünler</h1>

      {discounted.length === 0 ? (
        <EmptyState
          title={
            memberDiscountPercent === null
              ? "Kampanyalı fiyatlar üyelere özel"
              : "Şu anda aktif bir kampanya bulunmuyor"
          }
          description={
            memberDiscountPercent === null
              ? "Firma/işletme üyeliği başvurusu yaparak size özel indirimli fiyatları görebilirsiniz."
              : "Yeni kampanyalar eklendiğinde burada listelenecek."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {discounted.map((product) => (
            <ProductCard key={product.id} product={product} memberDiscountPercent={memberDiscountPercent} />
          ))}
        </div>
      )}
    </div>
  );
}
