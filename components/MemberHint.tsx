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

export function corporateHintFor(kind: MemberHintKind): { text: string; href: string | null } | null {
  switch (kind) {
    case "approved":
      return null;
    case "guest":
      return { text: "Kurumsal fiyat için giriş yapın", href: "/uyelik/giris" };
    case "pending":
      return { text: "Kurumsal fiyat için başvurunuz inceleniyor", href: null };
    case "rejected":
    case "no_application":
      return { text: "Kurumsal fiyat için üyelik başvurusu yapın", href: "/hesabim/uyelik-basvurusu" };
  }
}

// Bu ipucu her ürün kartında tekrarlanır: işaretleme bilerek minimum (stil + kilit simgesi globals.css'teki .member-hint'te,
// düz <a> — next/link değil). Mobil ölçümde kart başına ~700 bayt HTML'den ~100 bayta indi.
export default function CorporatePriceHint({ className = "" }: { className?: string }) {
  const kind = useContext(MemberHintContext);
  const hint = corporateHintFor(kind);
  if (!hint) return null;

  const cls = className ? `member-hint ${className}` : "member-hint";
  return hint.href ? (
    <a href={hint.href} className={cls}>
      {hint.text}
    </a>
  ) : (
    <span className={cls}>{hint.text}</span>
  );
}
