"use client";

import { useActionState } from "react";
import { changePassword, updateProfile, type FormState } from "./actions";

const initial: FormState = { error: null, done: false };
const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none";
const buttonClass =
  "rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-50";

function Message({ state, success }: { state: FormState; success: string }) {
  if (state.error) return <p className="text-sm text-red-600">{state.error}</p>;
  if (state.done) return <p className="text-sm text-green-700">{success}</p>;
  return null;
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string | null; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-neutral-700">Ad Soyad</label>
        <input id="name" name="name" defaultValue={name} required maxLength={100} autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-neutral-700">Telefon</label>
        <input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} placeholder="0532 123 45 67" autoComplete="tel" className={inputClass} />
      </div>
      <div>
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">E-posta</span>
        <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600">{email}</p>
      </div>
      <Message state={state} success="Bilgileriniz güncellendi." />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="current" className="mb-1.5 block text-sm font-medium text-neutral-700">Mevcut Şifre</label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">Yeni Şifre</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        <p className="mt-1 text-xs text-neutral-500">En az 8 karakter.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-neutral-700">Yeni Şifre (tekrar)</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>
      <Message
        state={state}
        success="Şifreniz değiştirildi. Diğer cihazlardaki oturumlarınız kapatıldı ve e-posta adresinize bilgilendirme gönderildi."
      />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
      </button>
    </form>
  );
}
