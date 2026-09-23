"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { getSearchSuggestions } from "@/lib/storefrontActions";
import type { SearchSuggestion } from "@/lib/search";
import StoreImage from "@/components/StoreImage";
import ProductPlaceholder from "@/components/ProductPlaceholder";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export default function SearchAutocomplete({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const results = await getSearchSuggestions(trimmed);
        setSuggestions(results);
      });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function submit(query: string) {
    const trimmed = query.trim();
    setOpen(false);
    router.push(trimmed ? `/urunler?q=${encodeURIComponent(trimmed)}` : "/");
  }

  const showPanel = open && value.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex w-full"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input
            value={value}
            onChange={(e) => {
              const next = e.target.value;
              setValue(next);
              setOpen(true);
              if (next.trim().length < MIN_QUERY_LENGTH) setSuggestions([]);
            }}
            onFocus={() => setOpen(true)}
            type="search"
            placeholder="Ürün, marka veya kategori ara..."
            className="w-full rounded-l-lg border border-neutral-300 py-2.5 pr-3 pl-9 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-r-lg bg-[var(--color-brand)] px-4 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
        >
          Ara
        </button>
      </form>

      {showPanel && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {pending ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Aranıyor...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-400">Eşleşen ürün bulunamadı</div>
          ) : (
            <>
              <ul className="max-h-96 overflow-y-auto py-1">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={s.slug ? `/urun/${s.slug}` : `/urun/id/${s.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {s.coverImageUrl ? (
                          <StoreImage src={s.coverImageUrl} alt="" sizes="40px" eager className="object-cover" />
                        ) : (
                          <ProductPlaceholder name={s.name} variant="icon" />
                        )}
                      </div>
                      <div className="min-w-0">
                        {s.brandName && <p className="truncate text-xs text-neutral-400">{s.brandName}</p>}
                        <p className="truncate text-sm text-neutral-800">{s.name}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => submit(value)}
                className="block w-full border-t border-neutral-100 px-4 py-2.5 text-center text-sm font-medium text-[var(--color-brand)] hover:bg-neutral-50"
              >
                {`"${value.trim()}" için tüm sonuçları gör`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
