import Link from "next/link";

// Shown to anyone who isn't already an approved (Firma-linked) member — the
// literal "üyelik başvurusu yaparsam daha uygun fiyatlarla alacağım" promise
// from the plan, surfaced on every browsing page so it's not buried.
export default function MembershipBanner() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-700">
        Firma/işletme üyeliği başvurusu yaparsanız size özel indirimli fiyatlardan alışveriş yapabilirsiniz.
      </p>
      <Link
        href="/hesabim/uyelik-basvurusu"
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Üyelik Başvurusu Yap
      </Link>
    </div>
  );
}
