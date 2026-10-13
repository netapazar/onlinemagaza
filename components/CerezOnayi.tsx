"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BANDI_AC_OLAYI, GA_OLCUM_KIMLIGI, ONAY_DEGISTI_OLAYI, gaHazirla, onayDurumu, onayKaydet, type OnayDurumu } from "@/lib/analitik";

// Çerez onay bandı + Google Analytics yükleyicisi (DESIGN.md / Çerez bandı). Karar verilene kadar sayfanın altında sade
// bir şerit; "Kabul Et" ve "Reddet" eşit ağırlıkta (KVKK: reddetmek kabul etmek kadar kolay). Onay yoksa gtag.js yüklenmez.
// Onay durumu localStorage'dan okunur; sunucu çiziminde "bilinmiyor" (bant görünmez, hidrasyon farkı olmaz).
function abone(degisti: () => void) {
  window.addEventListener(ONAY_DEGISTI_OLAYI, degisti);
  window.addEventListener("storage", degisti);
  return () => {
    window.removeEventListener(ONAY_DEGISTI_OLAYI, degisti);
    window.removeEventListener("storage", degisti);
  };
}

export default function CerezOnayi() {
  const durum = useSyncExternalStore<OnayDurumu | "bilinmiyor">(abone, onayDurumu, () => "bilinmiyor");
  // "Çerez Tercihleri" ile karar verilmiş olsa da bant yeniden açılabilir.
  const [elleAcik, setElleAcik] = useState(false);
  const acik = durum === null || elleAcik;

  useEffect(() => {
    const ac = () => setElleAcik(true);
    window.addEventListener(BANDI_AC_OLAYI, ac);
    return () => window.removeEventListener(BANDI_AC_OLAYI, ac);
  }, []);

  useEffect(() => {
    if (durum === "kabul") gaHazirla();
  }, [durum]);

  // Bant açıkken yüksekliği --cerez-bandi değişkenine yazılır; masaüstündeki WhatsApp düğmesi bandın üstüne kayar.
  const bantRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bantRef.current;
    const kok = document.documentElement.style;
    if (!acik || !el) {
      kok.removeProperty("--cerez-bandi");
      return;
    }
    const olc = () => kok.setProperty("--cerez-bandi", `${el.offsetHeight}px`);
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => {
      ro.disconnect();
      kok.removeProperty("--cerez-bandi");
    };
  }, [acik]);

  const karar = (kabul: boolean) => {
    onayKaydet(kabul);
    setElleAcik(false);
  };

  return (
    <>
      {durum === "kabul" && (
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_OLCUM_KIMLIGI}`} strategy="afterInteractive" />
      )}
      {acik && (
        <div
          ref={bantRef}
          role="region"
          aria-label="Çerez tercihi"
          // Mobilde alttaki sekme çubuğunun (56 px) üstünde durur.
          className="fixed inset-x-0 bottom-14 z-50 border-t border-neutral-200 bg-white shadow-lg sm:bottom-0"
        >
          <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-700">
              Siteyi nasıl kullandığınızı ölçmek için onayınızla Google Analytics çerezleri kullanıyoruz. Reddederseniz
              yalnız sitenin çalışması için gerekli çerezler kullanılır.{" "}
              <Link href="/hukuki/cerez-politikasi" className="font-medium text-[var(--color-brand)] hover:underline">
                Çerez Politikası
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => karar(false)}
                className="flex-1 rounded-lg border border-[var(--color-brand)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand-50)] sm:flex-none"
              >
                Reddet
              </button>
              <button
                type="button"
                onClick={() => karar(true)}
                className="flex-1 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] sm:flex-none"
              >
                Kabul Et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Alt bilgideki "Çerez tercihleri" bağlantısı — bandı yeniden açar.
export function CerezTercihleriBaglantisi({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(BANDI_AC_OLAYI))} className={className}>
      Çerez Tercihleri
    </button>
  );
}
