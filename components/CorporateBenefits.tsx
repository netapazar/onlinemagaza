import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, Building2, Clock, FileText, Landmark, Percent, Truck } from "lucide-react";
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
    icon: Percent,
    title: "Firmanıza özel indirimli fiyatlar",
    description: "Onaylanan firmaya tanımlanan indirim, ürün fiyatlarına otomatik yansır.",
  },
  {
    icon: Landmark,
    title: "Cari hesapla alışveriş",
    description: "Cari hesap yetkisi tanımlanan firmalar siparişini cari hesabına işletebilir.",
  },
  {
    icon: Truck,
    title: "Aynı gün kargo",
    description: "13:30'a kadar verilen siparişler aynı gün kargoya teslim edilir.",
  },
  {
    icon: Boxes,
    title: "Hızlı toplu sipariş",
    description: "Adedi doğrudan yazın, ihtiyacınız olan miktarı tek adımda sepete ekleyin.",
  },
  {
    icon: FileText,
    title: "Faturalı alışveriş",
    description: "Kurumsal siparişleriniz firma bilgilerinizle faturalandırılır.",
  },
];

// Sağdaki görsel: soyut bir "kurumsal üye kartı" + fatura + koli/kargo çizimi (harici görsel yok).
function BenefitsIllustration() {
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="Kurumsal üye kartı, fatura ve kargo kolisi çizimi" className="h-full max-h-[300px] w-full max-w-[380px] overflow-visible">
      <circle cx="300" cy="50" r="70" fill="white" fillOpacity="0.07" />
      <circle cx="40" cy="260" r="60" fill="white" fillOpacity="0.07" />
      {/* Fatura */}
      <g transform="rotate(7 285 150)">
        <rect x="222" y="62" width="112" height="146" rx="10" fill="white" fillOpacity="0.95" />
        <rect x="236" y="80" width="46" height="8" rx="4" fill="#0e6b6b" fillOpacity="0.85" />
        <rect x="236" y="100" width="84" height="5" rx="2.5" fill="#cbd5d5" />
        <rect x="236" y="114" width="70" height="5" rx="2.5" fill="#cbd5d5" />
        <rect x="236" y="128" width="78" height="5" rx="2.5" fill="#cbd5d5" />
        <rect x="236" y="150" width="84" height="1.5" fill="#d9e2e2" />
        <rect x="262" y="164" width="58" height="9" rx="4.5" fill="#f2a33a" />
        <circle cx="244" cy="186" r="8" fill="#189089" />
        <path d="M240 186l3 3 6-6.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Üye kartı */}
      <g transform="rotate(-5 130 140)">
        <rect x="26" y="64" width="212" height="132" rx="16" fill="white" />
        <rect x="26" y="64" width="212" height="34" rx="16" fill="#0b5555" />
        <rect x="26" y="82" width="212" height="16" fill="#0b5555" />
        <text x="42" y="86" fontSize="11" fontWeight="700" letterSpacing="1.6" fill="white">KURUMSAL ÜYE</text>
        <rect x="42" y="114" width="30" height="24" rx="5" fill="#f2a33a" />
        <rect x="42" y="118" width="30" height="1.5" fill="#db8620" />
        <rect x="42" y="124" width="30" height="1.5" fill="#db8620" />
        <rect x="42" y="130" width="30" height="1.5" fill="#db8620" />
        <rect x="88" y="118" width="104" height="7" rx="3.5" fill="#cbd5d5" />
        <rect x="88" y="132" width="72" height="7" rx="3.5" fill="#dfe7e7" />
        <rect x="42" y="158" width="62" height="20" rx="10" fill="#eefbfa" stroke="#71d1cb" />
        <text x="73" y="172" fontSize="10" fontWeight="600" textAnchor="middle" fill="#0b5555">Özel fiyat</text>
        <rect x="112" y="158" width="72" height="20" rx="10" fill="#fff8ec" stroke="#ffc04d" />
        <text x="148" y="172" fontSize="10" fontWeight="600" textAnchor="middle" fill="#92511a">Cari hesap</text>
      </g>
      {/* Koli */}
      <g transform="translate(150 196)">
        <path d="M0 26 L48 6 L96 26 L48 46 Z" fill="#d6a45f" />
        <path d="M0 26 L48 46 L48 96 L0 76 Z" fill="#c08b45" />
        <path d="M96 26 L48 46 L48 96 L96 76 Z" fill="#a9772f" />
        <path d="M24 16 L72 36 L72 46 L48 36 Z" fill="#f4e2bd" fillOpacity="0.85" />
        <rect x="14" y="52" width="24" height="5" rx="2.5" fill="white" fillOpacity="0.7" transform="rotate(22 14 52)" />
      </g>
    </svg>
  );
}

function ApprovedStrip({ status }: { status: Extract<MembershipStatus, { kind: "approved" }> }) {
  const chips: string[] = [];
  if (status.discountPercent && status.discountPercent > 0) chips.push(`%${status.discountPercent} indirimli fiyatlar`);
  if (status.cariHesap) chips.push("Cari hesapla ödeme");
  chips.push("Aynı gün kargo (13:30'a kadar)");
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-4 py-3 sm:px-5">
      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-800)]">
        <BadgeCheck className="h-5 w-5 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
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

// Onaylı üye: yalnız kısa şerit. Diğerleri (misafir, başvurusu olmayan, reddedilen, bekleyen):
// görselli avantaj bölümü; bekleyende "Hemen Başvur" yerine durum bilgisi gösterilir.
export default function CorporateBenefits({ status }: { status: MembershipStatus }) {
  if (status.kind === "approved") return <ApprovedStrip status={status} />;

  const applyHref = status.kind === "guest" ? "/uyelik/kayit" : "/hesabim/uyelik-basvurusu";

  return (
    <section aria-labelledby="kurumsal-avantajlar" className="mb-5 overflow-hidden rounded-2xl border border-[var(--color-brand-100)] bg-white shadow-sm">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <div className="p-5 sm:p-8">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-50)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-700)]">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            Kurumsal Üyelik
          </span>
          <h2 id="kurumsal-avantajlar" className="mb-2 text-2xl font-extrabold text-neutral-900 sm:text-3xl">
            Kurumsal Üyelik Avantajları
          </h2>
          <p className="mb-6 max-w-xl text-sm text-neutral-600 sm:text-base">
            Firmanız için tedarik süreci daha hızlı ve daha uygun. Başvurunuz incelenip onaylandığında avantajlarınız
            hesabınızda aktif olur.
          </p>

          <ul className="mb-7 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">{title}</span>
                  <span className="block text-xs leading-relaxed text-neutral-500">{description}</span>
                </span>
              </li>
            ))}
          </ul>

          {status.kind === "pending" ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent-50)] px-4 py-3 text-sm font-medium text-[var(--color-accent-800)] ring-1 ring-[var(--color-accent-200)]">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              Başvurunuz inceleniyor — onaylandığında avantajlarınız aktif olacak.
              <Link href="/hesabim" className="ml-1 underline underline-offset-2">
                Hesabım
              </Link>
            </div>
          ) : (
            <Link
              href={applyHref}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
            >
              Hemen Başvur
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="relative order-first flex h-52 items-center justify-center bg-gradient-to-br from-[var(--color-brand-700)] to-[var(--color-brand-500)] p-4 lg:order-last lg:h-auto lg:p-8">
          <BenefitsIllustration />
        </div>
      </div>
    </section>
  );
}
