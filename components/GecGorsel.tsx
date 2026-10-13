"use client";

import { useEffect, useState } from "react";
import StoreImage from "@/components/StoreImage";

// Ana sayfa satırları (2026-10 yoğunluk turu): ürünler ilk ekranın hemen altına çıktı; tarayıcının tembel yükleme eşiği yavaş
// mobil bağlantıda ~2500 px olduğundan kart görselleri sayfa yüklemesine (load) ekleniyor, mobil tam yükleme sınırını (2,15 sn)
// aşıyordu. defer: dar ekranda görsel load olayından SONRA istenir (yer tutucu); geniş ekranda (≥1024 px) hemen.
export function useImagesReady(defer: boolean): boolean {
  const [ready, setReady] = useState(!defer);
  useEffect(() => {
    if (!defer) return;
    const hazir = () => setReady(true);
    if (document.readyState === "complete" || window.matchMedia("(min-width: 1024px)").matches) {
      hazir();
      return;
    }
    window.addEventListener("load", hazir, { once: true });
    return () => window.removeEventListener("load", hazir);
  }, [defer]);
  return ready;
}

// İlk ekrandaki küçük ürün fotoğrafları (mobil hero küçük resimleri, yan kısayol kartları): dar ekranda sayfa yüklemesi
// bittikten sonra istenir, mobil tam yükleme süresine eklenmez. Üst kutu `relative` + boyutlu olmalı (StoreImage fill).
export default function GecGorsel({ src, sizes, className = "" }: { src: string; sizes: string; className?: string }) {
  const hazir = useImagesReady(true);
  if (!hazir) return null;
  return <StoreImage src={src} alt="" sizes={sizes} className={className} />;
}
