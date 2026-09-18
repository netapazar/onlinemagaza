"use client";

import { useEffect, useState } from "react";
import { useFavorites } from "@/components/FavoritesProvider";
import { getStorefrontProductsByIds, getMemberDiscountPercentAction } from "@/lib/storefrontActions";
import type { StorefrontProductSummary } from "@/lib/search";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";

export default function FavorilerPage() {
  const { ids } = useFavorites();
  const [products, setProducts] = useState<StorefrontProductSummary[] | null>(null);
  const [memberDiscountPercent, setMemberDiscountPercent] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStorefrontProductsByIds(ids), getMemberDiscountPercentAction()]).then(([p, d]) => {
      if (cancelled) return;
      setProducts(p);
      setMemberDiscountPercent(d);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-neutral-900">Favorilerim</h1>

      {products === null ? (
        <div className="py-10 text-sm text-neutral-500">Yükleniyor...</div>
      ) : products.length === 0 ? (
        <EmptyState
          title="Favori listeniz boş"
          description="Beğendiğiniz ürünlerin üzerindeki kalp ikonuna dokunarak favorilerinize ekleyebilirsiniz."
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
