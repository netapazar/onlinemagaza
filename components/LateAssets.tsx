"use client";

import { useEffect } from "react";

// Sayfa yüklemesi (load olayı) bittikten sonra <html data-gec-yukleme> ekler; ilk ekran için gerekmeyen görseller
// (ör. kategori sprite'ı, app/globals.css) yalnız bu işaretle istenir ve mobil tam yükleme süresine eklenmez.
export default function LateAssets() {
  useEffect(() => {
    const isaretle = () => document.documentElement.setAttribute("data-gec-yukleme", "");
    if (document.readyState === "complete") isaretle();
    else window.addEventListener("load", isaretle, { once: true });
    return () => window.removeEventListener("load", isaretle);
  }, []);
  return null;
}
