"use client";

import { useState } from "react";
import AddressForm, { type AddressValues } from "./AddressForm";
import { deleteAddress, setDefaultAddress } from "./actions";
import { formatAddress } from "@/lib/addressCore";

type Address = AddressValues & { id: string; isDefaultShipping: boolean; isDefaultBilling: boolean };

export default function AddressBook({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<string | null>(addresses.length === 0 ? "new" : null);

  return (
    <div className="space-y-4">
      {addresses.map((a) =>
        editing === a.id ? (
          <div key={a.id} className="rounded-xl border border-[var(--color-brand-300)] bg-white p-5">
            <AddressForm values={a} onDone={() => setEditing(null)} />
            <button type="button" onClick={() => setEditing(null)} className="mt-2 text-sm text-neutral-500 underline">
              Vazgeç
            </button>
          </div>
        ) : (
          <div key={a.id} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-neutral-900">{a.label || a.recipientName}</span>
              {a.isDefaultShipping && (
                <span className="rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-700)]">
                  Varsayılan teslimat
                </span>
              )}
              {a.isDefaultBilling && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Varsayılan fatura</span>
              )}
            </div>
            <p className="text-sm text-neutral-700">{a.recipientName}{a.phone ? ` · ${a.phone}` : ""}</p>
            <p className="text-sm text-neutral-600">{formatAddress(a)}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <button type="button" onClick={() => setEditing(a.id)} className="font-medium text-[var(--color-brand)] hover:underline">
                Düzenle
              </button>
              {!a.isDefaultShipping && (
                <form action={setDefaultAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="kind" value="shipping" />
                  <button type="submit" className="text-neutral-600 hover:underline">Varsayılan teslimat yap</button>
                </form>
              )}
              {!a.isDefaultBilling && (
                <form action={setDefaultAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="kind" value="billing" />
                  <button type="submit" className="text-neutral-600 hover:underline">Varsayılan fatura yap</button>
                </form>
              )}
              <form
                action={deleteAddress}
                onSubmit={(e) => {
                  if (!window.confirm("Bu adres silinsin mi?")) e.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="text-red-600 hover:underline">Sil</button>
              </form>
            </div>
          </div>
        )
      )}

      {editing === "new" ? (
        <div className="rounded-xl border border-[var(--color-brand-300)] bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Yeni Adres</h2>
          <AddressForm onDone={() => setEditing(null)} />
          {addresses.length > 0 && (
            <button type="button" onClick={() => setEditing(null)} className="mt-2 text-sm text-neutral-500 underline">
              Vazgeç
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="w-full rounded-xl border border-dashed border-neutral-300 p-4 text-sm font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand-50)]"
        >
          + Yeni adres ekle
        </button>
      )}
    </div>
  );
}
