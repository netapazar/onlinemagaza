"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type AuthState } from "../actions";

const initialState: AuthState = { error: null };

export default function KayitPage() {
  const [state, formAction, pending] = useActionState(register, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Üye Ol</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Üye olarak size özel fiyatlardan yararlanabilirsiniz.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Ad Soyad
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

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
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Telefon (opsiyonel)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
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
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-neutral-400">En az 8 karakter</p>
          </div>

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
          >
            {pending ? "Kaydediliyor..." : "Üye Ol"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Zaten üye misiniz?{" "}
          <Link href="/uyelik/giris" className="font-medium text-neutral-900 underline">
            Giriş Yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
