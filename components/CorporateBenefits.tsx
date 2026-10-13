import { ShieldCheckIcon } from "@/components/icons";
import type { MembershipStatus } from "@/lib/membershipStatus";

// 2026-10-13: Misafire/onaysız üyeye gösterilen "Kurumsal Üyelik Avantajları" şeridi kaldırıldı — büyük üyelik mesajı ana
// sayfada yalnız hero'da (bkz. DESIGN.md / Üyelik mesajı). Maddelerin dayanakları (indirim: Firma.onlineIskontoOrani;
// cari hesap: Firma.onlineCariHesapAktif) hero slaydının metnine taşındı. Burada yalnız onaylı üyenin durum çubuğu kaldı.

// Onaylı üye çubuğu. Ana sayfada bilgi şeridiyle AYNI açık teal bandın alt satırı olarak çizilir (renk ritmi: iki teal
// bölüm art arda gelmesin — onaylı üyede büyük beyaz avantaj bölümü olmadığından çubuk ayrı blok olursa şeritle yan yana düşüyordu).
export function ApprovedStrip({ status }: { status: Extract<MembershipStatus, { kind: "approved" }> }) {
  const chips: string[] = [];
  if (status.discountPercent && status.discountPercent > 0) chips.push(`%${status.discountPercent} indirimli fiyatlar`);
  if (status.cariHesap) chips.push("Cari hesapla ödeme");
  chips.push("Aynı gün kargo (13:30'a kadar)");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-brand-100)] px-2 pt-4 sm:px-2.5">
      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-800)]">
        <ShieldCheckIcon className="h-5 w-5 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
        Kurumsal üyesiniz, avantajlarınız aktif
      </span>
      <span className="hidden truncate text-xs text-neutral-500 sm:inline">{status.firmaUnvan}</span>
      <ul className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <li key={chip} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-brand-700)] ring-1 ring-[var(--color-brand-200)]">
            {chip}
          </li>
        ))}
      </ul>
    </div>
  );
}
