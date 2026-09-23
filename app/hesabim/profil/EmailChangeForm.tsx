"use client";

import { useActionState, useState } from "react";
import { requestEmailChange, type FormState } from "./actions";

const initial: FormState = { error: null, done: false };
const input =
  "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none";

export default function EmailChangeForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [state, action, pending] = useActionState(requestEmailChange, initial);

  if (state.done) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
        {target} adresine bir onay bağlantısı gönderdik. Bağlantıya tıklayıp onayladığınızda e-posta adresiniz değişecek;
        o zamana kadar {email} adresi geçerli kalır.
      </p>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-[var(--color-brand)] hover:underline">
        E-posta adresimi değiştir
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="newEmail" className="mb-1.5 block text-sm font-medium text-neutral-700">Yeni E-posta</label>
        <input
          id="newEmail"
          name="newEmail"
          type="email"
          required
          autoComplete="email"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="emailCurrent" className="mb-1.5 block text-sm font-medium text-neutral-700">Mevcut Şifre</label>
        <input id="emailCurrent" name="current" type="password" required autoComplete="current-password" className={input} />
      </div>
      <p className="text-xs text-neutral-500">
        Yeni adrese bir onay bağlantısı gönderilir; onaylayınca değişir ve eski adresinize bilgilendirme gider.
      </p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
        >
          {pending ? "Gönderiliyor..." : "Onay Bağlantısı Gönder"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-neutral-500 underline">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
