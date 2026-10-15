"use client";

import { useMemo, useState, type ReactNode } from "react";
import { TruckIcon, ClockIcon } from "@/components/icons";
import { centsToTl } from "@/lib/pricing";
import { birimEtiketi, type SatisBirimi } from "@/lib/satisBirimleri";
import { grupYolu, secimSorgusu, tekilDegerler } from "@/lib/urunGrubuCore";
import ProductGallery from "@/components/ProductGallery";
import CorporatePriceHint from "@/components/MemberHint";
import AddToCartButton from "@/components/AddToCartButton";
import ProductTabs from "@/components/ProductTabs";
import StoreImage from "@/components/StoreImage";

// Üye başına istemciye giden alanlar (seçimle değişenler). Fiyatlar sunucuda resolvePrice ile hesaplanmış hâliyle gelir
// (üye indirimi dahil) — burada yeniden hesaplanmaz.
export type GrupUyeVerisi = {
  id: string;
  e1: string;
  e2: string | null;
  renkHex: string | null;
  kapak: string | null;
  ad: string;
  productCode: string | null;
  barkod: string | null;
  listCents: number;
  displayCents: number;
  discounted: boolean;
  discountPercent: number | null;
  satisBirimleri: SatisBirimi[] | null;
  satisBirimiMetni: string;
  packageInfo: string | null;
  stock: number;
  satilabilir: boolean;
  kisaAciklama: string | null;
  aciklama: string | null;
  specs: { label: string; value: string }[];
  images: { id: string; url: string; altText: string | null }[];
};

type GrupBilgisi = {
  slug: string;
  ad: string;
  eksen1Ad: string;
  eksen2Ad: string | null;
  markaAdi: string | null;
  kisaAciklama: string | null;
  aciklama: string | null;
  gorseller: { id: string; url: string; altText: string | null }[];
};

// Seçici görünümü: tüm eksen1 değerlerinde renkHex varsa renk dairesi, yoksa tümünde kapak görseli varsa küçük resim,
// ikisi de değilse metin düğmesi. Karışık görünüm (bir kısmı daire, bir kısmı yazı) hizayı bozuyordu; grup bazında tek tip.
type Gorunum = "renk" | "gorsel" | "metin";

