"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { getCartDetails, type CartLine } from "@/lib/cartActions";
import { centsToTl } from "@/lib/pricing";

export default function SepetPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [totals, setTotals] = useState({ subtotalCents: 0, shippingCents: 0, totalCents: 0 });

  useEffect(() => {
    let cancelled = false;
    getCartDetails(items).then((result) => {
      if (cancelled) return;
      setLines(result.lines);
      setTotals(result);
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (lines === null) {
    return <div className="mx-auto w-full max-w-3xl px-4 py-10 text-sm text-neutral-500">Yükleniyor...</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-sm text-neutral-500">Sepetiniz boş.</p>
        <Link href="/" className="text-sm font-medium text-neutral-900 underline">
          Alışverişe devam et
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Sepetim</h1>

      <div className="mb-6 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
        {lines.map((line) => (
          <div key={line.productId} className="flex items-center gap-3 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {line.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.coverImageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{line.name}</p>
              <p className="text-sm text-neutral-500">{centsToTl(line.unitPriceCents)} ₺</p>
              {line.quantity > line.stock && (
                <p className="text-xs font-medium text-red-600">Stokta sadece {line.stock} adet var</p>
              )}
            </div>
            <div className="flex items-center rounded-lg border border-neutral-300">
              <button
                type="button"
                onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                className="px-2.5 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{line.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                className="px-2.5 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
              >
                +
              </button>
            </div>
            <p className="w-20 shrink-0 text-right text-sm font-semibold">{centsToTl(line.lineTotalCents)} ₺</p>
            <button
              type="button"
              onClick={() => removeItem(line.productId)}
              className="text-xs text-red-500 hover:underline"
            >
              Kaldır
            </button>
          </div>
        ))}
      </div>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Ara Toplam</span>
          <span>{centsToTl(totals.subtotalCents)} ₺</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Kargo</span>
          <span>{totals.shippingCents === 0 ? "Ücretsiz" : `${centsToTl(totals.shippingCents)} ₺`}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-neutral-900">
          <span>Toplam</span>
          <span>{centsToTl(totals.totalCents)} ₺</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
      >
        Siparişi Tamamla
      </Link>
    </div>
  );
}
