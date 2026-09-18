"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link href="/sepet" className="relative font-medium text-neutral-700 hover:text-neutral-900">
      Sepet
      {itemCount > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-xs font-semibold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
