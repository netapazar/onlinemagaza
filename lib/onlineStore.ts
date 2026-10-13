import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { KargoAyari } from "@/lib/shipping";

// The whole storefront reads/writes against this one virtual Store's Product
// rows (see magaza-crm's Store.isOnlineStore comment) — cached per request
// via a simple module-level promise would be premature at this catalog size,
// a single indexed lookup is cheap enough to just call directly.
export async function getOnlineStoreId(): Promise<string> {
  const store = await prisma.store.findFirst({ where: { isOnlineStore: true } });
  if (!store) throw new Error("Online Mağaza store'u bulunamadı — magaza-crm'de seed edilmeli.");
  return store.id;
}

// Vitrin fiyat artış oranı (%) — bkz. lib/pricing.ts computeListPriceCents.
// cache() — aynı sayfa render'ında (ör. ürün listesi + header) birden çok
// yerden çağrılırsa tekrar DB'ye gitmesin (getStorefrontCategoriesWithCounts'taki
// aynı gerekçe).
export const getOnlineFiyatArtisOrani = cache(async (): Promise<number> => {
  const store = await prisma.store.findFirst({ where: { isOnlineStore: true }, select: { onlineFiyatArtisOrani: true } });
  return store?.onlineFiyatArtisOrani ?? 0;
});

// Kargo ücreti ve ücretsiz kargo eşiği (CRM › Online Mağaza ayarı) — bkz. lib/shipping.ts. cache(): aynı istekte duyuru
// çubuğu, sayfa ve sepet birlikte okur.
export const getKargoAyari = cache(async (): Promise<KargoAyari> => {
  const store = await prisma.store.findFirst({
    where: { isOnlineStore: true },
    select: { kargoUcretiCents: true, ucretsizKargoEsigiCents: true },
  });
  return { ucretCents: store?.kargoUcretiCents ?? null, esikCents: store?.ucretsizKargoEsigiCents ?? 500000 };
});
