"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Bölüm girişi animasyonu: ekrana ilk kez girerken hafifçe yukarı kayarak belirir — BİR KEZ, tekrar etmez.
//   * Sunucuda/JS yokken içerik TAM görünür (gizleme yalnız istemcide, aşağıdaki effect'te uygulanır).
//   * Sayfa açıldığında zaten ilk ekranda olan bölümler hiç animasyona girmez (parlama/kayma yok).
//   * prefers-reduced-motion açıksa hiçbir şey yapılmaz.
// Yalnız ~40 satır + IntersectionObserver (tarayıcı yerleşik); animasyon kütüphanesi yok.
export default function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // ilk ekranda: animasyon yok

    el.classList.add("reveal-hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          requestAnimationFrame(() => el.classList.add("reveal-in"));
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
