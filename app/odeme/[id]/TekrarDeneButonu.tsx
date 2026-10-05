"use client";

import { useFormStatus } from "react-dom";

// Gönderim sürerken buton kilitlenir (çift tıklama). Asıl koruma sunucuda (tek açık oturum).
export default function TekrarDeneButonu({ etiket }: { etiket: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
    >
      {pending ? "Ödeme sayfası açılıyor..." : etiket}
    </button>
  );
}
