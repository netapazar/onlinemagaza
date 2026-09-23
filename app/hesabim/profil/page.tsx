import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import HesabimShell from "../HesabimShell";
import { ProfileForm } from "./ProfileForms";
import EmailChangeForm from "./EmailChangeForm";

export const metadata = { title: "Profil Bilgilerim", robots: { index: false } };

export default async function ProfilPage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");
  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    select: { name: true, phone: true, email: true },
  });
  if (!customer) redirect("/uyelik/giris");

  return (
    <HesabimShell title="Profil Bilgilerim" description="Ad soyad ve telefon bilginizi güncelleyebilirsiniz.">
      <ProfileForm name={customer.name} phone={customer.phone} email={customer.email} />
      <div className="mt-6 border-t border-neutral-100 pt-5">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">E-posta Adresi</h2>
        <EmailChangeForm email={customer.email} />
      </div>
    </HesabimShell>
  );
}
