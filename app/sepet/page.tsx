"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { getCartDetails, type CartLine, type MembershipKind } from "@/lib/cartActions";
import { centsToTl } from "@/lib/pricing";
import { QuantityStepper } from "@/components/QuantityStepper";
import CartCariHesapBox from "@/components/CartCariHesapBox";
import Skeleton from "@/components/Skeleton";
import StoreImage from "@/components/StoreImage";
import ProductPlaceholder from "@/components/ProductPlaceholder";

const UNAVAILABLE_MESSAGES: Record<"STOCK" | "NOT_FOR_SALE" | "BIRIM", string> = {
  STOCK: "Stokta yok",
  NOT_FOR_SALE: "Bu ürün artık satışta değil",
  BIRIM: "Satış birimi değişti — kaldırıp yeniden ekleyin",
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

  const checkoutButton = lines.some((l) => l.available) ? (
    <Link
      href="/checkout"
      className="mt-5 block w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
    >
      Siparişi Tamamla
    </Link>
  ) : (
    <div className="mt-5">
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
  );

  // Geniş ekranda iki sütun: solda satırlar (+ cari hesap kutusu), sağda yapışkan sipariş özeti. Dar ekranda
  // sıra eskisi gibi: satırlar → cari hesap kutusu → toplamlar + Siparişi Tamamla.
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Sepetim</h1>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
        <div className="min-w-0">
          <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-sm">
            {lines.map((line) => (
              // Dar ekranda iki kat: üstte görsel + ad + Kaldır, altta adet + tutar (tek satırda tutar ekrandan taşıyordu).
              <div key={`${line.productId}|${line.birim ?? ""}`} className={`flex items-start gap-3 p-4 sm:items-center ${!line.available ? "opacity-60" : ""}`}>
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {line.coverImageUrl ? (
                    <StoreImage src={line.coverImageUrl} alt="" sizes="64px" eager className="object-cover" />
                  ) : (
                    <ProductPlaceholder name={line.name} variant="icon" />
                  )}
                </div>
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                  <div className="min-w-0 sm:flex-1">
                    <p className="text-sm font-medium text-neutral-900">{line.name}</p>
                    <p className="text-sm text-neutral-500">
                      {centsToTl(line.unitPriceCents)} ₺{line.birim && " / adet"}
                    </p>
                    {line.birimEtiketi && (
                      <p className="text-xs text-neutral-500">
                        {line.birimEtiketi} × {line.quantity} = <span className="font-medium">{line.adet} adet</span>
                      </p>
                    )}
                    {line.unavailableReason ? (
                      <p className="text-xs font-medium text-red-600">
                        {UNAVAILABLE_MESSAGES[line.unavailableReason]} — siparişe dahil edilmeyecek
                      </p>
                    ) : (
                      line.adet > line.stock && (
                        <p className="text-xs font-medium text-red-600">Stokta sadece {line.stock} adet var</p>
                      )
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 sm:mt-0 sm:justify-end sm:gap-4">
                    {line.available ? (
                      <QuantityStepper
                        value={line.quantity}
                        max={line.maxQuantity}
                        onChange={(next) => updateQuantity(line.productId, next, line.birim)}
                      />
                    ) : (
                      <span className="px-2 text-sm text-neutral-400">{line.birim ? `${line.quantity} ${line.birimEtiketi ?? line.birim}` : `${line.quantity} adet`}</span>
                    )}
                    <p className="text-right text-sm font-semibold whitespace-nowrap sm:w-24">
                      {line.available ? `${centsToTl(line.lineTotalCents)} ₺` : "—"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(line.productId, line.birim)}
                  className={`shrink-0 text-xs whitespace-nowrap text-red-500 hover:underline ${!line.available ? "font-medium" : ""}`}
                >
                  {line.available ? "Kaldır" : "Sepetten kaldır"}
                </button>
              </div>
            ))}
          </div>

          {membershipKind && <CartCariHesapBox kind={membershipKind} />}
        </div>

        <div className="mt-6 lg:sticky lg:top-44 lg:mt-0 lg:rounded-xl lg:border lg:border-neutral-200 lg:bg-white lg:p-5 lg:shadow-sm">
          <h2 className="mb-3 hidden text-base font-semibold text-neutral-900 lg:block">Sipariş Özeti</h2>
          <div className="ml-auto max-w-xs space-y-1 text-sm lg:max-w-none">
            <div className="flex justify-between text-neutral-500">
              <span>Ara Toplam</span>
              <span>{centsToTl(totals.subtotalCents)} ₺</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Kargo</span>
              <span>{totals.shippingCents === 0 ? "Ücretsiz" : `${centsToTl(totals.shippingCents)} ₺`}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-neutral-900 lg:mt-2 lg:border-t lg:border-neutral-100 lg:pt-2">
              <span>Toplam</span>
              <span>{centsToTl(totals.totalCents)} ₺</span>
            </div>
          </div>
          {checkoutButton}
        </div>
      </div>
    </div>
  );
}
