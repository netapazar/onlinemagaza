"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { getCartDetails, type CartLine, type MembershipKind } from "@/lib/cartActions";
import { centsToTl } from "@/lib/pricing";
import { QuantityStepper } from "@/components/QuantityStepper";
import CartCariHesapBox from "@/components/CartCariHesapBox";
import Skeleton from "@/components/Skeleton";

const UNAVAILABLE_MESSAGES: Record<"STOCK" | "NOT_FOR_SALE", string> = {
  STOCK: "Stokta yok",
  NOT_FOR_SALE: "Bu ürün artık satışta değil",
};

export default function SepetPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [totals, setTotals] = useState({ subtotalCents: 0, shippingCents: 0, totalCents: 0 });
  const [membershipKind, setMembershipKind] = useState<MembershipKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCartDetails(items).then((result) => {
      if (cancelled) return;
      setLines(result.lines);
      setTotals(result);
      setMembershipKind(result.membershipKind);
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (lines === null) {
    return <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-10" role="status" aria-label="Yükleniyor"><Skeleton className="h-6 w-40" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
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

      <div className="mb-6 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-sm">
        {lines.map((line) => (
          <div key={line.productId} className={`flex items-center gap-3 p-4 ${!line.available ? "opacity-60" : ""}`}>
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {line.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.coverImageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{line.name}</p>
              <p className="text-sm text-neutral-500">{centsToTl(line.unitPriceCents)} ₺</p>
              {line.unavailableReason ? (
                <p className="text-xs font-medium text-red-600">
                  {UNAVAILABLE_MESSAGES[line.unavailableReason]} — siparişe dahil edilmeyecek
                </p>
              ) : (
                line.quantity > line.stock && (
                  <p className="text-xs font-medium text-red-600">Stokta sadece {line.stock} adet var</p>
                )
              )}
            </div>
            {line.available ? (
              <QuantityStepper
                value={line.quantity}
                max={line.stock}
                onChange={(next) => updateQuantity(line.productId, next)}
              />
            ) : (
              <span className="px-2 text-sm text-neutral-400">{line.quantity} adet</span>
            )}
            <p className="w-20 shrink-0 text-right text-sm font-semibold">
              {line.available ? `${centsToTl(line.lineTotalCents)} ₺` : "—"}
            </p>
            <button
              type="button"
              onClick={() => removeItem(line.productId)}
              className={`text-xs text-red-500 hover:underline ${!line.available ? "font-medium" : ""}`}
            >
              {line.available ? "Kaldır" : "Sepetten kaldır"}
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

      {membershipKind && <CartCariHesapBox kind={membershipKind} />}

      {lines.some((l) => l.available) ? (
        <Link
          href="/checkout"
          className="mt-6 block w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
        >
          Siparişi Tamamla
        </Link>
      ) : (
        <div className="mt-6">
          <button
            type="button"
            disabled
            className="block w-full cursor-not-allowed rounded-lg bg-neutral-200 px-4 py-3 text-center text-sm font-medium text-neutral-400"
          >
            Siparişi Tamamla
          </button>
          <p className="mt-2 text-center text-xs text-red-600">
            Sepetinizde satın alınabilir ürün yok — devam etmek için stokta olmayan ürünleri kaldırın.
          </p>
        </div>
      )}
    </div>
  );
}
