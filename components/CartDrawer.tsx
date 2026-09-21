"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { getCartDetails, type CartLine } from "@/lib/cartActions";
import { centsToTl } from "@/lib/pricing";
import { QuantityStepper } from "@/components/QuantityStepper";
import Skeleton from "@/components/Skeleton";

const UNAVAILABLE_MESSAGES: Record<"STOCK" | "NOT_FOR_SALE", string> = {
  STOCK: "Stokta yok",
  NOT_FOR_SALE: "Artık satışta değil",
};

// Sepete ürün eklendiğinde CartProvider.addItem otomatik olarak
// drawerOpen=true yapıyor — bu bileşen o sinyali dinleyip sağdan kayan
// mini-sepet panelini açıyor. Fiyat/stok hesabı yine mevcut
// getCartDetails() server action'ından geliyor, yeni bir hesap eklenmedi.
export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, updateQuantity, removeItem } = useCart();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [totals, setTotals] = useState({ subtotalCents: 0, shippingCents: 0, totalCents: 0 });

  useEffect(() => {
    if (!drawerOpen) return;
    let cancelled = false;
    getCartDetails(items).then((result) => {
      if (cancelled) return;
      setLines(result.lines);
      setTotals(result);
    });
    return () => {
      cancelled = true;
    };
  }, [drawerOpen, items]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Kapat" onClick={closeDrawer} className="absolute inset-0 bg-black/40" />

      <div className="absolute top-0 right-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h2 className="text-base font-semibold text-neutral-900">Sepetim</h2>
          <button type="button" onClick={closeDrawer} aria-label="Kapat" className="rounded-full p-1.5 hover:bg-neutral-100">
            <X className="h-5 w-5 text-neutral-500" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {lines === null ? (
            <div className="space-y-4" role="status" aria-label="Yükleniyor">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : lines.length === 0 ? (
            <p className="text-sm text-neutral-500">Sepetiniz boş.</p>
          ) : (
            <div className="space-y-4">
              {lines.map((line) => (
                <div key={line.productId} className={`flex items-center gap-3 ${!line.available ? "opacity-60" : ""}`}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {line.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.coverImageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{line.name}</p>
                    {line.unavailableReason ? (
                      <p className="text-xs font-medium text-red-600">{UNAVAILABLE_MESSAGES[line.unavailableReason]}</p>
                    ) : (
                      <p className="text-xs text-neutral-500">{centsToTl(line.unitPriceCents)} ₺</p>
                    )}
                    <div className="mt-1">
                      {line.available ? (
                        <QuantityStepper
                          value={line.quantity}
                          max={line.stock}
                          onChange={(next) => updateQuantity(line.productId, next)}
                          size="sm"
                        />
                      ) : (
                        <span className="text-xs text-neutral-400">{line.quantity} adet</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {line.available ? `${centsToTl(line.lineTotalCents)} ₺` : "—"}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(line.productId)}
                      className={`mt-1 text-xs text-red-500 hover:underline ${!line.available ? "font-medium" : ""}`}
                    >
                      {line.available ? "Kaldır" : "Sepetten kaldır"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {lines !== null && lines.length > 0 && (
          <div className="border-t border-neutral-200 p-4">
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-neutral-500">Ara Toplam</span>
              <span className="font-semibold text-neutral-900">{centsToTl(totals.subtotalCents)} ₺</span>
            </div>
            <Link
              href="/sepet"
              onClick={closeDrawer}
              className="mb-2 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Sepete Git
            </Link>
            {lines.some((l) => l.available) ? (
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="block w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
              >
                Ödemeye Geç
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="block w-full cursor-not-allowed rounded-lg bg-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-400"
                >
                  Ödemeye Geç
                </button>
                <p className="mt-1.5 text-center text-xs text-red-600">Satın alınabilir ürün yok.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
