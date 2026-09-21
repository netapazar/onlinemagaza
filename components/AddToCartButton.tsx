"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { QuantityStepper } from "@/components/QuantityStepper";

export default function AddToCartButton({
  productId,
  stock,
  name,
}: {
  productId: string;
  stock: number;
  name: string;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (stock <= 0) {
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

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-2">
        <QuantityStepper value={quantity} max={stock} onChange={setQuantity} size="lg" />
        <button
          type="button"
          onClick={() => {
            addItem(productId, quantity, name);
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
      <button
        type="button"
        onClick={() => {
          addItem(productId, quantity, name);
          router.push("/checkout");
        }}
        className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--color-brand-hover)] active:scale-[0.98]"
      >
        Hemen Al
      </button>
    </div>
  );
}
