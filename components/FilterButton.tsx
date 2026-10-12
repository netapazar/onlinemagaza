"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

// Ürün listesinde marka/görünüm seçimi: <a href> DEĞİL düğme (2026-10-12). Her listede ~200 marka bağlantısı vardı ve
// parametreleri birleştiriyordu (kategori+marka+sayfa…) — botlar (GPTBot vb.) sonsuz URL uzayında dolaşıp günde 200–380 bin
// istek atıyordu. Kullanıcı için davranış aynı: tıklayınca aynı adrese gider. Kategori ve sayfa bağlantıları taranabilir kalır.
export default function FilterButton({
  href,
  className = "",
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
}) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.push(href)} className={`cursor-pointer text-left ${className}`} {...rest}>
      {children}
    </button>
  );
}
