"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "onerilen", label: "Önerilen Sıralama" },
  { value: "fiyat-artan", label: "Fiyat: Düşükten Yükseğe" },
  { value: "fiyat-azalan", label: "Fiyat: Yüksekten Düşüğe" },
  { value: "isim-az", label: "İsme Göre (A-Z)" },
  { value: "yeni", label: "Yeniden Eskiye" },
];

export default function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sirala") ?? "onerilen";

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value === "onerilen") params.delete("sirala");
        else params.set("sirala", e.target.value);
        params.delete("sayfa");
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
