// Google Analytics 4 (2026-10-13) — YALNIZ ziyaretçi çerez bandında "Kabul Et" dediyse çalışır. Onay yoksa gtag.js hiç
// yüklenmez, dataLayer oluşturulmaz, hiçbir olay gönderilmez. Onay bu tarayıcıda localStorage'da tutulur (sunucuya
// gitmez); "Çerez tercihleri" bağlantısıyla değiştirilebilir. Reddedilince GA devre dışı bırakılır ve _ga çerezleri silinir.

export const GA_OLCUM_KIMLIGI = "G-F1XQ8F4987";
const ONAY_ANAHTARI = "tedarikhane_cerez_onayi";
export const ONAY_DEGISTI_OLAYI = "tedarikhane:cerez-onayi";
export const BANDI_AC_OLAYI = "tedarikhane:cerez-bandi-ac";

export type OnayDurumu = "kabul" | "red" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __gaHazir?: boolean;
  }
}

export function onayDurumu(): OnayDurumu {
  try {
    const v = JSON.parse(localStorage.getItem(ONAY_ANAHTARI) ?? "null");
    return v?.analitik === true ? "kabul" : v?.analitik === false ? "red" : null;
  } catch {
    return null;
  }
}

export function onayKaydet(kabul: boolean) {
  try {
    localStorage.setItem(ONAY_ANAHTARI, JSON.stringify({ analitik: kabul, tarih: new Date().toISOString() }));
  } catch {
    // depolama kapalıysa karar yalnız bu sayfa için geçerli olur
  }
  if (!kabul) gaKapat();
  window.dispatchEvent(new CustomEvent(ONAY_DEGISTI_OLAYI, { detail: kabul ? "kabul" : "red" }));
}

// dataLayer ve gtag kuyruğu — gtag.js yüklenince kuyruktaki komutları sırayla işler. Yalnız onay varken çağrılır;
// "config" her zaman ilk olaydan önce kuyruğa girer.
export function gaHazirla() {
  if (typeof window === "undefined" || window.__gaHazir || onayDurumu() !== "kabul") return;
  window[`ga-disable-${GA_OLCUM_KIMLIGI}` as never] = false as never;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js "arguments" nesnesini bekler
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_OLCUM_KIMLIGI);
  window.__gaHazir = true;
}

function gaKapat() {
  window[`ga-disable-${GA_OLCUM_KIMLIGI}` as never] = true as never;
  window.__gaHazir = false;
  // _ga, _ga_XXXX çerezleri hem alan adına hem üst alana (.tedarikhane.com) yazılmış olabilir.
  const alanlar = ["", location.hostname, `.${location.hostname.replace(/^www\./, "")}`];
  for (const c of document.cookie.split(";")) {
    const ad = c.split("=")[0].trim();
    if (!ad.startsWith("_ga")) continue;
    for (const alan of alanlar) {
      document.cookie = `${ad}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${alan ? `; domain=${alan}` : ""}`;
    }
  }
}

function olay(ad: string, parametreler: Record<string, unknown>) {
  if (typeof window === "undefined" || onayDurumu() !== "kabul") return;
  gaHazirla();
  window.gtag?.("event", ad, parametreler);
}

const tl = (kurus: number) => Math.round(kurus) / 100;

export type AnalitikUrun = { id: string; ad: string; marka?: string | null; adetFiyatiCents: number; adet: number };

const urunParametresi = (u: AnalitikUrun) => ({
  item_id: u.id,
  item_name: u.ad,
  ...(u.marka ? { item_brand: u.marka } : {}),
  price: tl(u.adetFiyatiCents),
  quantity: u.adet,
});

// GA4 önerilen e-ticaret olayı. adet = toplam adet (paketli satışta birim sayısı × içerik), fiyat = adet fiyatı (KDV dahil).
export function sepeteEklendi(u: AnalitikUrun) {
  olay("add_to_cart", { currency: "TRY", value: tl(u.adetFiyatiCents * u.adet), items: [urunParametresi(u)] });
}

// Sipariş alındı sayfasında bir kez (aynı sipariş için ikinci kez gönderilmez).
export function satinAlindi(siparis: { id: string; toplamCents: number; kargoCents: number; odeme: string; urunler: AnalitikUrun[] }) {
  if (typeof window === "undefined" || onayDurumu() !== "kabul") return;
  const anahtar = `ga_siparis_${siparis.id}`;
  try {
    if (localStorage.getItem(anahtar)) return;
    localStorage.setItem(anahtar, "1");
  } catch {
    // depolama kapalıysa yenilemede tekrar gönderilebilir; GA4 aynı transaction_id'yi tekilleştirir
  }
  olay("purchase", {
    transaction_id: siparis.id,
    currency: "TRY",
    value: tl(siparis.toplamCents),
    shipping: tl(siparis.kargoCents),
    payment_type: siparis.odeme,
    items: siparis.urunler.map(urunParametresi),
  });
}
