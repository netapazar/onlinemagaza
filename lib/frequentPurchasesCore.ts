// Sık Aldıklarım — saf toplama (DB'ye dokunmaz, test edilebilir). Girdi: firmanın/müşterinin tek tek satın
// alma satırları (pazarlama irsaliyesi + online sipariş). Çıktı: barkod başına sıklık ve son alım bilgisi.

export type PurchaseLine = {
  barcode: string;
  quantity: number;
  unit: string; // satırın satış birimi (ADET/PAKET/…)
  at: Date;
  ref: string; // aynı alım olayını gruplamak için belge kimliği (irsaliye / sipariş)
  source: "pazarlama" | "online";
};

export type FrequentItem = {
  barcode: string;
  purchaseCount: number; // kaç farklı belgede alındı
  totalQuantity: number;
  lastAt: Date;
  lastQuantity: number; // son belgedeki toplam miktar (aynı belgede birden çok satır varsa toplanır)
  lastUnit: string;
};

export function aggregatePurchases(lines: PurchaseLine[]): FrequentItem[] {
  const byBarcode = new Map<string, PurchaseLine[]>();
  for (const l of lines) {
    if (!l.barcode || l.quantity <= 0) continue;
    const list = byBarcode.get(l.barcode);
    if (list) list.push(l);
    else byBarcode.set(l.barcode, [l]);
  }

  const items: FrequentItem[] = [];
  for (const [barcode, list] of byBarcode) {
    const refs = new Set(list.map((l) => `${l.source}:${l.ref}`));
    const last = list.reduce((a, b) => (b.at > a.at ? b : a));
    const lastRef = `${last.source}:${last.ref}`;
    const lastLines = list.filter((l) => `${l.source}:${l.ref}` === lastRef);
    items.push({
      barcode,
      purchaseCount: refs.size,
      totalQuantity: list.reduce((s, l) => s + l.quantity, 0),
      lastAt: last.at,
      lastQuantity: lastLines.reduce((s, l) => s + l.quantity, 0),
      lastUnit: last.unit,
    });
  }
  // En sık alınan önce; eşitlikte en son alınan önce.
  return items.sort((a, b) => b.purchaseCount - a.purchaseCount || b.lastAt.getTime() - a.lastAt.getTime());
}
