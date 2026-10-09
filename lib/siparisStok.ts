// Online siparişin Ana Depo stok hareketi (stok yenilemesi, 2026-10). magaza-crm'de (src/lib/siparisStok.ts) ve
// magaza-online'da (lib/siparisStok.ts) BİREBİR aynıdır.
//
// Stok ödeme anında düşer, irsaliye/satış kaydı oluşturulurken DEĞİL:
//   * KART       : iyzico ödemesi sunucuda doğrulandığında (odemeSonucuIsle)
//   * HAVALE     : personel CRM'de "Havale ödemesi alındı" dediğinde
//   * CARI_HESAP : sipariş oluşturulduğunda (storefront checkout)
//   * İptal      : düşülmüşse geri eklenir
// Çift düşme koruması: WebOrder.stokDusulduAt tek bayraktır. Düşüm yalnız `stokDusulduAt IS NULL` koşullu
// güncellemesi 1 satır değiştirdiyse yapılır (aynı transaction'da); geri ekleme bunun tersidir. Aynı sipariş için
// iyzico dönüşü + takılı ödeme kontrolü + "İşle" aynı anda çalışsa bile tek düşüm olur.
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { depoStokDus, depoStokEkle, StokYetersizError } from "@/lib/depoStok";

type Tx = Prisma.TransactionClient;

async function siparisKalemleri(tx: Tx, orderId: string) {
  // Barkod siparişteki kopyadan değil ürünün GÜNCEL barkodundan alınır (barkod düzeltmesi tüm satırlara yazılır).
  const items = await tx.webOrderItem.findMany({
    where: { webOrderId: orderId },
    select: { quantity: true, name: true, product: { select: { barcode: true } } },
  });
  return items.map((i) => ({ barcode: i.product.barcode, quantity: i.quantity, name: i.name }));
}

// Transaction içinde: bayrak boşsa düşer. E-ticaret kuralı (eksi yok, ayrılan satılmaz) ihlal edilirse
// StokYetersizError fırlatır → çağıranın transaction'ı geri sarılır. true: bu çağrı düştü, false: zaten düşülmüştü.
export async function siparisStokunuDusTx(tx: Tx, orderId: string, userId: string | null): Promise<boolean> {
  const claim = await tx.webOrder.updateMany({
    where: { id: orderId, stokDusulduAt: null, status: { not: "IPTAL_EDILDI" } },
    data: { stokDusulduAt: new Date(), stokYetersizAt: null },
  });
  if (claim.count !== 1) return false;
  await depoStokDus(tx, await siparisKalemleri(tx, orderId), {
    kanal: "ETICARET",
    source: "Online Sipariş",
    referans: `WebOrder:${orderId}`,
    userId,
  });
  return true;
}

// Transaction içinde: düşülmüşse geri ekler (iptal). true: bu çağrı geri ekledi.
export async function siparisStokunuGeriEkleTx(tx: Tx, orderId: string, userId: string | null): Promise<boolean> {
  const claim = await tx.webOrder.updateMany({
    where: { id: orderId, stokDusulduAt: { not: null } },
    data: { stokDusulduAt: null },
  });
  if (claim.count !== 1) return false;
  await depoStokEkle(tx, await siparisKalemleri(tx, orderId), {
    kanal: "ETICARET",
    source: "Online Sipariş İptali",
    referans: `WebOrder:${orderId}`,
    userId,
  });
  return true;
}

export type OdemeStokSonucu = { durum: "DUSULDU" | "ZATEN" } | { durum: "YETERSIZ"; urunler: string[] };

// Kendi transaction'ında (ödeme kaydından AYRI): ödeme zaten yazılmıştır, stok yetmezse ödeme geri alınmaz —
// sipariş ODENDI kalır, stokYetersizAt işaretlenir, çağıran yöneticiye bildirir. Kısmi düşüm olmaz.
export async function odemeSonrasiStokDus(orderId: string, userId: string | null): Promise<OdemeStokSonucu> {
  try {
    const dustu = await prisma.$transaction((tx) => siparisStokunuDusTx(tx, orderId, userId));
    return { durum: dustu ? "DUSULDU" : "ZATEN" };
  } catch (e) {
    if (e instanceof StokYetersizError) {
      await prisma.webOrder.updateMany({
        where: { id: orderId, stokDusulduAt: null },
        data: { stokYetersizAt: new Date() },
      });
      return { durum: "YETERSIZ", urunler: e.urunler };
    }
    throw e;
  }
}
