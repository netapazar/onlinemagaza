// Paketli satış (2026-10-05): ürün "paketli satış" modundaysa fiyat ADET fiyatıdır, müşteri yalnız CRM'de açılmış
// birimlerden (Adet/Düzine/Paket/Kutu/Koli) birini seçip o birimin katları kadar alabilir. Siparişe, irsaliyeye,
// faturaya ve stoğa ADET olarak geçer (adet = birim sayısı × birim içeriği).
// Bu dosya magaza-crm'de (src/lib/satisBirimleri.ts) ve magaza-online'da (lib/satisBirimleri.ts) BİREBİR aynıdır.

export const SATIS_BIRIMLERI = ["ADET", "DUZINE", "PAKET", "KUTU", "KOLI"] as const;
export type SatisBirimiKodu = (typeof SATIS_BIRIMLERI)[number];

export const SATIS_BIRIMI_ETIKET: Record<SatisBirimiKodu, string> = {
  ADET: "Adet",
  DUZINE: "Düzine",
  PAKET: "Paket",
  KUTU: "Kutu",
  KOLI: "Koli",
};

// İçeriği değişmeyen birimler; diğerlerinin içeriği ürün bazında girilir.
export const SABIT_ICERIK: Partial<Record<SatisBirimiKodu, number>> = { ADET: 1, DUZINE: 12 };
export const MIN_BIRIM_ICERIGI = 2;
export const MAX_BIRIM_ICERIGI = 100_000;

export type SatisBirimi = { birim: SatisBirimiKodu; adet: number };

function isKod(v: unknown): v is SatisBirimiKodu {
  return typeof v === "string" && (SATIS_BIRIMLERI as readonly string[]).includes(v);
}

function gecerliIcerik(birim: SatisBirimiKodu, adet: unknown): number | null {
  const sabit = SABIT_ICERIK[birim];
  if (sabit !== undefined) return sabit;
  const n = Number(adet);
  if (!Number.isInteger(n) || n < MIN_BIRIM_ICERIGI || n > MAX_BIRIM_ICERIGI) return null;
  return n;
}

// Veritabanındaki JSON'u (Product.satisBirimleri) güvenle okur: geçersiz/tekrarlı kayıtlar atlanır, içeriğe göre artan sıralı.
export function parseSatisBirimleri(raw: unknown): SatisBirimi[] {
  if (!Array.isArray(raw)) return [];
  const out: SatisBirimi[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const birim = (r as { birim?: unknown }).birim;
    if (!isKod(birim) || out.some((o) => o.birim === birim)) continue;
    const adet = gecerliIcerik(birim, (r as { adet?: unknown }).adet);
    if (adet === null) continue;
    out.push({ birim, adet });
  }
  return out.sort((a, b) => a.adet - b.adet || SATIS_BIRIMLERI.indexOf(a.birim) - SATIS_BIRIMLERI.indexOf(b.birim));
}

// Ürün paketli satış modundaysa açık birimleri döner; normal (adet adet) satıştaysa null.
export function urunSatisBirimleri(p: { paketliSatis: boolean; satisBirimleri: unknown }): SatisBirimi[] | null {
  if (!p.paketliSatis) return null;
  const list = parseSatisBirimleri(p.satisBirimleri);
  return list.length > 0 ? list : null;
}

// Sepet satırının birimini çözer. Normal üründe birim yok (null) — eski sepetler de böyle. Paketli üründe birim
// açık birimlerden biri olmalı; değilse null döner (satır geçersiz).
export function birimCoz(
  p: { paketliSatis: boolean; satisBirimleri: unknown },
  birim: string | null | undefined
): { birim: SatisBirimiKodu | null; icerik: number } | null {
  const list = urunSatisBirimleri(p);
  if (!list) return !birim || birim === "ADET" ? { birim: null, icerik: 1 } : null;
  const found = list.find((b) => b.birim === birim);
  return found ? { birim: found.birim, icerik: found.adet } : null;
}

// "Kutu (50 adet)" — Adet için yalnız "Adet".
export function birimEtiketi(birim: string, icerik: number): string {
  const ad = isKod(birim) ? SATIS_BIRIMI_ETIKET[birim] : birim;
  return icerik === 1 ? ad : `${ad} (${icerik} adet)`;
}

// "2 Kutu (100 adet)" — sipariş satırı gösterimi. birim null ise "100 adet".
export function miktarMetni(birim: string | null, icerik: number | null, toplamAdet: number): string {
  if (!birim || !icerik || icerik === 1) return `${toplamAdet} adet`;
  const ad = isKod(birim) ? SATIS_BIRIMI_ETIKET[birim] : birim;
  return `${Math.round(toplamAdet / icerik)} ${ad} (${toplamAdet} adet)`;
}

export type SatisBirimiGirdisi = { birim: string; acik: boolean; adet?: string | number | null };

// CRM ürün formu doğrulaması: en az bir birim açık olmalı; Paket/Kutu/Koli içeriği 2-100.000 arası tam sayı.
export function validateSatisBirimleri(
  girdiler: SatisBirimiGirdisi[]
): { ok: true; value: SatisBirimi[] } | { ok: false; error: string } {
  const value: SatisBirimi[] = [];
  for (const g of girdiler) {
    if (!g.acik || !isKod(g.birim)) continue;
    const adet = gecerliIcerik(g.birim, g.adet);
    if (adet === null) {
      return {
        ok: false,
        error: `${SATIS_BIRIMI_ETIKET[g.birim]} içeriği ${MIN_BIRIM_ICERIGI}-${MAX_BIRIM_ICERIGI.toLocaleString("tr-TR")} arası tam sayı olmalı.`,
      };
    }
    value.push({ birim: g.birim, adet });
  }
  if (value.length === 0) return { ok: false, error: "Paketli satış açıkken en az bir satış birimi seçilmeli." };
  return { ok: true, value: parseSatisBirimleri(value) };
}
