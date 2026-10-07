"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Yatay kaydırmalı tek satır: içerik taşınca kenarlarda solma + (dokunmatik olmayan ekranda) sol/sağ ok düğmeleri belirir;
// taşmıyorsa düz bir satır gibi durur. Kaydırma çubuğu gizli (parmakla/tekerle/oklarla kaydırılır).
export default function ScrollRow({
  children,
  label,
  className = "",
  fadeFrom = "from-white",
}: {
  children: ReactNode;
  label: string;
  className?: string;
  /** Kenar solmasının rengi — satırın arka planıyla aynı olmalı (ör. "from-neutral-50"). */
  fadeFrom?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sol, setSol] = useState(false);
  const [sag, setSag] = useState(false);

  const guncelle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setSol(el.scrollLeft > 4);
    setSag(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    guncelle();
    el.addEventListener("scroll", guncelle, { passive: true });
    const ro = new ResizeObserver(guncelle);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", guncelle);
      ro.disconnect();
    };
  }, [guncelle]);

  const kaydir = (yon: 1 | -1) => ref.current?.scrollBy({ left: yon * ref.current.clientWidth * 0.75, behavior: "smooth" });

  const ok = "absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-md transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] [@media(hover:hover)]:flex";

  return (
    <div className={`relative min-w-0 ${className}`}>
      {sol && (
        <>
          <span className={`pointer-events-none absolute inset-y-0 left-0 z-[5] w-10 bg-gradient-to-r ${fadeFrom} to-transparent`} aria-hidden="true" />
          <button type="button" onClick={() => kaydir(-1)} aria-label={`${label}: sola kaydır`} className={`${ok} left-0`}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
      <div ref={ref} role="group" aria-label={label} className="scrollbar-none flex items-center gap-2 overflow-x-auto scroll-smooth">
        {children}
      </div>
      {sag && (
        <>
          <span className={`pointer-events-none absolute inset-y-0 right-0 z-[5] w-10 bg-gradient-to-l ${fadeFrom} to-transparent`} aria-hidden="true" />
          <button type="button" onClick={() => kaydir(1)} aria-label={`${label}: sağa kaydır`} className={`${ok} right-0`}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
