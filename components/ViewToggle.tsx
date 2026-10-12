"use client";

import FilterButton from "@/components/FilterButton";
import { usePathname, useSearchParams } from "next/navigation";
import { GridIcon, ListIcon } from "@/components/icons";

export default function ViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("gorunum") === "liste" ? "liste" : "izgara";

  function hrefFor(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "izgara") params.delete("gorunum");
    else params.set("gorunum", view);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-neutral-300 p-0.5">
      {/* Görünüm seçimi düğme (taranamaz) — bkz. components/FilterButton.tsx */}
      <FilterButton
        href={hrefFor("izgara")}
        aria-label="Izgara görünümü"
        aria-pressed={current === "izgara"}
        className={`rounded-md p-1.5 ${current === "izgara" ? "bg-[var(--color-brand)] text-white" : "text-neutral-500 hover:text-neutral-800"}`}
      >
        <GridIcon className="h-4 w-4" aria-hidden="true" />
      </FilterButton>
      <FilterButton
        href={hrefFor("liste")}
        aria-label="Liste görünümü"
        aria-pressed={current === "liste"}
        className={`rounded-md p-1.5 ${current === "liste" ? "bg-[var(--color-brand)] text-white" : "text-neutral-500 hover:text-neutral-800"}`}
      >
        <ListIcon className="h-4 w-4" aria-hidden="true" />
      </FilterButton>
    </div>
  );
}
