import { Prisma } from "@/generated/prisma/client";
import type { Product } from "@/generated/prisma/client";

// Stok yenilemesi (2026-10) — TEK HAVUZ. Ana Depo'nun (Store.isWarehouse) Product satırı tek gerçek stoktur;
// Online Mağaza ve Pazarlama Portalı satırları yalnız vitrin/katalog kaydıdır, `stock` alanları okunmaz.
// Kanal satırı ile depo satırı BARKOD ile eşleşir (barkod zaten mağazalar arası kimlik anahtarı).
// Ana Depo stoğuna dokunan her kanal (online sipariş, B2B irsaliye, mal kabul, gelecekte pazaryerleri)
// buradaki fonksiyonlardan geçer — yeni bir kanal için yeni havuz açılmaz, yalnız kanal kuralı seçilir.
// Mağazaların (Cadde/Sarayaltı/Sarı) kendi stokları ayrı kalır, bu modülün dışındadır.
//
// Aynı mantığın storefront kopyası: magaza-online/lib/depoStok.ts — kural değişirse ikisi birlikte değişir.

export type SatisKanali = "MAGAZA" | "PAZARLAMA" | "ETICARET" | "PAZARYERI";

type KanalKurali = {
  // Stok eksiye düşebilir mi (satış engellenmez mi)?
  eksiyeIzin: boolean;
  // Pazarlamaya ayrılan miktar bu kanalın satabileceği miktara dahil mi?
  ayrilaniKullanir: boolean;
};

export const KANAL_KURALLARI: Record<SatisKanali, KanalKurali> = {
  MAGAZA: { eksiyeIzin: true, ayrilaniKullanir: true },
  PAZARLAMA: { eksiyeIzin: true, ayrilaniKullanir: true },
  ETICARET: { eksiyeIzin: false, ayrilaniKullanir: false },
  PAZARYERI: { eksiyeIzin: false, ayrilaniKullanir: false },
};

export const KANAL_ETIKETLERI: Record<SatisKanali, string> = {
  MAGAZA: "Mağaza",
  PAZARLAMA: "Pazarlama",
  ETICARET: "E-ticaret",
  PAZARYERI: "Pazaryeri",
};

// Kanalın şu an satabileceği miktar (asla eksi değil).
export function satilabilirMiktar(kanal: SatisKanali, stock: number, pazarlamaAyrilan: number): number {
  const ayrilan = KANAL_KURALLARI[kanal].ayrilaniKullanir ? 0 : Math.max(0, pazarlamaAyrilan);
  return Math.max(0, stock - ayrilan);
}

// Değişmez kural: 0 <= ayrılan <= max(stok, 0). Stok düşünce ayrılan stoğa kırpılır.
export function ayrilaniKirp(stock: number, ayrilan: number): number {
  return Math.min(Math.max(0, ayrilan), Math.max(0, stock));
}

// Düşüm sonrası stok bu kanalın kuralını ihlal ediyor mu? (yalnız eksiye izin vermeyen kanallar için)
export function kuralIhlali(kanal: SatisKanali, yeniStok: number, pazarlamaAyrilan: number): boolean {
  const kural = KANAL_KURALLARI[kanal];
  if (kural.eksiyeIzin) return false;
  const ayrilan = kural.ayrilaniKullanir ? 0 : Math.max(0, pazarlamaAyrilan);
  return yeniStok - ayrilan < 0;
}

export class StokYetersizError extends Error {
  constructor(public urunler: string[]) {
    super(`Şu ürünlerde yeterli stok yok: ${urunler.join(", ")}`);
    this.name = "StokYetersizError";
  }
}

type Tx = Prisma.TransactionClient;

export async function depoStoreId(db: Tx): Promise<string> {
  const depo = await db.store.findFirst({ where: { isWarehouse: true }, select: { id: true } });
  if (!depo) throw new Error("Ana Depo bulunamadı (isWarehouse işaretli mağaza yok).");
  return depo.id;
}

