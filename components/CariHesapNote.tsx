import Link from "next/link";
import { Clock, Landmark } from "lucide-react";
import type { MembershipStatus } from "@/lib/membershipStatus";

// Ürün detayında, fiyat ve "Sepete Ekle"nin hemen altında — cari hesap avantajını karar anında görünür
// kılan küçük not. Cari hesap YALNIZCA yetki tanımlanan firmalara açık (Firma.onlineCariHesapAktif);
// metinler bunu açıkça söylüyor, "tüm üyelere" vaadi yok.
//  - Yetkisi açık onaylı üye: "Cari hesabınızla ödeyebilirsiniz" (tanıtım değil, bilgi).
//  - Onaylı ama yetkisi kapalı üye: hiçbir şey (kendisine sunulmayan bir imkânı tanıtmıyoruz).
//  - Başvurusu bekleyen: "başvurunuz inceleniyor" (üyelik sayfasına gönderilmez).
//  - Diğerleri (misafir, başvurusu olmayan, reddedilen): üyelik sayfasına giden bağlantı.
export default function CariHesapNote({ status }: { status: MembershipStatus }) {
  if (status.kind === "approved") {
    if (!status.cariHesap) return null;
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <Landmark className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Cari hesabınızla ödeyebilirsiniz
      </p>
    );
  }

  if (status.kind === "pending") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Kurumsal üyelik başvurunuz inceleniyor
      </p>
    );
  }

  const href = status.kind === "guest" ? "/uyelik/kayit" : "/hesabim/uyelik-basvurusu";
  return (
    <Link href={href} className="mt-2 flex items-start gap-1.5 text-xs text-[var(--color-brand)] hover:underline">
      <Landmark className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Yetki tanımlanan onaylı kurumsal üyelere cari hesapla alışveriş imkânı</span>
    </Link>
  );
}
