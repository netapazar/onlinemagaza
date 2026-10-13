"use client";

import { createContext, useContext, type ReactNode } from "react";

// "Kurumsal fiyat" ipucu — ürün kartında ve detayında, RAKAM göstermeden. Yalnız onaysız ziyaretçilere gösterilir;
// ONAYLI üyeye hiç çıkmaz. Üyelik durumu layout'ta bir kez (React cache ile Header'la aynı sorgu) bu bağlama konur,
// böylece her ürün kartına ayrı prop taşımak gerekmez.
export type MemberHintKind = "guest" | "approved" | "pending" | "rejected" | "no_application";

const MemberHintContext = createContext<MemberHintKind>("approved"); // sağlayıcı yoksa güvenli varsayılan: ipucu YOK

export function MemberHintProvider({ kind, children }: { kind: MemberHintKind; children: ReactNode }) {
  return <MemberHintContext.Provider value={kind}>{children}</MemberHintContext.Provider>;
}

// kisa: dar ürün kartında (< 200 px) gösterilen kısa metin — tam metin orada tek satıra sığmıyor (globals.css, @container).
export function corporateHintFor(kind: MemberHintKind): { text: string; kisa: string; href: string | null } | null {
  switch (kind) {
    case "approved":
      return null;
    case "guest":
      return { text: "Kurumsal fiyat için giriş yap", kisa: "Kurumsal fiyat: giriş yap", href: "/uyelik/giris" };
    case "pending":
      return { text: "Kurumsal başvurunuz inceleniyor", kisa: "Başvurunuz inceleniyor", href: null };
    case "rejected":
    case "no_application":
      return { text: "Kurumsal fiyat için başvuru yap", kisa: "Kurumsal fiyat: başvur", href: "/hesabim/uyelik-basvurusu" };
  }
}

// Bu ipucu her ürün kartında tekrarlanır: işaretleme bilerek minimum (stil + kilit simgesi globals.css'teki .member-hint'te,
// düz <a> — next/link değil). Mobil ölçümde kart başına ~700 bayt HTML'den ~100 bayta indi.
// Kartta fiyatın altında TEK SATIRLIK küçük bağlantı; düğmeye ya da kutuya dönüştürülmez (DESIGN.md / Ürün kartı, 2026-10-13).
// kisaltilabilir: ürün kartında iki metin birlikte yazılır, hangisinin görüneceğine kartın genişliği karar verir (CSS).
export default function CorporatePriceHint({ className = "", kisaltilabilir = false }: { className?: string; kisaltilabilir?: boolean }) {
  const kind = useContext(MemberHintContext);
  const hint = corporateHintFor(kind);
  if (!hint) return null;

  const cls = className ? `member-hint ${className}` : "member-hint";
  const icerik = kisaltilabilir ? (
    <>
      <span className="mh-uzun">{hint.text}</span>
      <span className="mh-kisa">{hint.kisa}</span>
    </>
  ) : (
    hint.text
  );
  return hint.href ? (
    <a href={hint.href} className={cls}>
      {icerik}
    </a>
  ) : (
    <span className={cls}>{icerik}</span>
  );
}
