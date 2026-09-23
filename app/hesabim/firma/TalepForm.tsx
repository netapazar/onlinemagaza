"use client";

import { useActionState, useState } from "react";
import { submitFirmaBilgiTalebi, type TalepState } from "./actions";

const initial: TalepState = { error: null, done: false };
const input =
  "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none";

export default function TalepForm({ current }: { current: { unvan: string; vkn: string; vergiDairesi: string; faturaAdresi: string } }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitFirmaBilgiTalebi, initial);

  if (state.done) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
        Talebiniz alındı. İncelendikten sonra firma bilgileriniz güncellenecek ve size bilgi verilecek.
      </p>
    );
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[var(--color-brand)] px-4 py-2 text-sm font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand-50)]"
      >
        Değişiklik Talebi Bırak
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <p className="text-xs text-neutral-500">Değişmesini istediğiniz alanları düzeltin; diğerlerini olduğu gibi bırakın.</p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Unvan</label>
        <input name="unvan" defaultValue={current.unvan} required maxLength={250} className={input} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">VKN / TCKN</label>
          <input name="vkn" defaultValue={current.vkn} required inputMode="numeric" maxLength={11} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Vergi Dairesi</label>
          <input name="vergiDairesi" defaultValue={current.vergiDairesi} maxLength={100} className={input} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Fatura Adresi</label>
        <textarea name="faturaAdresi" defaultValue={current.faturaAdresi} rows={2} maxLength={500} className={input} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Not (opsiyonel)</label>
        <textarea name="not" rows={2} maxLength={1000} placeholder="ör. unvanımız değişti, yeni vergi levhası ektedir" className={input} />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
        >
          {pending ? "Gönderiliyor..." : "Talebi Gönder"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-neutral-500 underline">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
