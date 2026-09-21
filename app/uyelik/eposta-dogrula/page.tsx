import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashResetToken, isResetTokenUsable } from "@/lib/passwordReset";
import VerifyForm from "./VerifyForm";
import { emailVerificationEnabled } from "@/lib/featureFlags";

export const metadata = { title: "E-posta Doğrulama", robots: { index: false } };

// E-postadaki bağlantı: /uyelik/eposta-dogrula?token=... Sayfa açılırken token'ın geçerli olup olmadığı KONTROL edilir
// ama TÜKETİLMEZ — tüketme yalnız kullanıcının bastığı düğmeyle (verifyEmail); e-posta güvenlik tarayıcıları bağlantıyı
// önceden açsa bile doğrulama kendiliğinden gerçekleşmez.
export default async function EpostaDogrulaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // Özellik kapalıyken (varsayılan) sayfa yalnızca bilgi verir; token'a bakılmaz.
  if (!emailVerificationEnabled()) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="mb-3 text-xl font-semibold">E-posta Doğrulama</h1>
          <p className="mb-4 rounded-lg bg-neutral-50 px-3 py-3 text-sm text-neutral-700">
            E-posta doğrulama şu anda kullanılmıyor; herhangi bir işlem yapmanız gerekmiyor.
          </p>
          <Link
            href="/hesabim"
            className="block rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
          >
            Hesabıma Git
          </Link>
        </div>
      </div>
    );
  }

  const { token } = await searchParams;
  const row = token
    ? await prisma.emailVerificationToken.findUnique({
        where: { tokenHash: hashResetToken(token) },
        select: { id: true, usedAt: true, expiresAt: true },
      })
    : null;
  const usable = isResetTokenUsable(row);

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">E-posta Doğrulama</h1>
        {usable && token ? (
          <>
            <p className="mb-6 text-sm text-neutral-500">
              E-posta adresinizi doğrulamak için aşağıdaki düğmeye basın.
            </p>
            <VerifyForm token={token} />
          </>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
              Bu doğrulama bağlantısının süresi dolmuş, daha önce kullanılmış ya da geçersiz. Giriş yapıp Hesabım
              sayfasından yeni bir doğrulama bağlantısı isteyebilirsiniz.
            </p>
            <Link
              href="/hesabim"
              className="block rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
            >
              Hesabıma Git
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
