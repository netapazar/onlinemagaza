"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ResetRequestState } from "../actions";
import { RESET_TOKEN_TTL_MINUTES } from "@/lib/passwordPolicy";

const initialState: ResetRequestState = { error: null, sent: false };

export default function SifremiUnuttumPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Şifremi Unuttum</h1>

        {state.sent ? (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              Bu e-posta adresiyle kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Bağlantı{" "}
              {RESET_TOKEN_TTL_MINUTES} dakika geçerlidir. E-posta birkaç dakika içinde gelmezse gereksiz
              (spam) klasörünüze de bakın.
            </p>
            <Link href="/uyelik/giris" className="block text-center text-sm font-medium text-neutral-900 underline">
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-neutral-500">
              Hesabınızın e-posta adresini girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim.
            </p>
            <form action={formAction} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  E-posta
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                />
              </div>

              {state.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
              >
                {pending ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              <Link href="/uyelik/giris" className="font-medium text-neutral-900 underline">
                Giriş sayfasına dön
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
