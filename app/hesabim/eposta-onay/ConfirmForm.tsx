"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmEmailChange, type FormState } from "../profil/actions";

const initial: FormState = { error: null, done: false };

export default function ConfirmForm({ token, newEmail }: { token: string; newEmail: string }) {
  const [state, action, pending] = useActionState(confirmEmailChange, initial);
  if (state.done) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          E-posta adresiniz {newEmail} olarak değiştirildi. Bundan sonra bu adresle giriş yapabilirsiniz.
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
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-neutral-600">
        Hesabınızın e-posta adresi <span className="font-medium">{newEmail}</span> olarak değiştirilecek.
      </p>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-brand)] px-3 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
      >
        {pending ? "Değiştiriliyor..." : "E-posta Adresimi Değiştir"}
      </button>
    </form>
  );
}
