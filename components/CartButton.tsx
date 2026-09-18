"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link href="/sepet" className="relative flex items-center gap-1.5 font-medium text-neutral-700 hover:text-[var(--color-brand)]">
      <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="hidden sm:inline">Sepet</span>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[10px] font-semibold text-white sm:static sm:ml-0.5 sm:h-5 sm:min-w-5 sm:px-1 sm:text-xs">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
