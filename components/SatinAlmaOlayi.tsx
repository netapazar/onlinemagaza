"use client";

import { useEffect } from "react";
import { satinAlindi, type AnalitikUrun } from "@/lib/analitik";

// Sipariş alındı sayfası: GA4 "purchase" olayı (yalnız çerez onayı varsa; aynı sipariş için bir kez).
export default function SatinAlmaOlayi(props: {
  id: string;
  toplamCents: number;
  kargoCents: number;
  odeme: string;
  urunler: AnalitikUrun[];
}) {
  useEffect(() => {
    satinAlindi(props);
    // Sipariş verisi sayfa boyunca değişmez; bir kez çalışması yeterli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);
  return null;
}
