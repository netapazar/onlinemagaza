import Link from "next/link";
import { ArrowRightIcon, ShieldCheckIcon, BoxesIcon, ClockIcon, InvoiceIcon, BankIcon, PercentIcon, TruckIcon } from "@/components/icons";
import type { MembershipStatus } from "@/lib/membershipStatus";

// Anasayfa "Kurumsal Üyelik Avantajları" bölümü. YALNIZCA sitede gerçekten çalışan şeyler
// vaat edilir; her maddenin dayanağı:
//  - Firmaya özel indirimli fiyat: Firma.onlineIskontoOrani, lib/pricing.ts'teki resolvePrice
//    (onaylı üyede fiyatlar bu oranla düşer). Oran firmaya göre değişir → yüzde yazılmıyor.
//  - Cari hesapla ödeme: checkout'ta "Cari hesabımla öde" — yalnız firmanın yetkisi (Firma.
//    onlineCariHesapAktif) açıksa görünür, sunucu tarafında zorunlu kontrol var (Grup 3).
//  - Aynı gün kargo: 13:30 kesim saati (lib/shipping.ts) — siparişe "aynı gün" bayrağı yazılır;
//    sitede zaten TrustBar/SSS'te aynı ifadeyle duyuruluyor.
//  - Toplu alım kolaylığı: adet alanına doğrudan rakam yazılabiliyor (QuantityStepper, Grup 1a).
//    Kademeli/toplu fiyat indirimi YOK — bu yüzden "toplu fiyat" değil "hızlı toplu sipariş" deniyor.
//  - Faturalı alışveriş: cari hesap/üye siparişleri irsaliye + cari harekete dönüşür ve personel
//    firma adına fatura keser (CRM "faturasız irsaliyeler" akışı). Otomatik e-Fatura vaadi YOK.
const BENEFITS = [
  {
    icon: PercentIcon,
    title: "Firmanıza özel indirimli fiyatlar",
    description: "Onaylanan firmaya tanımlanan indirim, ürün fiyatlarına otomatik yansır.",
  },
  {
    icon: BankIcon,
    title: "Cari hesapla alışveriş",
    description: "Cari hesap yetkisi tanımlanan firmalar siparişini cari hesabına işletebilir.",
  },
  {
    icon: TruckIcon,
    title: "Aynı gün kargo",
    description: "13:30'a kadar verilen siparişler aynı gün kargoya teslim edilir.",
  },
  {
    icon: BoxesIcon,
    title: "Hızlı toplu sipariş",
    description: "Adedi doğrudan yazın, ihtiyacınız olan miktarı tek adımda sepete ekleyin.",
  },
  {
    icon: InvoiceIcon,
    title: "Faturalı alışveriş",
    description: "Kurumsal siparişleriniz firma bilgilerinizle faturalandırılır.",
  },
];

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

// Onaylı üye: burada bir şey çizilmez (çubuk bilgi şeridinde). Diğerleri (misafir, başvurusu olmayan, reddedilen, bekleyen): KISA BANT
// (2026-10 yoğunluk turu — eskiden görselli büyük bölümdü, ürünlerden önce geliyordu ve hero'daki mesajı tekrarlıyordu): başlık,
// avantaj başlıkları etiket olarak, "Hemen Başvur". Bekleyende düğme yerine durum bilgisi.
export default function CorporateBenefits({ status }: { status: MembershipStatus }) {
  if (status.kind === "approved") return null; // onaylı üye çubuğu ana sayfada bilgi şeridinin içinde (ApprovedStrip)

  const applyHref = status.kind === "guest" ? "/uyelik/kayit" : "/hesabim/uyelik-basvurusu";

  return (
    <section
      aria-labelledby="kurumsal-avantajlar"
      className="mb-6 flex flex-col gap-4 rounded-2xl border border-[var(--color-brand-100)] bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:gap-6"
    >
      <h2 id="kurumsal-avantajlar" className="shrink-0 text-xl font-extrabold tracking-tight text-neutral-900 sm:text-[1.375rem]">
        Kurumsal Üyelik Avantajları
      </h2>

      <ul className="flex flex-1 flex-wrap gap-2">
        {BENEFITS.map(({ icon: Icon, title, description }) => (
          <li
            key={title}
            title={description}
            className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand-50)] py-1 pr-3 pl-1 ring-1 ring-[var(--color-brand-100)] ring-inset"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-brand)]">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[12.5px] font-semibold text-neutral-800">{title}</span>
          </li>
        ))}
      </ul>

      {status.kind === "pending" ? (
        <div className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--color-accent-50)] px-4 py-3 text-sm font-medium text-[var(--color-accent-800)] ring-1 ring-[var(--color-accent-200)]">
          <ClockIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          Başvurunuz inceleniyor — onaylandığında avantajlarınız aktif olacak.
          <Link href="/hesabim" className="ml-1 underline underline-offset-2">
            Hesabım
          </Link>
        </div>
      ) : (
        <Link
          href={applyHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
        >
          Hemen Başvur
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
