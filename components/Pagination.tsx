import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// totalPages <= 1 iken hiç render edilmiyor (page.tsx'te kontrol ediliyor) —
// tek sayfalık bir katalogda "1 / 1" gibi anlamsız bir sayfalama gösterip
// yarım/bitmemiş görünmesin diye.
export default function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (overrides: Record<string, string | undefined>) => string;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1" aria-label="Sayfalama">
      <Link
        href={buildHref({ sayfa: String(Math.max(1, currentPage - 1)) })}
        aria-disabled={currentPage === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 ${
          currentPage === 1 ? "pointer-events-none text-neutral-300" : "text-neutral-600 hover:bg-neutral-50"
        }`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref({ sayfa: String(p) })}
          aria-current={p === currentPage ? "page" : undefined}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium ${
            p === currentPage
              ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
              : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          {p}
        </Link>
      ))}

      <Link
        href={buildHref({ sayfa: String(Math.min(totalPages, currentPage + 1)) })}
        aria-disabled={currentPage === totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 ${
          currentPage === totalPages ? "pointer-events-none text-neutral-300" : "text-neutral-600 hover:bg-neutral-50"
        }`}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
