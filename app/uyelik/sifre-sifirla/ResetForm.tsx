"use client";

import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "../actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";

const initialState: ResetPasswordState = { error: null };

export default function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Yeni şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-500">En az {MIN_PASSWORD_LENGTH} karakter.</p>
      </div>

      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Yeni şifre (tekrar)
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
        />
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
      >
        {pending ? "Kaydediliyor..." : "Şifremi Güncelle"}
      </button>
    </form>
  );
}
