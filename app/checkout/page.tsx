"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useCart } from "@/components/CartProvider";
import {
  getCartDetails,
  getCheckoutEligibility,
  createOrder,
  type CartLine,
  type CreateOrderState,
} from "@/lib/cartActions";
import { centsToTl } from "@/lib/pricing";

const initialState: CreateOrderState = { error: null };

export default function CheckoutPage() {
  const { items } = useCart();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [totals, setTotals] = useState({ subtotalCents: 0, shippingCents: 0, totalCents: 0 });
  const [eligibility, setEligibility] = useState<{
    loggedIn: boolean;
    name: string;
    email: string;
    phone: string;
    canUseCariHesap: boolean;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("KART");
  const [sozlesmeOnay, setSozlesmeOnay] = useState(false);
  const [state, formAction, pending] = useActionState(createOrder, initialState);

  useEffect(() => {
    getCartDetails(items).then((result) => {
      setLines(result.lines);
      setTotals(result);
    });
  }, [items]);

  useEffect(() => {
    getCheckoutEligibility().then(setEligibility);
  }, []);

  if (lines === null || eligibility === null) {
    return <div className="mx-auto w-full max-w-2xl px-4 py-10 text-sm text-neutral-500">Yükleniyor...</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="mb-4 text-sm text-neutral-500">Sepetiniz boş.</p>
        <Link href="/" className="text-sm font-medium text-neutral-900 underline">
          Alışverişe devam et
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Siparişi Tamamla</h1>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="items" value={JSON.stringify(items)} />

        {!eligibility.loggedIn && (
          <div className="space-y-4 rounded-xl border border-neutral-200 p-5">
            <h2 className="text-sm font-semibold text-neutral-900">İletişim Bilgileri</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Ad Soyad</label>
              <input
                name="guestName"
                type="text"
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">E-posta</label>
                <input
                  name="guestEmail"
                  type="email"
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Telefon</label>
                <input
                  name="guestPhone"
                  type="tel"
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-neutral-400">
              Üye olarak sipariş vermek ister misiniz?{" "}
              <Link href="/uyelik/giris" className="underline">
                Giriş yapın
              </Link>
            </p>
          </div>
        )}

        <div className="space-y-4 rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Teslimat Adresi</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Adres</label>
            <input
              name="shippingLine1"
              type="text"
              required
              placeholder="Mahalle, cadde, no"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Adres Devamı (opsiyonel)</label>
            <input
              name="shippingLine2"
              type="text"
              placeholder="Daire, kat vb."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">İl</label>
              <input
                name="shippingIl"
                type="text"
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">İlçe</label>
              <input
                name="shippingIlce"
                type="text"
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Posta Kodu</label>
              <input
                name="shippingPostaKodu"
                type="text"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Ödeme Yöntemi</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              value="KART"
              checked={paymentMethod === "KART"}
              onChange={() => setPaymentMethod("KART")}
              className="accent-[var(--color-brand)]"
            />
            Kredi/Banka Kartı
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              value="HAVALE"
              checked={paymentMethod === "HAVALE"}
              onChange={() => setPaymentMethod("HAVALE")}
              className="accent-[var(--color-brand)]"
            />
            Havale/EFT
          </label>
          {eligibility.canUseCariHesap && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                value="CARI_HESAP"
                checked={paymentMethod === "CARI_HESAP"}
                onChange={() => setPaymentMethod("CARI_HESAP")}
                className="accent-[var(--color-brand)]"
              />
              Cari Hesabıma İşle
            </label>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 p-5">
          <div className="flex justify-between text-sm text-neutral-500">
            <span>Ara Toplam</span>
            <span>{centsToTl(totals.subtotalCents)} ₺</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500">
            <span>Kargo</span>
            <span>{totals.shippingCents === 0 ? "Ücretsiz" : `${centsToTl(totals.shippingCents)} ₺`}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-base font-semibold text-neutral-900">
            <span>Toplam</span>
            <span>{centsToTl(totals.totalCents)} ₺</span>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={sozlesmeOnay}
            onChange={(e) => setSozlesmeOnay(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]"
          />
          <span>
            <Link href="/hukuki/mesafeli-satis-sozlesmesi" target="_blank" className="underline">
              Mesafeli Satış Sözleşmesi
            </Link>
            &apos;ni ve{" "}
            <Link href="/hukuki/cayma-hakki" target="_blank" className="underline">
              Cayma Hakkı ve İade Koşulları
            </Link>
            &apos;nı okudum, kabul ediyorum.
          </span>
        </label>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending || !sozlesmeOnay}
          className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
        >
          {pending ? "Sipariş oluşturuluyor..." : "Siparişi Onayla"}
        </button>
      </form>
    </div>
  );
}
