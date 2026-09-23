"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import StoreImage from "@/components/StoreImage";
import ProductPlaceholder from "@/components/ProductPlaceholder";
import { useCart } from "@/components/CartProvider";
import { resolvePrice, centsToTl } from "@/lib/pricing";
import { unitLabel } from "@/lib/units";
import type { StorefrontProductSummary } from "@/lib/search";

export type FrequentRow = {
  product: StorefrontProductSummary;
  purchaseCount: number;
  lastAt: string; // ISO
  lastQuantity: number;
  lastUnit: string;
};

const MAX_QTY = 9999;

function Row({ row, memberDiscountPercent }: { row: FrequentRow; memberDiscountPercent: number | null }) {
  const { product } = row;
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const price = resolvePrice(product, memberDiscountPercent);
  const href = product.slug ? `/urun/${product.slug}` : `/urun/id/${product.id}`;
  const inStock = product.stock > 0;
  // Son alımın birimi sitedeki satış birimiyle aynıysa miktar doğrudan doldurulabilir; farklıysa (ör. mağazadan
  // adet alınmış, sitede paket satılıyor) yalnız bilgi gösterilir — yanlış miktar doldurulmasın.
  const sameUnit = row.lastUnit === product.unit;
  const lastLabel = `${row.lastQuantity} ${unitLabel(row.lastUnit).toLocaleLowerCase("tr-TR")}`;
  const lastDate = new Date(row.lastAt).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });

  function setSafeQty(n: number) {
    setQty(Math.max(1, Math.min(MAX_QTY, Math.floor(Number.isFinite(n) ? n : 1))));
  }

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-nowrap">
      <Link href={href} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {product.coverImageUrl ? (
          <StoreImage src={product.coverImageUrl} alt={product.name} sizes="80px" className="object-cover" />
        ) : (
          <ProductPlaceholder name={product.name} brandName={product.brandName} variant="compact" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={href}>
          {product.brandName && <span className="text-xs text-neutral-400">{product.brandName}</span>}
          <p className="line-clamp-2 text-sm font-medium text-neutral-900">{product.name}</p>
        </Link>
        {product.packageInfo && <p className="text-xs text-neutral-500">{product.packageInfo}</p>}
        <p className="mt-1 text-xs text-neutral-600">
          Son aldığınız: <span className="font-medium">{lastLabel}</span> · {lastDate}
          {row.purchaseCount > 1 && <span className="text-neutral-400"> · {row.purchaseCount} kez aldınız</span>}
          {!sameUnit && (
            <span className="text-neutral-400"> · sitede {unitLabel(product.unit).toLocaleLowerCase("tr-TR")} olarak satılıyor</span>
          )}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-neutral-900">
          {centsToTl(price.displayCents)} ₺
          <span className="ml-1 text-[10px] font-normal text-neutral-400">KDV Dahil / {unitLabel(product.unit).toLocaleLowerCase("tr-TR")}</span>
        </p>
      </div>

      {inStock ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          {sameUnit && row.lastQuantity > 1 && (
            <button
              type="button"
              onClick={() => setSafeQty(row.lastQuantity)}
              className="rounded-lg border border-neutral-300 px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              title="Son aldığınız miktarı doldur"
            >
              {lastLabel}
            </button>
          )}
          <div className="flex items-center rounded-lg border border-neutral-300">
            <button type="button" aria-label="Azalt" onClick={() => setSafeQty(qty - 1)} className="px-2.5 py-2 text-sm text-neutral-600">
              −
            </button>
            <input
              value={qty}
              onChange={(e) => setSafeQty(Number(e.target.value))}
              inputMode="numeric"
              aria-label={`${product.name} miktar`}
              className="w-12 border-x border-neutral-300 py-2 text-center text-sm focus:outline-none"
            />
            <button type="button" aria-label="Artır" onClick={() => setSafeQty(qty + 1)} className="px-2.5 py-2 text-sm text-neutral-600">
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              addItem(product.id, qty, product.name);
              setAdded(true);
              setTimeout(() => setAdded(false), 1200);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all active:scale-95 ${
              added ? "bg-emerald-600" : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]"
            }`}
          >
            {added ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
            {added ? "Sepete eklendi" : "Tekrar Sipariş Et"}
          </button>
        </div>
      ) : (
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">Stokta yok</span>
      )}
    </li>
  );
}

export default function FrequentList({ rows, memberDiscountPercent }: { rows: FrequentRow[]; memberDiscountPercent: number | null }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <Row key={row.product.id} row={row} memberDiscountPercent={memberDiscountPercent} />
      ))}
    </ul>
  );
}
