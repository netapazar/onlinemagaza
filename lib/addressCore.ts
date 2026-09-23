// Adres defteri ve ödeme adresinin saf doğrulama kuralları (DB'ye dokunmaz, test edilebilir).
import { normalizePhone } from "./profileValidation";

export type AddressInput = {
  label: string | null;
  recipientName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  il: string;
  ilce: string;
  postaKodu: string | null;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const clean = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// get: form alanı okuyucu (FormData.get ya da nesne); prefix: aynı formda teslimat/fatura ayrımı için alan öneki.
export function parseAddress(get: (name: string) => unknown, opts: { requirePhone?: boolean } = {}): Result<AddressInput> {
  const recipientName = clean(get("recipientName"), 100);
  const line1 = clean(get("line1"), 200);
  const line2 = clean(get("line2"), 200);
  const il = clean(get("il"), 50);
  const ilce = clean(get("ilce"), 50);
  const postaKodu = clean(get("postaKodu"), 10);
  const label = clean(get("label"), 40);

  if (recipientName.length < 2) return { ok: false, error: "Ad soyad / unvan girin." };
  if (line1.length < 5) return { ok: false, error: "Adres satırı çok kısa." };
  if (!il) return { ok: false, error: "İl girin." };
  if (!ilce) return { ok: false, error: "İlçe girin." };
  if (postaKodu && !/^\d{5}$/.test(postaKodu)) return { ok: false, error: "Posta kodu 5 haneli olmalı." };
  const phone = normalizePhone(get("phone"));
  if (!phone.ok) return { ok: false, error: phone.error };
  if (opts.requirePhone && !phone.value) return { ok: false, error: "Telefon girin." };

  return {
    ok: true,
    value: {
      label: label || null,
      recipientName,
      phone: phone.value,
      line1,
      line2: line2 || null,
      il: il.toLocaleUpperCase("tr-TR"),
      ilce: ilce.toLocaleUpperCase("tr-TR"),
      postaKodu: postaKodu || null,
    },
  };
}

// Tek satırlık gösterim (liste, sipariş özeti).
export function formatAddress(a: { line1: string; line2?: string | null; ilce: string; il: string; postaKodu?: string | null }): string {
  return [a.line1, a.line2, `${a.ilce} / ${a.il}`, a.postaKodu].filter(Boolean).join(", ");
}
