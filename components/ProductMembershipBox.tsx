import Link from "next/link";
import { Building2, Clock, Landmark } from "lucide-react";
import type { MembershipStatus } from "@/lib/membershipStatus";

// Ürün detayındaki İKİ üyelik mesajının (eski "cari hesap notu" + "Firma/işletme üyeliği başvurusu" kutusu) tek, derli toplu hâli.
// Cari hesap YALNIZCA yetki tanımlanan firmalara açık — metin bunu açıkça söylüyor, "tüm üyelere" vaadi yok.
//  - Onaylı üye, cari yetkisi açık : tek satır bilgi ("Cari hesabınızla ödeyebilirsiniz"), tanıtım kutusu YOK.
//  - Onaylı üye, cari yetkisi kapalı: hiçbir şey (kendisine sunulmayan imkânı tanıtmıyoruz).
//  - Başvurusu bekleyen             : kısa bilgi kutusu ("inceleniyor"), düğme yok.
//  - Diğerleri (misafir, başvurusu olmayan, reddedilen): tek kutu + tek düğme.
export default function ProductMembershipBox({ status }: { status: MembershipStatus }) {
  if (status.kind === "approved") {
    if (!status.cariHesap) return null;
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <Landmark className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Cari hesabınızla ödeyebilirsiniz
      </p>
    );
  }

  if (status.kind === "pending") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-sm text-neutral-600">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
        <p>Kurumsal üyelik başvurunuz inceleniyor. Onaylandığında firmanıza özel fiyatlar hesabınızda aktif olur.</p>
      </div>
    );
  }

  const href = status.kind === "guest" ? "/uyelik/kayit" : "/hesabim/uyelik-basvurusu";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand-800)]">Kurumsal üyelik</p>
          <p className="text-xs leading-relaxed text-neutral-600">
            Firmanıza özel indirimli fiyatlar. Yetki tanımlanan onaylı üyeler için cari hesapla alışveriş imkânı.
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="group shrink-0 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-hover)] active:scale-[0.98]"
      >
        Üyelik Başvurusu Yap
      </Link>
    </div>
  );
}
