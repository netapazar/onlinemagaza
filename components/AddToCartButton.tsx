"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

export default function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
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
    <div className="flex items-stretch gap-2">
      <div className="flex items-center rounded-lg border border-neutral-300">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-3 text-sm text-neutral-600 hover:text-neutral-900"
          aria-label="Azalt"
        >
          −
        </button>
        <span className="w-8 text-center text-sm">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
          className="px-3 py-3 text-sm text-neutral-600 hover:text-neutral-900"
          aria-label="Artır"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          addItem(productId, quantity);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="flex-1 rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
      >
        {added ? "Sepete Eklendi ✓" : "Sepete Ekle"}
      </button>
      {added && (
        <button
          type="button"
          onClick={() => router.push("/sepet")}
          className="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Sepete Git
        </button>
      )}
    </div>
  );
}
