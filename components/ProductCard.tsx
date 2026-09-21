"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Check } from "lucide-react";
import type { StorefrontProductSummary } from "@/lib/search";
import { resolvePrice, centsToTl } from "@/lib/pricing";
import { useCart } from "@/components/CartProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { QuantityStepper } from "@/components/QuantityStepper";
import CorporatePriceHint from "@/components/MemberHint";
import { unitLabel } from "@/lib/units";
import StoreImage from "@/components/StoreImage";

// Kart artık interaktif (favori kalbi + hızlı sepete ekle) olduğu için
// Server Component olamıyor — resolvePrice saf bir fonksiyon olduğundan
// client'ta çalışması güvenli (üye/misafir fiyatı zaten sunucudan
// memberDiscountPercent olarak hazır geliyor, burada yeniden hesaplanmıyor).
export default function ProductCard({
  product,
  memberDiscountPercent,
  eager = false,
}: {
  product: StorefrontProductSummary;
  memberDiscountPercent: number | null;
  /** İlk ekranda görünen kart: görseli tembel yükleme (lazy) LCP'yi geciktirir, bu yüzden hemen yüklenir. */
  eager?: boolean;
}) {
  const price = resolvePrice(product, memberDiscountPercent);
  const href = product.slug ? `/urun/${product.slug}` : `/urun/id/${product.id}`;
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const inStock = product.stock > 0;
  const favorite = isFavorite(product.id);

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <button
        type="button"
        onClick={() => toggle(product.id)}
        aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
        aria-pressed={favorite}
        className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-opacity ${
          favorite ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
      >
        <Heart
          className={`h-4 w-4 ${favorite ? "fill-[var(--color-brand)] text-[var(--color-brand)]" : "text-neutral-500"}`}
          aria-hidden="true"
        />
      </button>

      <Link href={href} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          {product.coverImageUrl ? (
            <StoreImage
              src={product.coverImageUrl}
              alt={product.name}
              sizes="(max-width: 640px) 45vw, 210px"
              eager={eager}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
              Görsel yok
            </div>
          )}

          {price.discounted && price.discountPercent && (
            <span className="absolute top-2 left-2 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-semibold text-white">
              %{price.discountPercent}
            </span>
          )}

          {inStock ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Bugün Kargoda
            </span>
          ) : (
            <span className="absolute bottom-2 left-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
              Stokta Yok
            </span>
          )}
        </div>

        <div className="p-2.5 pb-0">
          {product.brandName && <span className="text-xs text-neutral-400">{product.brandName}</span>}
          <p className="line-clamp-2 text-sm font-medium text-neutral-900">{product.name}</p>
          {/* Paket içeriği varsa o ("50'li paket"); yoksa birim Adet dışındaysa "Koli satış" gibi; ikisi de yoksa hiçbir şey */}
          {(product.packageInfo || product.unit !== "ADET") && (
            <span className="mt-1 inline-block max-w-full truncate rounded bg-neutral-100 px-1.5 py-0.5 align-top text-[10px] font-medium text-neutral-600">
              {product.packageInfo ?? `${unitLabel(product.unit)} satış`}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 pt-1.5">
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            {price.discounted && (
              <span className="text-xs text-neutral-400 line-through">{centsToTl(price.listCents)} ₺</span>
            )}
            <span className="text-sm font-semibold text-neutral-900">{centsToTl(price.displayCents)} ₺</span>
          </div>
          <span className="text-[10px] text-neutral-400">KDV Dahil</span>
          <CorporatePriceHint className="mt-0.5" />
        </div>

        {inStock && (
          <div className="flex items-stretch gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <QuantityStepper value={quantity} max={product.stock} onChange={setQuantity} size="sm" />
            <button
              type="button"
              onClick={() => {
                addItem(product.id, quantity, product.name);
                setAdded(true);
                setTimeout(() => setAdded(false), 1200);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-white transition-all duration-200 active:scale-95 ${
                added ? "bg-emerald-600" : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]"
              }`}
            >
              {added ? (
                <Check className="animate-pop h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {added ? "✓ Eklendi" : "Sepete Ekle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
