import Link from "next/link";
import { Info } from "lucide-react";

// Üyelik modeli Madde 3 — Madde 2 öncesinden kalma "yetim" hesaplar (üye
// oldu ama hiç kurumsal başvuru yapmadı) için tek tıkla tamamlanabilir bir
// hatırlatma. Sadece getMembershipStatus() "no_application" dönerse görünür
// (bkz. Header.tsx).
export default function MembershipReminderBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <Link
        href="/hesabim/uyelik-basvurusu"
        className="mx-auto flex max-w-content items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-amber-800 hover:text-amber-900"
      >
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Üyelik başvurunuzu tamamlayın, firmanıza özel fiyatlardan yararlanın →
      </Link>
    </div>
  );
}
