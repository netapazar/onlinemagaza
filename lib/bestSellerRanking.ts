import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Çok Satanlar sıralaması (2026-09-23 kararı): barkod bazlı, pazarlama + online birlikte, son 90 gün.
// Ölçüt: ürünün geçtiği FARKLI belge sayısı (pazarlama irsaliyesi + online sipariş), eşitlikte ciro (TL).
// Adet toplamı KULLANILMAZ: pazarlama kayıtlarında paketli ürünler de "adet" yazıldığı için (ör. 100'lü zarf
// "1500 adet") adetler birimler arasında karşılaştırılamaz; belge sayısı ve ciro birimden bağımsızdır.
// Sonuç günde bir yeniden hesaplanır (önbellek); yalnız barkod SIRASI önbelleğe girer — fiyat, stok ve
// yayın durumu her istekte güncel okunur. Sitede yalnız sıralama görünür, sayılar gösterilmez.

export const BEST_SELLER_WINDOW_DAYS = 90;
const RANK_LIMIT = 300;

export type BestSellerRank = { barcode: string; belge: number; ciroKurus: number };

async function computeRanking(): Promise<BestSellerRank[]> {
  // Online siparişin ürettiği irsaliye (cari hesap / üye siparişi) pazarlama tarafında sayılmaz — çift sayım olmasın.
  // İptal edilen irsaliyeler ve onları iptal eden ters kayıtlar da sayılmaz.
  const rows = await prisma.$queryRaw<{ barcode: string; belge: bigint; ciro: bigint }[]>`
    WITH olaylar AS (
      SELECT p.barcode, 'i:' || ir.id AS belge, k."netTutarCents"::bigint AS tutar
      FROM "IrsaliyeKalemi" k
      JOIN "Irsaliye" ir ON ir.id = k."irsaliyeId"
      JOIN "Product" p ON p.id = k."productId"
      WHERE NOT ir.iptal
        AND ir.tarih >= now() - make_interval(days => ${BEST_SELLER_WINDOW_DAYS})
        AND NOT EXISTS (SELECT 1 FROM "Irsaliye" x WHERE x."iptalEdenId" = ir.id)
        AND NOT EXISTS (SELECT 1 FROM "WebOrder" w WHERE w."irsaliyeId" = ir.id)
      UNION ALL
      SELECT i.barcode, 'w:' || w.id AS belge, i."lineTotalCents"::bigint AS tutar
      FROM "WebOrderItem" i
      JOIN "WebOrder" w ON w.id = i."webOrderId"
      WHERE w.status NOT IN ('ODEME_BEKLIYOR', 'IPTAL_EDILDI')
        AND w."createdAt" >= now() - make_interval(days => ${BEST_SELLER_WINDOW_DAYS})
    )
    SELECT barcode, count(DISTINCT belge) AS belge, coalesce(sum(tutar), 0) AS ciro
    FROM olaylar
    WHERE barcode IS NOT NULL AND barcode <> ''
    GROUP BY barcode
    ORDER BY belge DESC, ciro DESC
    LIMIT ${RANK_LIMIT}`;
  return rows.map((r) => ({ barcode: r.barcode, belge: Number(r.belge), ciroKurus: Number(r.ciro) }));
}

export const getBestSellerRanking = unstable_cache(computeRanking, ["cok-satanlar-sirasi-v1"], {
  revalidate: 60 * 60 * 24,
  tags: ["cok-satanlar"],
});
