import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import { logout } from "@/app/uyelik/actions";

export default async function HesabimPage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    include: {
      firma: true,
      membershipApplications: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!customer) redirect("/uyelik/giris");

  const isApprovedMember = Boolean(customer.firma?.onlineErisimAktif);
  const latestApplication = customer.membershipApplications[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold">Hesabım</h1>
      <p className="mb-8 text-sm text-neutral-500">
        {customer.name} · {customer.email}
      </p>

      <div className="mb-6 rounded-xl border border-neutral-200 p-6">
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Üyelik Durumu</h2>
        {isApprovedMember ? (
          <p className="text-sm text-green-700">
            Onaylı üyesiniz{customer.firma?.onlineIskontoOrani ? ` — %${customer.firma.onlineIskontoOrani} özel indirim uygulanıyor.` : "."}
          </p>
        ) : latestApplication?.status === "BEKLIYOR" ? (
          <p className="text-sm text-amber-700">Üyelik başvurunuz inceleniyor.</p>
        ) : latestApplication?.status === "REDDEDILDI" ? (
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
              className="inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
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
