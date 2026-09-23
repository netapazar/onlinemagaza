import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import AddressBook from "./AddressBook";

export const metadata = { title: "Adreslerim", robots: { index: false } };

export default async function AdreslerPage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");
  const addresses = await prisma.webCustomerAddress.findMany({
    where: { webCustomerId: session.webCustomerId },
    orderBy: [{ isDefaultShipping: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true, label: true, recipientName: true, phone: true, line1: true, line2: true, il: true, ilce: true, postaKodu: true,
      isDefaultShipping: true, isDefaultBilling: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/hesabim" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-800">
        ← Hesabım
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Adreslerim</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Kayıtlı adreslerinizi siparişte listeden seçebilirsiniz. Varsayılan adresler ödeme sayfasında otomatik seçilir.
      </p>
      <AddressBook addresses={addresses} />
    </div>
  );
}