export default function UrunGrubuSecici({
  grup,
  uyeler,
  ilkIndeks,
  kargoSaatiOncesi,
  uyelikKutusu,
}: {
  grup: GrupBilgisi;
  uyeler: GrupUyeVerisi[];
  ilkIndeks: number;
  kargoSaatiOncesi: boolean;
  uyelikKutusu: ReactNode;
}) {
  const [indeks, setIndeks] = useState(ilkIndeks);
  const u = uyeler[indeks];
  const eksenler = { eksen1Ad: grup.eksen1Ad, eksen2Ad: grup.eksen2Ad };

  const degerler1 = useMemo(() => tekilDegerler(uyeler.map((x) => ({ eksen1Deger: x.e1, eksen2Deger: x.e2 })), 1), [uyeler]);
  const degerler2 = useMemo(
    () => (grup.eksen2Ad ? tekilDegerler(uyeler.map((x) => ({ eksen1Deger: x.e1, eksen2Deger: x.e2 })), 2) : []),
    [uyeler, grup.eksen2Ad]
  );
  const secenek1 = useMemo(
    () =>
      degerler1.map((d) => {
        const ayni = uyeler.filter((x) => x.e1 === d);
        return {
          deger: d,
          aktif: ayni.some((x) => x.satilabilir),
          renkHex: ayni.find((x) => x.renkHex)?.renkHex ?? null,
          kapak: ayni.find((x) => x.kapak)?.kapak ?? null,
        };
      }),
    [degerler1, uyeler]
  );
  const gorunum: Gorunum = secenek1.every((s) => s.renkHex) ? "renk" : secenek1.every((s) => s.kapak) ? "gorsel" : "metin";

  function sec(yeni: number) {
    if (yeni < 0 || yeni === indeks) return;
    setIndeks(yeni);
    const x = uyeler[yeni];
    // Adres seçimi taşır (paylaşılabilir/yenilenebilir); geçmişe yeni kayıt eklenmez. Canonical yine parametresiz adres.
    try {
      window.history.replaceState(null, "", grupYolu(grup.slug, secimSorgusu(eksenler, { eksen1Deger: x.e1, eksen2Deger: x.e2 })));
    } catch {
      // history erişilemezse seçim yalnız ekranda değişir
    }
  }

  // Eksen1 değeri seçilince: aynı eksen2 değeri stokta varsa o, yoksa o eksen1 değerinin ilk stoklu üyesi.
  function eksen1Sec(d: string) {
    const ayni = uyeler.map((x, i) => ({ x, i })).filter(({ x }) => x.e1 === d && x.satilabilir);
    const tam = ayni.find(({ x }) => x.e2 === u.e2);
    sec((tam ?? ayni[0])?.i ?? -1);
  }
  const eksen2Uyesi = (d: string) => uyeler.findIndex((x) => x.e1 === u.e1 && x.e2 === d);

  // Seçili üyenin görselleri önce, ardından grubun ortak görselleri (aynı adres tekrar edilmez).
  const gorseller = useMemo(() => {
    const gorulen = new Set(u.images.map((g) => g.url));
    return [...u.images, ...grup.gorseller.filter((g) => !gorulen.has(g.url))];
  }, [u.images, grup.gorseller]);

  const meta = [
    u.productCode ? { label: "Ürün kodu", value: u.productCode } : null,
    u.barkod ? { label: "Barkod", value: u.barkod } : null,
    { label: "Satış birimi", value: u.satisBirimiMetni },
    u.packageInfo ? { label: "Paket içeriği", value: u.packageInfo } : null,
  ].filter((m): m is { label: string; value: string } => m !== null);
  const kisaAciklama = u.kisaAciklama ?? grup.kisaAciklama;
  const birimler = u.satisBirimleri;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      {/* ProductDetail ile aynı ızgara: geniş ekranda sekmeler görselin altında, satın alma alanı sağda iki satır boyu. */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-rows-[auto_1fr]">
        <ProductGallery key={u.id} images={gorseller} name={`${grup.ad} ${u.e1}`} brandName={grup.markaAdi} />

        <div className="min-w-0 lg:row-span-2">
          {grup.markaAdi && <p className="mb-1 text-sm text-neutral-500">{grup.markaAdi}</p>}
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">{grup.ad}</h1>
          {kisaAciklama && <p className="mb-2 text-sm text-neutral-600">{kisaAciklama}</p>}
          <p className="mb-3 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-500">
            {meta.map((m) => (
              <span key={m.label}>
                {m.label}: <span className="font-medium text-neutral-700">{m.value}</span>
              </span>
            ))}
          </p>

          {/* Seçiciler: stoksuz seçenek görünür ama pasif (seçilemez). */}
          <div className="mb-4 space-y-3">
            <div>
              <p className="mb-1.5 text-sm text-neutral-600">
                {grup.eksen1Ad}: <span className="font-semibold text-neutral-900">{u.e1}</span>
              </p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={grup.eksen1Ad}>
                {secenek1.map((s) => {
                  const secili = s.deger === u.e1;
                  const ortak = {
                    type: "button" as const,
                    role: "radio",
                    "aria-checked": secili,
                    "aria-label": s.aktif ? s.deger : `${s.deger} (stokta yok)`,
                    title: s.aktif ? s.deger : `${s.deger} — stokta yok`,
                    disabled: !s.aktif,
                    onClick: () => eksen1Sec(s.deger),
                  };
                  if (gorunum === "renk") {
                    return (
                      <button
                        key={s.deger}
                        {...ortak}
                        className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                          secili ? "border-[var(--color-brand)]" : "border-transparent hover:border-neutral-300"
                        } ${s.aktif ? "" : "cursor-not-allowed"}`}
                      >
                        <span
                          className={`block h-7 w-7 rounded-full ring-1 ring-black/15 ${s.aktif ? "" : "opacity-40"}`}
                          style={{ backgroundColor: s.renkHex ?? undefined }}
                        />
                        {!s.aktif && <span className="absolute h-0.5 w-8 rotate-45 rounded bg-neutral-500" aria-hidden="true" />}
                      </button>
                    );
                  }
                  if (gorunum === "gorsel") {
                    return (
                      <button
                        key={s.deger}
                        {...ortak}
                        className={`relative h-12 w-12 overflow-hidden rounded-lg border-2 bg-neutral-100 ${
                          secili ? "border-[var(--color-brand)]" : "border-neutral-200 hover:border-neutral-300"
                        } ${s.aktif ? "" : "cursor-not-allowed opacity-40"}`}
                      >
                        <StoreImage src={s.kapak!} alt="" sizes="96px" className="object-cover" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={s.deger}
                      {...ortak}
                      className={`min-h-10 rounded-lg border px-3 text-sm transition-colors ${
                        secili
                          ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] font-semibold text-[var(--color-brand)]"
                          : s.aktif
                            ? "border-neutral-300 text-neutral-800 hover:border-[var(--color-brand)]"
                            : "cursor-not-allowed border-neutral-200 text-neutral-400 line-through"
                      }`}
                    >
                      {s.deger}
                    </button>
                  );
                })}
              </div>
            </div>

            {grup.eksen2Ad && degerler2.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm text-neutral-600">
                  {grup.eksen2Ad}: <span className="font-semibold text-neutral-900">{u.e2 ?? "—"}</span>
                </p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={grup.eksen2Ad}>
                  {degerler2.map((d) => {
                    const i = eksen2Uyesi(d);
                    const aktif = i >= 0 && uyeler[i].satilabilir;
                    const secili = d === u.e2;
                    return (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={secili}
                        aria-label={aktif ? d : `${d} (${i < 0 ? "bu seçenek yok" : "stokta yok"})`}
                        title={aktif ? d : i < 0 ? `${u.e1} için ${d} yok` : `${d} — stokta yok`}
                        disabled={!aktif}
                        onClick={() => sec(i)}
                        className={`min-h-10 rounded-lg border px-3 text-sm transition-colors ${
                          secili
                            ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] font-semibold text-[var(--color-brand)]"
                            : aktif
                              ? "border-neutral-300 text-neutral-800 hover:border-[var(--color-brand)]"
                              : "cursor-not-allowed border-neutral-200 text-neutral-400 line-through"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
            {u.discounted && <span className="text-sm text-neutral-400 line-through">{centsToTl(u.listCents)} ₺</span>}
            <span className="text-2xl font-semibold text-neutral-900">
              {centsToTl(u.displayCents)} ₺
              {birimler && <span className="ml-1 text-sm font-normal text-neutral-500">/ adet</span>}
            </span>
            {u.discounted && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {`Üye fiyatı · %${u.discountPercent}`}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400">KDV Dahil</p>
          {birimler && (
            <p className="mt-1 text-xs text-neutral-600">
              En az {birimler[0].adet} adet ({birimEtiketi(birimler[0].birim, birimler[0].adet)}) satılır.
            </p>
          )}
          <CorporatePriceHint className="mt-1" />

          {u.satilabilir ? (
            <p className="mt-3 mb-4 text-sm text-emerald-700">Stokta var</p>
          ) : (
            <p className="mt-3 mb-4 text-sm font-medium text-red-600">Stokta yok</p>
          )}

          <div className="mb-3">
            {/* key: seçim değişince adet/birim seçimi sıfırlansın (önceki rengin adedi yenisine taşınmasın). */}
            <AddToCartButton
              key={u.id}
              productId={u.id}
              stock={u.stock}
              name={`${grup.ad} - ${[u.e1, u.e2].filter(Boolean).join(" ")}`}
              satisBirimleri={birimler}
              adetFiyatiCents={u.displayCents}
              marka={grup.markaAdi}
            />
          </div>
          {uyeler.length > 1 && (
            <p className="mb-5 text-sm">
              <a href="#toplu-adet" className="font-medium text-[var(--color-brand)] hover:underline">
                Birden çok {grup.eksen1Ad.toLocaleLowerCase("tr-TR")} mi alacaksınız? Toplu adet tablosu
              </a>
            </p>
          )}

          <div className="mb-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex items-center gap-2 text-neutral-700">
              <TruckIcon className="h-4 w-4 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
              Tüm siparişlerde ücretsiz kargo
            </div>
            {u.satilabilir && kargoSaatiOncesi && (
              <div className="flex items-center gap-2 text-neutral-700">
                <ClockIcon className="h-4 w-4 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
                Bugün 13:30&apos;a kadar verilen siparişler bugün kargoya çıkar
              </div>
            )}
          </div>

          {uyelikKutusu}
        </div>

        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <ProductTabs description={u.aciklama ?? grup.aciklama} specs={u.specs} className="mt-2 lg:mt-0" />
        </div>
      </div>
    </div>
  );
}
