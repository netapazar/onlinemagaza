import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import HesabimShell from "../HesabimShell";
import { ProfileForm } from "./ProfileForms";

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
    </HesabimShell>
  );
}
