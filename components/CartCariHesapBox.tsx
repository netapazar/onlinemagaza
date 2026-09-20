import Link from "next/link";
import { Clock, Landmark } from "lucide-react";

// Sepet sayfasında "Siparişi Tamamla"nın üstünde. Yalnız misafir / başvurusu olmayan / reddedilmiş
// kullanıcıya tanıtım kutusu; başvurusu bekleyene durum bilgisi; onaylı üyelere hiçbir şey
// (yetkisi açıksa ödeme adımında zaten seçenek görüyor). Metin dürüst: cari hesap yalnız yetki
// tanımlanan firmalara açık.
export type CartMembershipHint = { kind: "guest" | "approved" | "pending" | "rejected" | "no_application" };

export default function CartCariHesapBox({ kind }: CartMembershipHint) {
  if (kind === "approved") return null;

  if (kind === "pending") {
    return (
      <p className="mt-6 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600 ring-1 ring-neutral-200">
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        Kurumsal üyelik başvurunuz inceleniyor.
      </p>
    );
  }

  const href = kind === "guest" ? "/uyelik/kayit" : "/hesabim/uyelik-basvurusu";
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--color-brand)] ring-1 ring-[var(--color-brand-200)]">
          <Landmark className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            Kurumsal üye olun, siparişlerinizi cari hesabınıza işleyelim
          </p>
          <p className="mt-0.5 text-xs text-neutral-600">
            Cari hesap yalnızca yetki verilen firmalara açıktır; başvurunuz incelenip onaylanır.
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
      >
        Kurumsal Üyelik Başvurusu
      </Link>
    </div>
  );
}
