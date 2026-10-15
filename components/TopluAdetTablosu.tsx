"use client";

import { useMemo, useState } from "react";
import { CartIcon, SearchIcon } from "@/components/icons";
import SectionHeading from "@/components/SectionHeading";
import StoreImage from "@/components/StoreImage";
import { useCart } from "@/components/CartProvider";
import { centsToTl } from "@/lib/pricing";
import { birimEtiketi, type SatisBirimi } from "@/lib/satisBirimleri";

export type TopluSatir = {
  id: string;
  e1: string;
  e2: string | null;
  renkHex: string | null;
  kapak: string | null;
  ad: string;
  secim: string; // "Renk: Kırmızı · Ebat: A4"
  displayCents: number; // adet fiyatı (üye indirimi uygulanmış)
  satisBirimleri: SatisBirimi[] | null;
  stock: number;
  satilabilir: boolean;
};

type Giris = { metin: string; birim: string | null };

// Bu sayıdan çok satırda tablonun üstünde seçenek arama kutusu çıkar (ör. 191 renk/ebatlı matara grubu).
const ARAMA_ESIGI = 12;

// Toplu adet tablosu (varyant, 2026-10): grubun görünür tüm üyeleri satır satır; adet girilen satırların hepsi tek
// "Sepete Ekle" ile sepete gider (CartProvider.addItems — tek güncelleme, tek bildirim). Kurallar ürün sayfasındaki sepete
// ekleme ile aynı: paketli satışta adet, seçilen birimden KAÇ TANE (stok ≥ birim sayısı × içerik); stoksuz satır pasif.
// Eksen2 varsa satırlar eksen1'e göre gruplanır. ~100+ satırda da kullanılsın diye liste kendi içinde kayar (başlıklar yapışkan).
export default function TopluAdetTablosu({
  eksen1Ad,
  eksen2Ad,
  markaAdi,
  satirlar,
}: {
  eksen1Ad: string;
  eksen2Ad: string | null;
  markaAdi: string | null;
  satirlar: TopluSatir[];
}) {
  const { addItems } = useCart();
  const [girisler, setGirisler] = useState<Record<string, Giris>>({});
  const [uyari, setUyari] = useState<Record<string, string>>({});
  const [arama, setArama] = useState("");
  const [eklendi, setEklendi] = useState(false);

  const birimOf = (s: TopluSatir, g?: Giris): SatisBirimi | null => {
    const list = s.satisBirimleri;
    if (!list) return null;
    return list.find((b) => b.birim === g?.birim) ?? list.find((b) => b.adet <= s.stock) ?? list[0];
  };
  const enCok = (s: TopluSatir, b: SatisBirimi | null) => Math.floor(s.stock / (b?.adet ?? 1));
  const sayi = (g?: Giris) => {
    const n = Math.floor(Number(g?.metin ?? ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  function guncelle(s: TopluSatir, degisim: Partial<Giris>) {
    setGirisler((prev) => ({ ...prev, [s.id]: { metin: prev[s.id]?.metin ?? "", birim: prev[s.id]?.birim ?? null, ...degisim } }));
    setUyari((prev) => {
      if (!prev[s.id]) return prev;
      const next = { ...prev };
      delete next[s.id];
      return next;
    });
  }

  // Alan bırakılınca değer 0..stok aralığına çekilir (QuantityStepper'daki uyarı mantığıyla aynı).
  function duzelt(s: TopluSatir) {
    const g = girisler[s.id];
    if (!g || g.metin.trim() === "") return;
    const b = birimOf(s, g);
    const max = enCok(s, b);
    const n = Math.floor(Number(g.metin));
    let yeni = Number.isFinite(n) ? Math.max(0, n) : 0;
    let mesaj: string | null = Number.isFinite(n) ? null : "Geçerli bir sayı girin.";
    if (yeni > max) {
      yeni = max;
      mesaj = b && b.adet > 1 ? `Stokta en çok ${max} ${birimEtiketi(b.birim, b.adet)} var.` : `Stokta sadece ${max} adet var.`;
    }
    setGirisler((prev) => ({ ...prev, [s.id]: { ...g, metin: yeni > 0 ? String(yeni) : "" } }));
    if (mesaj) setUyari((prev) => ({ ...prev, [s.id]: mesaj }));
  }

  const secilenler = satirlar.flatMap((s) => {
    if (!s.satilabilir) return [];
    const g = girisler[s.id];
    const b = birimOf(s, g);
    const n = Math.min(sayi(g), enCok(s, b));
    return n > 0 ? [{ s, b, n, adet: n * (b?.adet ?? 1) }] : [];
  });
  const toplamAdet = secilenler.reduce((t, x) => t + x.adet, 0);
  const toplamCents = secilenler.reduce((t, x) => t + x.adet * x.s.displayCents, 0);

  function sepeteEkle() {
    if (secilenler.length === 0) return;
    addItems(
      secilenler.map(({ s, b, n }) => ({
        productId: s.id,
        quantity: n,
        productName: s.ad,
        birim: b?.birim ?? null,
        analitik: { adetFiyatiCents: s.displayCents, marka: markaAdi, icerik: b?.adet ?? 1 },
      }))
    );
    setGirisler({});
    setUyari({});
    setEklendi(true);
    setTimeout(() => setEklendi(false), 1200);
  }

  const aranan = arama.trim().toLocaleLowerCase("tr-TR");
  const gorunen = useMemo(
    () =>
      aranan
        ? satirlar.filter((s) => `${s.e1} ${s.e2 ?? ""}`.toLocaleLowerCase("tr-TR").includes(aranan))
        : satirlar,
    [satirlar, aranan]
  );
  // Eksen2 varsa eksen1'e göre gruplu (ilk görülme sırası korunur).
  const bloklar = useMemo(() => {
    if (!eksen2Ad) return [{ baslik: null as TopluSatir | null, satirlar: gorunen }];
    const out: { baslik: TopluSatir | null; satirlar: TopluSatir[] }[] = [];
    for (const s of gorunen) {
      const son = out[out.length - 1];
      if (son && son.baslik?.e1 === s.e1) son.satirlar.push(s);
      else {
        const mevcut = out.find((b) => b.baslik?.e1 === s.e1);
        if (mevcut) mevcut.satirlar.push(s);
        else out.push({ baslik: s, satirlar: [s] });
      }
    }
    return out;
  }, [gorunen, eksen2Ad]);

  const ornek = (s: TopluSatir, boyut: "sm" | "md") => {
    const cls = boyut === "sm" ? "h-6 w-6" : "h-8 w-8";
    if (s.renkHex)
      return <span className={`${cls} shrink-0 rounded-full ring-1 ring-black/15`} style={{ backgroundColor: s.renkHex }} aria-hidden="true" />;
    if (s.kapak)
      return (
        <span className={`relative ${cls} shrink-0 overflow-hidden rounded bg-neutral-100`}>
          <StoreImage src={s.kapak} alt="" sizes="96px" className="object-cover" />
        </span>
      );
    return null;
  };

  return (
    <section id="toplu-adet" className="mt-5 scroll-mt-24 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <SectionHeading title="Toplu Adet Tablosu" />
        <p className="mt-1 text-sm text-neutral-500">
          Her {eksen1Ad.toLocaleLowerCase("tr-TR")}
          {eksen2Ad ? ` ve ${eksen2Ad.toLocaleLowerCase("tr-TR")}` : ""} için adet yazın; hepsi tek seferde sepete eklenir.
        </p>
      </div>

      {satirlar.length > ARAMA_ESIGI && (
        <label className="relative mb-3 block">
          <span className="sr-only">Seçenek ara</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
          <input
            type="search"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder={`${eksen1Ad}${eksen2Ad ? ` ya da ${eksen2Ad.toLocaleLowerCase("tr-TR")}` : ""} ara`}
            className="h-10 w-full rounded-lg border border-neutral-300 pr-3 pl-9 text-sm focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:outline-none"
          />
        </label>
      )}

      <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-neutral-200">
        <div className="sticky top-0 z-20 hidden grid-cols-[1fr_8rem_6rem_9rem] gap-3 border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-600 sm:grid">
          <span>{eksen2Ad ? `${eksen1Ad} / ${eksen2Ad}` : eksen1Ad}</span>
          <span className="text-right">Fiyat</span>
          <span>Stok</span>
          <span className="text-right">Adet</span>
        </div>
        {gorunen.length === 0 && <p className="px-3 py-4 text-sm text-neutral-500">Aramayla eşleşen seçenek yok.</p>}
        {bloklar.map((blok, bi) => (
          <div key={blok.baslik?.e1 ?? bi}>
            {blok.baslik && (
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-neutral-900 sm:top-[33px]">
                {ornek(blok.baslik, "sm")}
                {blok.baslik.e1}
              </div>
            )}
            <ul className="divide-y divide-neutral-100">
              {blok.satirlar.map((s) => {
                const g = girisler[s.id];
                const b = birimOf(s, g);
                const etiket = eksen2Ad ? (s.e2 ?? "—") : s.e1;
                return (
                  <li
                    key={s.id}
                    className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-3 py-2 sm:grid-cols-[1fr_8rem_6rem_9rem] ${
                      s.satilabilir ? "" : "bg-neutral-50/60"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {!eksen2Ad && ornek(s, "md")}
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${s.satilabilir ? "text-neutral-900" : "text-neutral-500"}`}>{etiket}</p>
                        {/* Dar ekranda fiyat ve stok seçeneğin altında. */}
                        <p className="text-xs text-neutral-500 sm:hidden">
                          {centsToTl(s.displayCents)} ₺{s.satisBirimleri ? " / adet" : ""} ·{" "}
                          {s.satilabilir ? <span className="text-emerald-700">Stokta</span> : <span className="text-red-600">Stokta yok</span>}
                        </p>
                      </div>
                    </div>
                    <span className="hidden text-right text-sm font-semibold text-[var(--color-brand)] tabular-nums sm:block">
                      {centsToTl(s.displayCents)} ₺
                      {s.satisBirimleri && <span className="ml-0.5 text-[11px] font-normal text-neutral-500">/ adet</span>}
                    </span>
                    <span className={`hidden text-xs sm:block ${s.satilabilir ? "text-emerald-700" : "font-medium text-red-600"}`}>
                      {s.satilabilir ? "Stokta" : "Stokta yok"}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      {s.satilabilir ? (
                        <div className="flex items-center gap-1.5">
                          {s.satisBirimleri && s.satisBirimleri.length > 1 ? (
                            <select
                              aria-label={`${etiket} satış birimi`}
                              value={b?.birim ?? ""}
                              onChange={(e) => guncelle(s, { birim: e.target.value, metin: "" })}
                              className="h-10 max-w-[7.5rem] rounded-lg border border-neutral-300 bg-white px-1.5 text-xs focus:border-[var(--color-brand)] focus:outline-none"
                            >
                              {s.satisBirimleri.map((x) => (
                                <option key={x.birim} value={x.birim} disabled={x.adet > s.stock}>
                                  {birimEtiketi(x.birim, x.adet)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            b && b.adet > 1 && <span className="text-xs text-neutral-500">{birimEtiketi(b.birim, b.adet)}</span>
                          )}
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={enCok(s, b)}
                            placeholder="0"
                            value={g?.metin ?? ""}
                            onChange={(e) => guncelle(s, { metin: e.target.value })}
                            onBlur={() => duzelt(s)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                            }}
                            aria-label={`${s.secim} adedi`}
                            className="h-10 w-16 rounded-lg border border-neutral-300 px-2 text-center text-sm tabular-nums focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500 sm:hidden">—</span>
                      )}
                      {uyari[s.id] && <p className="text-right text-[11px] font-medium text-red-600">{uyari[s.id]}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-600" aria-live="polite">
          {secilenler.length > 0 ? (
            <>
              {secilenler.length} seçenek · <strong>{toplamAdet} adet</strong> · {centsToTl(toplamCents)} ₺
            </>
          ) : (
            "Henüz adet girilmedi."
          )}
        </p>
        <button
          type="button"
          onClick={sepeteEkle}
          disabled={secilenler.length === 0}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 px-5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] sm:w-auto ${
            eklendi
              ? "border-emerald-600 bg-emerald-600 text-white"
              : secilenler.length === 0
                ? "cursor-not-allowed border-neutral-200 bg-neutral-200 text-neutral-400"
                : "border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          }`}
        >
          <CartIcon className="h-4 w-4" aria-hidden="true" />
          {eklendi ? "✓ Eklendi" : "Sepete Ekle"}
        </button>
      </div>
    </section>
  );
}
