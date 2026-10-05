"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { QuantityStepper } from "@/components/QuantityStepper";
import { centsToTl } from "@/lib/pricing";
import { birimEtiketi, type SatisBirimi } from "@/lib/satisBirimleri";

// Paketli satış (satisBirimleri dolu): müşteri yalnız açık birimlerden birini seçer, adet = birim sayısı × içerik.
// adetFiyatiCents yalnız birim toplamlarını göstermek için — sepet/sipariş fiyatı her zaman sunucuda hesaplanır.
export default function AddToCartButton({
  productId,
  stock,
  name,
  satisBirimleri = null,
  adetFiyatiCents,
}: {
  productId: string;
  stock: number;
  name: string;
  satisBirimleri?: SatisBirimi[] | null;
  adetFiyatiCents?: number;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const birimler = satisBirimleri && satisBirimleri.length > 0 ? satisBirimleri : null;
  const ilkUygun = birimler?.find((b) => b.adet <= stock) ?? birimler?.[0] ?? null;
  const [birim, setBirim] = useState<SatisBirimi | null>(ilkUygun);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const icerik = birim?.adet ?? 1;
  const max = Math.floor(stock / icerik);

  if (max <= 0 && (!birimler || birimler.every((b) => b.adet > stock))) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg bg-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500"
      >
        Stokta Yok
      </button>
    );
  }

  const ekle = () => addItem(productId, quantity, name, birim?.birim ?? null);

  return (
    <div className="space-y-2">
      {birimler && (
        <fieldset className="space-y-1.5">
          <legend className="mb-1 text-xs font-medium text-neutral-600">Satış birimi</legend>
          {birimler.map((b) => {
            const yetersiz = b.adet > stock;
            const secili = birim?.birim === b.birim;
            return (
              <label
                key={b.birim}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                  secili ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]" : "border-neutral-200"
                } ${yetersiz ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`birim-${productId}`}
                    checked={secili}
                    disabled={yetersiz}
                    onChange={() => {
                      setBirim(b);
                      setQuantity(1);
                    }}
                    className="accent-[var(--color-brand)]"
                  />
                  {birimEtiketi(b.birim, b.adet)}
                </span>
                <span className="text-xs text-neutral-500">
                  {yetersiz ? "Stok yetersiz" : adetFiyatiCents !== undefined ? `${centsToTl(adetFiyatiCents * b.adet)} ₺` : ""}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}
      <div className="flex items-stretch gap-2">
        <QuantityStepper value={quantity} max={Math.max(1, max)} onChange={setQuantity} size="lg" />
        <button
          type="button"
          onClick={() => {
            ekle();
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
            added
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          }`}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {added ? "✓ Eklendi" : "Sepete Ekle"}
        </button>
      </div>
      {birim && (
        <p className="text-xs text-neutral-600">
          {quantity} {birimEtiketi(birim.birim, birim.adet)} = <strong>{quantity * birim.adet} adet</strong>
          {adetFiyatiCents !== undefined && ` · ${centsToTl(adetFiyatiCents * birim.adet * quantity)} ₺`}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          ekle();
          router.push("/checkout");
        }}
        className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--color-brand-hover)] active:scale-[0.98]"
      >
        Hemen Al
      </button>
    </div>
  );
}
