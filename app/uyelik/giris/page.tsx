"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthState } from "../actions";

const initialState: AuthState = { error: null };

export default function GirisPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Giriş Yap</h1>
        <p className="mb-6 text-sm text-neutral-500">Hesabınıza giriş yapın</p>

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
              autoComplete="username"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
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
            {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Hesabınız yok mu?{" "}
          <Link href="/uyelik/kayit" className="font-medium text-neutral-900 underline">
            Üye Olun
          </Link>
        </p>
      </div>
    </div>
  );
}