// Aynı barkodlu herhangi bir satırdan Ana Depo satırı açar (stok 0) — transfer ekranının kullandığı alan kopyasıyla aynı.
async function depoSatiriAc(db: Tx, depoId: string, kaynak: Product): Promise<Product> {
  return db.product.create({
    data: {
      storeId: depoId,
      barcode: kaynak.barcode,
      barcodeIsGenerated: kaynak.barcodeIsGenerated,
      productCode: kaynak.productCode,
      name: kaynak.name,
      brandId: kaynak.brandId,
      categoryId: kaynak.categoryId,
      originCountry: kaynak.originCountry,
      isDomestic: kaynak.isDomestic,
      costPriceCents: kaynak.costPriceCents,
      salePriceCents: kaynak.salePriceCents,
      marketingPriceCents: kaynak.marketingPriceCents,
      vatRate: kaynak.vatRate,
      unit: kaynak.unit,
      stock: 0,
    },
  });
}

// Barkodları Ana Depo satırlarına çözer. olustur=true ise depoda olmayan barkod için (aynı barkodlu başka bir
// satırdan kopyalanarak) depo satırı açılır; false ise o barkod sonuçta yer almaz.
export async function depoUrunleri(
  db: Tx,
  barkodlar: string[],
  opts: { olustur?: boolean } = {}
): Promise<Map<string, Product>> {
  const depoId = await depoStoreId(db);
  const tekil = [...new Set(barkodlar)];
  const mevcut = await db.product.findMany({ where: { storeId: depoId, barcode: { in: tekil } } });
  const sonuc = new Map(mevcut.map((p) => [p.barcode, p]));
  if (opts.olustur) {
    for (const barkod of tekil) {
      if (sonuc.has(barkod)) continue;
      const kaynak = await db.product.findFirst({ where: { barcode: barkod }, orderBy: { createdAt: "asc" } });
      if (!kaynak) continue;
      sonuc.set(barkod, await depoSatiriAc(db, depoId, kaynak));
    }
  }
  return sonuc;
}

export type StokKalemi = { barcode: string; quantity: number; name?: string };

export type HareketBilgisi = {
  kanal: SatisKanali | null;
  // StockAdjustment.source — ekranda görünen kaynak ("Online Sipariş", "Pazarlama İrsaliyesi", "Mal Kabul" ...)
  source: string;
  // "WebOrder:<id>", "Irsaliye:<id>" ...
  referans: string | null;
  note?: string | null;
  // Personelsiz hareket (storefront kart ödemesi) için null.
  userId: string | null;
};

function topla(kalemler: StokKalemi[]): Map<string, { quantity: number; name?: string }> {
  const m = new Map<string, { quantity: number; name?: string }>();
  for (const k of kalemler) {
    if (!Number.isInteger(k.quantity) || k.quantity <= 0) throw new Error("Stok hareketi adedi pozitif tam sayı olmalı.");
    const e = m.get(k.barcode) ?? { quantity: 0, name: k.name };
    e.quantity += k.quantity;
    m.set(k.barcode, e);
  }
  return m;
}

async function ayrilanYaz(
  db: Tx,
  urun: { id: string; pazarlamaAyrilan: number },
  yeni: number,
  kaynak: string,
  userId: string | null,
  note: string | null
) {
  if (yeni === urun.pazarlamaAyrilan) return;
  await db.product.update({ where: { id: urun.id }, data: { pazarlamaAyrilan: yeni } });
  // Ayırma kaydının kullanıcısı zorunlu — personelsiz (storefront) harekette kırpma yine yapılır ama kaydı
  // sistem kullanıcısı olmadığı için yazılmaz; StockAdjustment satırı o hareketin izi olarak kalır.
  if (!userId) return;
  await db.pazarlamaAyirmaKaydi.create({
    data: { productId: urun.id, eskiMiktar: urun.pazarlamaAyrilan, yeniMiktar: yeni, kaynak, note, changedById: userId },
  });
}

