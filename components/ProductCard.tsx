"use client";

import Link from "next/link";
import { useState } from "react";
import { HeartIcon, CartIcon, CheckIcon, TrendUpIcon } from "@/components/icons";
import type { StorefrontProductSummary } from "@/lib/search";
import { resolvePrice, centsToTl } from "@/lib/pricing";
import { useCart } from "@/components/CartProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { QuantityStepper } from "@/components/QuantityStepper";
import CorporatePriceHint from "@/components/MemberHint";
import { unitLabel } from "@/lib/units";
import { birimEtiketi } from "@/lib/satisBirimleri";
import StoreImage from "@/components/StoreImage";
import ProductPlaceholder from "@/components/ProductPlaceholder";

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
  // Paketli satış: karttan hızlı eklemede en küçük açık birim kullanılır (diğer birimler ürün sayfasında).
  const enKucukBirim = product.satisBirimleri?.[0] ?? null;
  const icerik = enKucukBirim?.adet ?? 1;
  const inStock = product.stock >= icerik;
  const favorite = isFavorite(product.id);

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand-300)] hover:shadow-md">
      <button
        type="button"
        onClick={() => toggle(product.id)}
        aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
        aria-pressed={favorite}
        className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-opacity ${
          favorite ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
      >
        <HeartIcon
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
            <ProductPlaceholder name={product.name} brandName={product.brandName} />
          )}

          {/* Rozet sistemi (kullanıcı kararı 2026-10): kartta yalnız ayırt edici "Çok Satan" rozeti. "Bugün Kargoda" her
              üründe olduğu için kaldırıldı; stok durumu rozet değil, aşağıda buton yerine düz metin. */}
          {product.cokSatan && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              <TrendUpIcon className="h-3 w-3" aria-hidden="true" />
              Çok Satan
            </span>
          )}
        </div>

        <div className="p-2.5 pb-0">
          {/* Sabit satır yükseklikleri: ad 1 ya da 2 satır, açıklama/etiket olsun olmasın kartların fiyat ve buton hizası aynı kalsın */}
          <span className="block h-4 truncate text-xs leading-4 text-neutral-400">{product.brandName ?? ""}</span>
          <p className="line-clamp-2 h-10 text-sm leading-5 font-medium text-neutral-900">{product.name}</p>
          <p className="line-clamp-1 h-4 text-xs leading-4 text-neutral-500">{product.shortDescription ?? ""}</p>
          <div className="mt-1 h-[18px]">
          {/* Paket içeriği varsa o ("50'li paket"); yoksa birim Adet dışındaysa "Koli satış" gibi; ikisi de yoksa hiçbir şey */}
          {enKucukBirim ? (
            <span className="inline-block max-w-full truncate rounded bg-neutral-100 px-1.5 py-0.5 align-top text-[10px] font-medium text-neutral-600">
              {`En az ${birimEtiketi(enKucukBirim.birim, enKucukBirim.adet)}`}
            </span>
          ) : (
            (product.packageInfo || product.unit !== "ADET") && (
              <span className="inline-block max-w-full truncate rounded bg-neutral-100 px-1.5 py-0.5 align-top text-[10px] font-medium text-neutral-600">
                {product.packageInfo ?? `${unitLabel(product.unit)} satış`}
              </span>
            )
          )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 pt-1.5">
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            {price.discounted && (
              <span className="text-xs text-neutral-400 line-through">{centsToTl(price.listCents)} ₺</span>
            )}
            <span className="text-base font-extrabold text-[var(--color-brand)]">
              {centsToTl(price.displayCents)} ₺
              {enKucukBirim && <span className="ml-0.5 text-[11px] font-normal text-neutral-500">/ adet</span>}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">KDV Dahil</span>
          <CorporatePriceHint className="mt-0.5" />
        </div>

        {inStock ? (
          <div className="flex items-stretch gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <QuantityStepper value={quantity} max={Math.floor(product.stock / icerik)} onChange={setQuantity} size="sm" />
            <button
              type="button"
              title={enKucukBirim ? `${quantity} ${birimEtiketi(enKucukBirim.birim, enKucukBirim.adet)}` : undefined}
              onClick={() => {
                addItem(product.id, quantity, product.name, enKucukBirim?.birim ?? null);
                setAdded(true);
                setTimeout(() => setAdded(false), 1200);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-white transition-all duration-200 active:scale-95 ${
                added ? "bg-emerald-600" : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]"
              }`}
            >
              {added ? (
                <CheckIcon className="animate-pop h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <CartIcon className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {added ? "✓ Eklendi" : "Sepete Ekle"}
            </button>
          </div>
        ) : (
          <p className="text-xs font-medium text-neutral-500">Stokta yok</p>
        )}
      </div>
    </div>
  );
}
