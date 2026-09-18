"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        router.push(trimmed ? `/ara?q=${encodeURIComponent(trimmed)}` : "/");
      }}
      className="flex w-full max-w-xl"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="search"
        placeholder="Ürün, marka veya kategori ara..."
        className="w-full rounded-l-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-r-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Ara
      </button>
    </form>
  );
}
