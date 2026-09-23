"use client";

import { useActionState, useEffect } from "react";
import { saveAddress, type AddressFormState } from "./actions";

export type AddressValues = {
  id?: string;
  label: string | null;
  recipientName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  il: string;
  ilce: string;
  postaKodu: string | null;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

const initial: AddressFormState = { error: null, done: false };
const input =
  "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none";

// Adres defteri formu (yeni / düzenle). Ödeme sayfası aynı alan adlarını kullanır (bkz. AddressFields).
export default function AddressForm({ values, onDone }: { values?: AddressValues; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveAddress, initial);
  useEffect(() => {
    if (state.done) onDone?.();
  }, [state.done, onDone]);

  return (
    <form action={action} className="space-y-3">
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <AddressFields values={values} />
      <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isDefaultShipping" defaultChecked={values?.isDefaultShipping} className="accent-[var(--color-brand)]" />
          Varsayılan teslimat adresi
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isDefaultBilling" defaultChecked={values?.isDefaultBilling} className="accent-[var(--color-brand)]" />
          Varsayılan fatura adresi
        </label>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
      >
        {pending ? "Kaydediliyor..." : "Adresi Kaydet"}
      </button>
    </form>
  );
}

// Ortak adres alanları. prefix verilirse alan adları "<prefix>.<alan>" olur (ödemede teslimat/fatura ayrımı).
export function AddressFields({ values, prefix, showLabel = true }: { values?: Partial<AddressValues>; prefix?: string; showLabel?: boolean }) {
  const n = (k: string) => (prefix ? `${prefix}.${k}` : k);
  return (
    <div className="space-y-3">
      {showLabel && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Adres başlığı (opsiyonel)</label>
          <input name={n("label")} defaultValue={values?.label ?? ""} placeholder="ör. Ofis, Depo" maxLength={40} className={input} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Ad Soyad / Unvan</label>
          <input name={n("recipientName")} defaultValue={values?.recipientName ?? ""} required maxLength={100} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Telefon</label>
          <input name={n("phone")} type="tel" defaultValue={values?.phone ?? ""} placeholder="0532 123 45 67" className={input} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Adres</label>
        <input name={n("line1")} defaultValue={values?.line1 ?? ""} required placeholder="Mahalle, cadde, no" maxLength={200} className={input} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Adres Devamı (opsiyonel)</label>
        <input name={n("line2")} defaultValue={values?.line2 ?? ""} placeholder="Daire, kat vb." maxLength={200} className={input} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">İl</label>
          <input name={n("il")} defaultValue={values?.il ?? ""} required maxLength={50} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">İlçe</label>
          <input name={n("ilce")} defaultValue={values?.ilce ?? ""} required maxLength={50} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Posta Kodu</label>
          <input name={n("postaKodu")} defaultValue={values?.postaKodu ?? ""} inputMode="numeric" maxLength={5} className={input} />
        </div>
      </div>
    </div>
  );
}
