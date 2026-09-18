"use client";

import { useActionState } from "react";
import { submitMembershipApplication, type ApplicationState } from "../actions";

const initialState: ApplicationState = { error: null };

export default function UyelikBasvurusuPage() {
  const [state, formAction, pending] = useActionState(submitMembershipApplication, initialState);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold">Üyelik Başvurusu</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Firma/işletme bilgilerinizi girin, başvurunuz incelendikten sonra size özel fiyatlarla alışveriş yapabilirsiniz.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="unvan" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Firma / İşletme Adı
          </label>
          <input
            id="unvan"
            name="unvan"
            type="text"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="vkn" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Vergi Kimlik No (opsiyonel)
          </label>
          <input
            id="vkn"
            name="vkn"
            type="text"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="telefon" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Telefon
          </label>
          <input
            id="telefon"
            name="telefon"
            type="tel"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="adres" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Adres
          </label>
          <textarea
            id="adres"
            name="adres"
            rows={2}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="aciklama" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Ek Not (opsiyonel)
          </label>
          <textarea
            id="aciklama"
            name="aciklama"
            rows={2}
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
          {pending ? "Gönderiliyor..." : "Başvuruyu Gönder"}
        </button>
      </form>
    </div>
  );
}