// Ana Depo'dan düşer. Eksiye izin vermeyen kanalda (e-ticaret, pazaryeri) herhangi bir kalem yetmezse
// StokYetersizError fırlatır — çağıran transaction geri sarılır, hiçbir kalem düşülmez.
// Eşzamanlılık: `stock = stock - n` güncellemesi satırı kilitler ve dönen değer kilit altındaki güncel stoktur;
// aynı son ürünü aynı anda düşmeye çalışan ikinci transaction ilkinin sonucunu görür.
// ayrilandanDus: pazarlama sevkinde ayrılan miktar da sevk edilen kadar azalır (0'ın altına inmez).
export async function depoStokDus(
  db: Tx,
  kalemler: StokKalemi[],
  hareket: HareketBilgisi,
  opts: { olustur?: boolean; ayrilandanDus?: boolean } = {}
): Promise<void> {
  const toplam = topla(kalemler);
  const urunler = await depoUrunleri(db, [...toplam.keys()], { olustur: opts.olustur });
  const yetersiz: string[] = [];
  const kanal = hareket.kanal ?? "PAZARLAMA";

  for (const [barkod, { quantity, name }] of toplam) {
    const urun = urunler.get(barkod);
    if (!urun) {
      if (!KANAL_KURALLARI[kanal].eksiyeIzin) {
        yetersiz.push(name ?? barkod);
        continue;
      }
      throw new Error(`"${name ?? barkod}" Ana Depo'da bulunamadı.`);
    }
    const guncel = await db.product.update({
      where: { id: urun.id },
      data: { stock: { decrement: quantity } },
      select: { id: true, stock: true, pazarlamaAyrilan: true, name: true },
    });
    if (kuralIhlali(kanal, guncel.stock, guncel.pazarlamaAyrilan)) {
      yetersiz.push(guncel.name);
      continue;
    }
    await db.stockAdjustment.create({
      data: {
        productId: urun.id,
        oldStock: guncel.stock + quantity,
        newStock: guncel.stock,
        source: hareket.source,
        kanal: hareket.kanal,
        referans: hareket.referans,
        note: hareket.note ?? null,
        changedById: hareket.userId,
      },
    });
    const sevkSonrasi = opts.ayrilandanDus ? Math.max(0, guncel.pazarlamaAyrilan - quantity) : guncel.pazarlamaAyrilan;
    const kirpilmis = ayrilaniKirp(guncel.stock, sevkSonrasi);
    if (kirpilmis !== guncel.pazarlamaAyrilan) {
      await ayrilanYaz(
        db,
        guncel,
        kirpilmis,
        opts.ayrilandanDus ? "Pazarlama sevki" : "Stoğa kırpıldı",
        hareket.userId,
        hareket.referans
      );
    }
  }
  if (yetersiz.length > 0) throw new StokYetersizError(yetersiz);
}

// Ana Depo'ya ekler (iptal, iade, mal kabul, manuel giriş). Ayrılan miktara dokunmaz.
export async function depoStokEkle(
  db: Tx,
  kalemler: StokKalemi[],
  hareket: HareketBilgisi,
  opts: { olustur?: boolean } = {}
): Promise<void> {
  const toplam = topla(kalemler);
  const urunler = await depoUrunleri(db, [...toplam.keys()], { olustur: opts.olustur ?? true });
  for (const [barkod, { quantity, name }] of toplam) {
    const urun = urunler.get(barkod);
    if (!urun) throw new Error(`"${name ?? barkod}" barkodlu ürün bulunamadı.`);
    const guncel = await db.product.update({
      where: { id: urun.id },
      data: { stock: { increment: quantity } },
      select: { stock: true },
    });
    await db.stockAdjustment.create({
      data: {
        productId: urun.id,
        oldStock: guncel.stock - quantity,
        newStock: guncel.stock,
        source: hareket.source,
        kanal: hareket.kanal,
        referans: hareket.referans,
        note: hareket.note ?? null,
        changedById: hareket.userId,
      },
    });
  }
}

