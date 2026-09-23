import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashResetToken, isResetTokenUsable } from "@/lib/passwordReset";
import ConfirmForm from "./ConfirmForm";

export const metadata = { title: "E-posta Değişikliği", robots: { index: false } };

// Yeni adrese giden bağlantı: /hesabim/eposta-onay?token=... Sayfa açılırken token KONTROL edilir ama TÜKETİLMEZ —
// değişiklik yalnız düğmeyle yapılır (e-posta güvenlik tarayıcıları bağlantıyı önceden açabilir). Giriş gerekmez.
export default async function EpostaOnayPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const row = token
    ? await prisma.emailVerificationToken.findUnique({
        where: { tokenHash: hashResetToken(token) },
        select: { id: true, usedAt: true, expiresAt: true, newEmail: true },
      })
    : null;
  const valid = !!row?.newEmail && isResetTokenUsable(row);

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">E-posta Değişikliği</h1>
        {valid ? (
          <ConfirmForm token={token} newEmail={row!.newEmail!} />
        ) : (
          <div className="space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">
              Bu onay bağlantısının süresi dolmuş, kullanılmış ya da geçersiz. Hesabım › Profil Bilgilerim&apos;den yeniden deneyebilirsiniz.
            </p>
            <Link href="/hesabim/profil" className="block text-center text-sm font-medium text-[var(--color-brand)] hover:underline">
              Profil Bilgilerime Git
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
