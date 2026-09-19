import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembershipStatus } from "@/lib/membershipStatus";
import UyelikBasvuruForm from "./UyelikBasvuruForm";

// Üyelik modeli Madde 3 — bu sayfa artık her zaman formu göstermiyor,
// durum-farkında: onaylı/bekleyen üye form yerine kendi durum mesajını
// görüyor. Yeni kayıtlar zaten register() ile otomatik başvuru oluşturduğu
// için form fiilen sadece "no_application" (Madde 2 öncesinden kalma eski
// hesap) ve "rejected" (yeniden başvuru) durumlarında görünür.
export default async function UyelikBasvurusuPage() {
  const status = await getMembershipStatus();
  if (status.kind === "guest") redirect("/uyelik/giris");

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold">Kurumsal Üyelik</h1>

      {status.kind === "approved" ? (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
          <p className="text-sm font-medium text-green-800">
            Kurumsal üyesiniz{status.firmaUnvan ? ` — ${status.firmaUnvan}` : ""}, size özel indirimli
            fiyatlarla alışveriş yapıyorsunuz{status.discountPercent ? ` (%${status.discountPercent} indirim)` : ""}.
          </p>
        </div>
      ) : status.kind === "pending" ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-medium text-amber-800">
            Başvurunuz inceleniyor. Onaylandığında size özel fiyatlarla alışveriş yapabileceksiniz — onay
            beklerken de liste fiyatından alışverişe devam edebilirsiniz.
          </p>
          <Link href="/hesabim" className="mt-3 inline-block text-sm font-medium text-amber-800 underline">
            Hesabım&apos;a dön
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-neutral-500">
            {status.kind === "rejected"
              ? "Önceki başvurunuz onaylanmadı. Bilgilerinizi kontrol edip tekrar başvurabilirsiniz."
              : "Firma/işletme bilgilerinizi girin, başvurunuz incelendikten sonra size özel fiyatlarla alışveriş yapabilirsiniz."}
          </p>
          <UyelikBasvuruForm />
        </>
      )}
    </div>
  );
}
