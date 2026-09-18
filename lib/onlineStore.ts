import { prisma } from "@/lib/prisma";

// The whole storefront reads/writes against this one virtual Store's Product
// rows (see magaza-crm's Store.isOnlineStore comment) — cached per request
// via a simple module-level promise would be premature at this catalog size,
// a single indexed lookup is cheap enough to just call directly.
export async function getOnlineStoreId(): Promise<string> {
  const store = await prisma.store.findFirst({ where: { isOnlineStore: true } });
  if (!store) throw new Error("Online Mağaza store'u bulunamadı — magaza-crm'de seed edilmeli.");
  return store.id;
}
