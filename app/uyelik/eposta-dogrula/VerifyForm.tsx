"use client";

import Link from "next/link";
import { useActionState } from "react";
import { verifyEmail, type VerifyEmailState } from "../actions";

const initialState: VerifyEmailState = { error: null, done: false };

export default function VerifyForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(verifyEmail, initialState);

  if (state.done) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          E-posta adresiniz doğrulandı. Teşekkürler!
        </p>
        <Link
          href="/hesabim"
          className="block rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
        >
          Hesabıma Git
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
      >
        {pending ? "Doğrulanıyor..." : "E-postamı Doğrula"}
      </button>
    </form>
  );
}
