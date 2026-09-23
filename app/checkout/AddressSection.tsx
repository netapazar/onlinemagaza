"use client";

import { useState } from "react";
import Link from "next/link";
import { AddressFields } from "@/app/hesabim/adresler/AddressForm";
import type { CheckoutAddress } from "@/lib/cartActions";

const input =
  "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none";
const card = "space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm";

// Ödeme sayfası — teslimat ve fatura adresi. Kayıtlı adres seçildiğinde yalnız kimliği gönderilir; sunucu
// adresi müşteriye ait olduğunu doğrulayarak kendisi okur (bkz. createOrder).
export default function AddressSection({
  loggedIn,
  addresses,
  corporateUnvan,
}: {
  loggedIn: boolean;
  addresses: CheckoutAddress[];
  corporateUnvan: string | null;
}) {
  const defaultShipping = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];
  const [shippingChoice, setShippingChoice] = useState<string>(defaultShipping?.id ?? "new");
  const [billingSame, setBillingSame] = useState(true);
  const defaultBilling = addresses.find((a) => a.isDefaultBilling);
  const [billingChoice, setBillingChoice] = useState<string>(defaultBilling?.id ?? "new");

  return (
    <>
      <div className={card}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Teslimat Adresi</h2>
          {loggedIn && (
            <Link href="/hesabim/adresler" target="_blank" className="text-xs text-[var(--color-brand)] hover:underline">
              Adreslerimi yönet
            </Link>
          )}
        </div>

        {addresses.length > 0 && (
          <div className="space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                  shippingChoice === a.id ? "border-[var(--color-brand)] bg-[var(--color-brand-50)]" : "border-neutral-200"
                }`}
              >
                <input
                  type="radio"
                  name="shippingChoice"
                  checked={shippingChoice === a.id}
                  onChange={() => setShippingChoice(a.id)}
                  className="mt-0.5 accent-[var(--color-brand)]"
                />
                <span>
                  <span className="block font-medium text-neutral-900">{a.title}</span>
                  <span className="block text-neutral-600">{a.recipientName} · {a.text}</span>
                </span>
              </label>
            ))}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                shippingChoice === "new" ? "border-[var(--color-brand)] bg-[var(--color-brand-50)]" : "border-neutral-200"
              }`}
            >
              <input
                type="radio"
                name="shippingChoice"
                checked={shippingChoice === "new"}
                onChange={() => setShippingChoice("new")}
                className="accent-[var(--color-brand)]"
              />
              Yeni adres gir
            </label>
          </div>
        )}

        {shippingChoice !== "new" ? (
          <input type="hidden" name="shippingAddressId" value={shippingChoice} />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Adres</label>
              <input name="shippingLine1" type="text" required placeholder="Mahalle, cadde, no" className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Adres Devamı (opsiyonel)</label>
              <input name="shippingLine2" type="text" placeholder="Daire, kat vb." className={input} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">İl</label>
                <input name="shippingIl" type="text" required className={input} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">İlçe</label>
                <input name="shippingIlce" type="text" required className={input} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Posta Kodu</label>
                <input name="shippingPostaKodu" type="text" inputMode="numeric" maxLength={5} className={input} />
              </div>
            </div>
            {loggedIn && (
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" name="saveAddress" defaultChecked className="accent-[var(--color-brand)]" />
                Bu adresi adres defterime kaydet
              </label>
            )}
          </div>
        )}
      </div>

      <div className={card}>
        <h2 className="text-sm font-semibold text-neutral-900">Fatura Adresi</h2>
        {corporateUnvan ? (
          <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600">
            Faturanız firma bilgilerinizle (<span className="font-medium">{corporateUnvan}</span>) kesilir.{" "}
            <Link href="/hesabim/firma" target="_blank" className="text-[var(--color-brand)] hover:underline">
              Firma bilgilerim
            </Link>
          </p>
        ) : (
          <>
            <input type="hidden" name="billingSameAsShipping" value={billingSame ? "on" : "off"} />
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={billingSame}
                onChange={(e) => setBillingSame(e.target.checked)}
                className="accent-[var(--color-brand)]"
              />
              Fatura adresim teslimat adresiyle aynı
            </label>
            {!billingSame && (
              <div className="space-y-3">
                {addresses.length > 0 && (
                  <select
                    value={billingChoice}
                    onChange={(e) => setBillingChoice(e.target.value)}
                    aria-label="Fatura adresi"
                    className={input}
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} — {a.text}
                      </option>
                    ))}
                    <option value="new">Yeni fatura adresi gir</option>
                  </select>
                )}
                {billingChoice !== "new" && addresses.length > 0 ? (
                  <input type="hidden" name="billingAddressId" value={billingChoice} />
                ) : (
                  <AddressFields prefix="billing" showLabel={false} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
