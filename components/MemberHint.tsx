"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Lock } from "lucide-react";

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

export default function CorporatePriceHint({ className = "" }: { className?: string }) {
  const kind = useContext(MemberHintContext);
  const hint = corporateHintFor(kind);
  if (!hint) return null;

  const base = `inline-flex items-center gap-1 text-[11px] leading-tight text-[var(--color-brand-700)] ${className}`;
  const content = (
    <>
      <Lock className="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
      <span>{hint.text}</span>
    </>
  );
  // Düz <a>: bu ipucu her ürün kartında tekrarlanıyor — next/link her örnek için ayrı prefetch gözlemcisi ve hydration
  // maliyeti getirirdi (mobil TBT ölçümü). Hedef sayfa (giriş/başvuru) zaten tek tıklık, tam sayfa geçişi sorun değil.
  return hint.href ? (
    <a href={hint.href} className={`${base} underline-offset-2 hover:underline`}>
      {content}
    </a>
  ) : (
    <span className={`${base} text-neutral-500`}>{content}</span>
  );
}
