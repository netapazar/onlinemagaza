import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashResetToken, isResetTokenUsable } from "@/lib/passwordReset";
import ResetForm from "./ResetForm";

export const metadata = { title: "Şifre Sıfırla", robots: { index: false } };

// Bağlantı e-postadan gelir: /uyelik/sifre-sifirla?token=... Sayfa açılırken token'ın geçerli olup olmadığı
// KONTROL edilir ama TÜKETİLMEZ (tüketme yalnızca şifre gönderilince, resetPassword içinde).
export default async function SifreSifirlaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const row = token
    ? await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashResetToken(token) },
        select: { id: true, usedAt: true, expiresAt: true },
      })
    : null;
  const usable = isResetTokenUsable(row);

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Yeni Şifre Belirle</h1>
        {usable && token ? (
          <>
            <p className="mb-6 text-sm text-neutral-500">Hesabınız için yeni bir şifre belirleyin.</p>
            <ResetForm token={token} />
          </>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
              Bu bağlantının süresi dolmuş, daha önce kullanılmış ya da geçersiz. Lütfen yeni bir şifre
              sıfırlama bağlantısı isteyin.
            </p>
            <Link
              href="/uyelik/sifremi-unuttum"
              className="block rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
            >
              Yeni Bağlantı İste
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
