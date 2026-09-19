import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import { getMembershipStatus } from "@/lib/membershipStatus";
import { logout } from "@/app/uyelik/actions";

export default async function HesabimPage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  const [customer, status] = await Promise.all([
    prisma.webCustomer.findUnique({ where: { id: session.webCustomerId }, select: { name: true, email: true } }),
    getMembershipStatus(),
  ]);
  if (!customer) redirect("/uyelik/giris");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold">Hesabım</h1>
      <p className="mb-8 text-sm text-neutral-500">{customer.name} · {customer.email}</p>

      <div className="mb-6 rounded-xl border border-neutral-200 p-6">
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Üyelik Durumu</h2>
        {status.kind === "approved" ? (
          <p className="text-sm text-green-700">
            Kurumsal üyesiniz — {status.firmaUnvan}
            {status.discountPercent ? `, size özel %${status.discountPercent} indirim uygulanıyor.` : "."}
          </p>
        ) : status.kind === "pending" ? (
          <p className="text-sm text-amber-700">Üyelik başvurunuz inceleniyor.</p>
        ) : status.kind === "rejected" ? (
          <div className="space-y-2">
            <p className="text-sm text-red-700">Üyelik başvurunuz onaylanmadı.</p>
            <Link href="/hesabim/uyelik-basvurusu" className="text-sm font-medium underline">
              Tekrar başvur
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">
              Firma/işletme üyeliği başvurusu yaparsanız size özel fiyatlardan alışveriş yapabilirsiniz.
            </p>
            <Link
              href="/hesabim/uyelik-basvurusu"
              className="inline-block rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
            >
              Üyelik Başvurusu Yap
            </Link>
          </div>
        )}
      </div>

      <form action={logout}>
        <button type="submit" className="text-sm text-neutral-500 underline">
          Çıkış Yap
        </button>
      </form>
    </div>
  );
}
