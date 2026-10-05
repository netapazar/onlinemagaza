import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import HesabimShell from "../HesabimShell";
import { PasswordForm } from "../profil/ProfileForms";

export const metadata = { title: "Şifre Değiştir", robots: { index: false } };

export default async function SifrePage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    select: { mustChangePassword: true },
  });

  return (
    <HesabimShell
      title="Şifre Değiştir"
      description="Şifreniz değişince diğer cihazlardaki oturumlarınız kapatılır ve e-posta adresinize bilgilendirme gönderilir."
    >
      {customer?.mustChangePassword && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Geçici bir şifreyle giriş yaptınız. Lütfen devam etmeden önce kendi şifrenizi belirleyin — &quot;Mevcut
          şifre&quot; alanına size verilen geçici şifreyi yazın.
        </p>
      )}
      <PasswordForm />
    </HesabimShell>
  );
}
