import { prisma } from "@/lib/prisma";
import { getOnlineStoreId, getOnlineFiyatArtisOrani } from "@/lib/onlineStore";
import { BASE_SELECT, toSummary, type StorefrontProductSummary } from "@/lib/search";
import { aggregatePurchases, type FrequentItem, type PurchaseLine } from "@/lib/frequentPurchasesCore";

export type FrequentPurchase = FrequentItem & { product: StorefrontProductSummary };

const LIMIT = 100;

// Sık Aldıklarım: firmanın pazarlama irsaliyeleri + firmaya bağlı tüm hesapların (ve bu müşterinin) online
// siparişleri, barkod bazında. Yalnız sitede yayında olan ürünler döner.
// Online cari hesap siparişi aynı zamanda bir irsaliye ürettiği için, siparişe bağlı irsaliyeler pazarlama
// tarafında sayılmaz (çift sayım olmasın).
export async function getFrequentPurchases(webCustomerId: string): Promise<FrequentPurchase[]> {
  const customer = await prisma.webCustomer.findUnique({ where: { id: webCustomerId }, select: { firmaId: true } });
  if (!customer) return [];
  const firmaId = customer.firmaId;

  const [pazarlama, online] = await Promise.all([
    firmaId
      ? prisma.irsaliyeKalemi.findMany({
          // iptal edilen irsaliyeler ve onları iptal eden ters kayıtlar sayılmaz
          where: { irsaliye: { firmaId, iptal: false, iptalEdilen: null, webOrder: null } },
          select: { quantity: true, unit: true, irsaliyeId: true, product: { select: { barcode: true } }, irsaliye: { select: { tarih: true } } },
        })
      : Promise.resolve([]),
    prisma.webOrderItem.findMany({
      where: {
        webOrder: {
          status: { notIn: ["ODEME_BEKLIYOR", "IPTAL_EDILDI"] },
          OR: [{ webCustomerId }, ...(firmaId ? [{ webCustomer: { firmaId } }] : [])],
        },
      },
      select: { quantity: true, barcode: true, webOrderId: true, product: { select: { unit: true } }, webOrder: { select: { createdAt: true } } },
    }),
  ]);

  const lines: PurchaseLine[] = [
    ...pazarlama.map((k) => ({
      barcode: k.product.barcode,
      quantity: k.quantity,
      unit: k.unit,
      at: k.irsaliye.tarih,
      ref: k.irsaliyeId,
      source: "pazarlama" as const,
    })),
    ...online.map((i) => ({
      barcode: i.barcode,
      quantity: i.quantity,
      unit: i.product.unit,
      at: i.webOrder.createdAt,
      ref: i.webOrderId,
      source: "online" as const,
    })),
  ];
  const items = aggregatePurchases(lines);
  if (items.length === 0) return [];

  const [storeId, markupPercent] = await Promise.all([getOnlineStoreId(), getOnlineFiyatArtisOrani()]);
  const products = await prisma.product.findMany({
    where: { storeId, showOnStorefront: true, archivedAt: null, barcode: { in: items.map((i) => i.barcode) } },
    select: { ...BASE_SELECT, barcode: true },
  });
  const byBarcode = new Map(products.map((p) => [p.barcode, toSummary(p, markupPercent)]));

  return items
    .filter((i) => byBarcode.has(i.barcode))
    .slice(0, LIMIT)
    .map((i) => ({ ...i, product: byBarcode.get(i.barcode)! }));
}
