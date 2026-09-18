import Link from "next/link";
import { Truck, Phone, Briefcase } from "lucide-react";

// wa.me numarasıyla aynı hat (bkz. WhatsAppButton) — ayrı bir sabit hat
// numarası tanımlı değil, tek irtibat noktası bu.
const PHONE_DISPLAY = "0551 487 21 74";
const PHONE_HREF = "tel:+905514872174";

export default function AnnouncementBar() {
  return (
    <div className="bg-[var(--color-night)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-xs sm:justify-between">
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand-light)]" aria-hidden="true" />
          <span>Tüm siparişlerde ücretsiz kargo</span>
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <a href={PHONE_HREF} className="flex items-center gap-1.5 hover:text-[var(--color-brand-light)]">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {PHONE_DISPLAY}
          </a>
          <Link href="/hesabim/uyelik-basvurusu" className="flex items-center gap-1.5 hover:text-[var(--color-brand-light)]">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            Kurumsal Üyelik
          </Link>
        </div>
      </div>
    </div>
  );
}
