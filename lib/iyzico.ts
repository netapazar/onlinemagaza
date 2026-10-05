// iyzico API istemcisi (2026-10) — resmi `iyzipay` paketi yerine küçük, bağımlılıksız istemci: yalnız kullandığımız
// uç noktalar (Checkout Form başlat/sorgula, iptal, kalem iadesi) ve iki imza doğrulaması.
// Bu dosya magaza-crm'de (src/lib/iyzico.ts) ve magaza-online'da (lib/iyzico.ts) BİREBİR aynıdır.
//
// Ortam değişkenleri: IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL (sandbox: https://sandbox-api.iyzipay.com).
// GÜVENLİK: anahtarlar ve iyzico yanıtlarının tamamı ASLA loglanmaz; çağıranlar yalnız durum/hata kodu/ödeme no saklar.
// Kart bilgisi bu sisteme hiç gelmez (müşteri kartını iyzico'nun ödeme sayfasına girer).
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TIMEOUT_MS = 20_000;

type Yapilandirma = { apiKey: string; secretKey: string; baseUrl: string };

function yapilandirma(): Yapilandirma | null {
  const apiKey = process.env.IYZICO_API_KEY?.trim();
  const secretKey = process.env.IYZICO_SECRET_KEY?.trim();
  const baseUrl = process.env.IYZICO_BASE_URL?.trim().replace(/\/+$/, "");
  if (!apiKey || !secretKey || !baseUrl) return null;
  return { apiKey, secretKey, baseUrl };
}

export function iyzicoYapilandirildi(): boolean {
  return yapilandirma() !== null;
}

export function iyzicoSandboxMi(): boolean {
  return /sandbox/i.test(process.env.IYZICO_BASE_URL ?? "");
}

export type IyzicoYanit = Record<string, unknown> & {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
};

// Ağ/zaman aşımı hatasında throw ETMEZ; { status: "failure", errorCode: "NETWORK" } döner.
export async function iyzicoIstek(path: string, govde: Record<string, unknown>): Promise<IyzicoYanit> {
  const y = yapilandirma();
  if (!y) return { status: "failure", errorCode: "YAPILANDIRMA", errorMessage: "iyzico yapılandırılmamış." };
  const body = JSON.stringify(govde);
  const rnd = `${Date.now()}${randomBytes(6).toString("hex")}`;
  // IYZWSv2: HMAC-SHA256(secret, rnd + uriPath + body), hex; Authorization = "IYZWSv2 " + base64("apiKey:..&randomKey:..&signature:..")
  const imza = createHmac("sha256", y.secretKey).update(rnd + path + body).digest("hex");
  const yetki = Buffer.from(`apiKey:${y.apiKey}&randomKey:${rnd}&signature:${imza}`).toString("base64");
  try {
    const res = await fetch(y.baseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `IYZWSv2 ${yetki}`, "x-iyzi-rnd": rnd },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as IyzicoYanit | null;
    if (!json) return { status: "failure", errorCode: "NETWORK", errorMessage: `iyzico yanıtı okunamadı (HTTP ${res.status}).` };
    return json;
  } catch {
    return { status: "failure", errorCode: "NETWORK", errorMessage: "iyzico'ya ulaşılamadı (ağ/zaman aşımı)." };
  }
}

// Kuruş → iyzico tutar metni ("125.50").
export function kurustanTutar(cents: number): string {
  return (cents / 100).toFixed(2);
}

// iyzico tutarı (sayı ya da "125.5") → kuruş. Kayan nokta hatası olmasın diye metin üzerinden; geçersizse null.
export function tutardanKurus(v: unknown): number | null {
  const s = typeof v === "number" ? v.toFixed(2) : typeof v === "string" ? v.trim() : "";
  const m = /^(\d+)(?:\.(\d{1,2})\d*)?$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

// Yanıt imzasında tutarlar sondaki sıfırlar atılmış biçimde kullanılır ("10.50" → "10.5", "10.00" → "10").
function imzaTutari(v: unknown): string {
  const s = typeof v === "number" ? String(v) : String(v ?? "");
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}

function esitMi(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function hmacHex(secret: string, veri: string): string {
  return createHmac("sha256", secret).update(veri).digest("hex");
}

// Checkout Form başlatma yanıtı imzası: conversationId:token
export function baslatmaYanitiImzasiDogru(y: IyzicoYanit): boolean {
  const c = yapilandirma();
  if (!c || typeof y.signature !== "string") return false;
  return esitMi(hmacHex(c.secretKey, [y.conversationId, y.token].map((v) => String(v ?? "")).join(":")), y.signature);
}

// Checkout Form sorgu yanıtı imzası: paymentStatus:paymentId:currency:basketId:conversationId:paidPrice:price:token
export function sorguYanitiImzasiDogru(y: IyzicoYanit): boolean {
  const c = yapilandirma();
  if (!c || typeof y.signature !== "string") return false;
  const parcalar = [
    String(y.paymentStatus ?? ""),
    String(y.paymentId ?? ""),
    String(y.currency ?? ""),
    String(y.basketId ?? ""),
    String(y.conversationId ?? ""),
    imzaTutari(y.paidPrice),
    imzaTutari(y.price),
    String(y.token ?? ""),
  ];
  return esitMi(hmacHex(c.secretKey, parcalar.join(":")), y.signature);
}

// Webhook (X-IYZ-SIGNATURE-V3): HMAC-SHA256(secret, secret + iyziEventType + iyziPaymentId + token + paymentConversationId + status), hex
// (Checkout Form / HPP biçimi). token yoksa doğrudan ödeme biçimi: secret + iyziEventType + paymentId + paymentConversationId + status.
export function webhookImzasiDogru(govde: Record<string, unknown>, imza: string | null): boolean {
  const c = yapilandirma();
  if (!c || !imza) return false;
  const s = (k: string) => (govde[k] === undefined || govde[k] === null ? "" : String(govde[k]));
  const veri = govde.token
    ? c.secretKey + s("iyziEventType") + s("iyziPaymentId") + s("token") + s("paymentConversationId") + s("status")
    : c.secretKey + s("iyziEventType") + s("paymentId") + s("paymentConversationId") + s("status");
  return esitMi(hmacHex(c.secretKey, veri), imza.trim().toLowerCase());
}

export const IYZICO_YOLLARI = {
  cfBaslat: "/payment/iyzipos/checkoutform/initialize/auth/ecom",
  cfSorgula: "/payment/iyzipos/checkoutform/auth/ecom/detail",
  iptal: "/payment/cancel",
  iade: "/payment/refund",
} as const;
