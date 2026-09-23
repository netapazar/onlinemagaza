import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/webSession";
import HesabimShell from "../HesabimShell";
import { PasswordForm } from "../profil/ProfileForms";

export const metadata = { title: "Şifre Değiştir", robots: { index: false } };

export default async function SifrePage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  return (
    <HesabimShell
      title="Şifre Değiştir"
      description="Şifreniz değişince diğer cihazlardaki oturumlarınız kapatılır ve e-posta adresinize bilgilendirme gönderilir."
    >
      <PasswordForm />
    </HesabimShell>
  );
}