// Bir Ana Depo satırının stoğu başka bir yoldan (sayım, manuel düzeltme, transfer) değiştiyse ayrılanı yeniden
// stoğa kırpar. Depo dışı satırlarda (ayrılan hep 0) hiçbir şey yapmaz.
export async function ayrilaniStogaKirp(db: Tx, productIds: string[], userId: string | null, note: string | null = null) {
  if (productIds.length === 0) return;
  const urunler = await db.product.findMany({
    where: { id: { in: productIds }, pazarlamaAyrilan: { gt: 0 } },
    select: { id: true, stock: true, pazarlamaAyrilan: true },
  });
  for (const u of urunler) {
    const yeni = ayrilaniKirp(u.stock, u.pazarlamaAyrilan);
    if (yeni !== u.pazarlamaAyrilan) await ayrilanYaz(db, u, yeni, "Stoğa kırpıldı", userId, note);
  }
}

// Elle ayırma (CRM ürün listesi, pazarlama ürünleri, toplu işlem). Ayrılan stoktan büyük girilemez.
export async function ayrilanAyarla(
  db: Tx,
  productId: string,
  miktar: number,
  args: { userId: string; kaynak?: string; note?: string | null }
): Promise<{ ok: true; miktar: number } | { ok: false; error: string }> {
  if (!Number.isInteger(miktar) || miktar < 0) return { ok: false, error: "Ayrılan miktar 0 veya pozitif tam sayı olmalı." };
  const depoId = await depoStoreId(db);
  const urun = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, storeId: true, stock: true, pazarlamaAyrilan: true },
  });
  if (!urun || urun.storeId !== depoId) return { ok: false, error: "Pazarlamaya ayırma yalnız Ana Depo ürünlerinde yapılır." };
  if (miktar > Math.max(0, urun.stock)) {
    return { ok: false, error: `Ayrılan miktar stoktan (${Math.max(0, urun.stock)}) büyük olamaz.` };
  }
  await ayrilanYaz(db, urun, miktar, args.kaynak ?? "Elle", args.userId, args.note ?? null);
  return { ok: true, miktar };
}

export type DepoStokBilgisi = { stock: number; pazarlamaAyrilan: number; eticaretSatilabilir: number };

// Barkod → Ana Depo stok bilgisi (listeleme ekranları için, salt okuma). Depoda olmayan barkod haritada yer almaz
// (çağıran 0 kabul eder).
export async function depoStokHaritasi(db: Tx, barkodlar: string[]): Promise<Map<string, DepoStokBilgisi>> {
  if (barkodlar.length === 0) return new Map();
  const satirlar = await db.product.findMany({
    where: { store: { isWarehouse: true }, barcode: { in: [...new Set(barkodlar)] } },
    select: { barcode: true, stock: true, pazarlamaAyrilan: true },
  });
  return new Map(
    satirlar.map((p) => [
      p.barcode,
      { stock: p.stock, pazarlamaAyrilan: p.pazarlamaAyrilan, eticaretSatilabilir: satilabilirMiktar("ETICARET", p.stock, p.pazarlamaAyrilan) },
    ])
  );
}

// Sitede yayında olup Ana Depo'da e-ticarete satılabilir stoğu 0 olan online ürün sayısı (kenar çubuğu rozeti).
export async function yayindaStoksuzSayisi(db: Tx): Promise<number> {
  const yayinda = await db.product.findMany({
    where: { store: { isOnlineStore: true }, showOnStorefront: true, archivedAt: null },
    select: { barcode: true },
  });
  const harita = await depoStokHaritasi(db, yayinda.map((p) => p.barcode));
  return yayinda.filter((p) => (harita.get(p.barcode)?.eticaretSatilabilir ?? 0) <= 0).length;
}

// Kanal satırlarının `stock` alanını Ana Depo'nun e-ticarete satılabilir miktarıyla değiştirir (storefront listeleri,
// sepet, ürün detayı). Satırlar aynı sırayla döner; depoda olmayan barkod 0 olur.
export async function eticaretStokuUygula<T extends { barcode: string; stock: number }>(db: Tx, satirlar: T[]): Promise<T[]> {
  const harita = await depoStokHaritasi(db, satirlar.map((s) => s.barcode));
  return satirlar.map((s) => ({ ...s, stock: harita.get(s.barcode)?.eticaretSatilabilir ?? 0 }));
}
