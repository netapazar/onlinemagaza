import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Veritabanı tabanlı hız sınırı (2026-09-21). Vercel'de her istek farklı bir örnekte çalışabildiği için süreç
// belleği sayaçları paylaşılmaz; bu yüzden her deneme RateLimitEvent tablosuna bir satır yazılır ve "son N dakikada
// bu anahtardan kaç olay" sayılır. Ek altyapı/ücret yok (Redis/KV gerekmez).
//
// Sınırlar tek yerde (aşağıdaki RULES) — ayarlamak için yalnız burası değişir. Ofis/okul gibi tek IP'nin arkasında
// çok kullanıcı olabileceği için (B2B müşteri) sayılar kasıtlı olarak cömert tutuldu: amaç insan kullanımını
// kısıtlamak değil, otomatik toplu denemeyi (sahte kayıt, sipariş yağmuru, şifre tahmini) yavaşlatmak.
export const RATE_LIMIT_MESSAGE = "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.";

export const RULES = {
  REGISTER_IP: { action: "register-ip", max: 10, windowMinutes: 60 },
  LOGIN_IP: { action: "login-ip", max: 30, windowMinutes: 15 },
  ORDER_IP: { action: "order-ip", max: 20, windowMinutes: 60 },
  RESET_REQUEST_IP: { action: "reset-request-ip", max: 15, windowMinutes: 60 },
  RESET_REQUEST_EMAIL: { action: "reset-request-email", max: 3, windowMinutes: 60 },
  RESET_CONFIRM_IP: { action: "reset-confirm-ip", max: 20, windowMinutes: 60 },
} as const;

export type RateLimitRule = { action: string; max: number; windowMinutes: number };

// Vercel `x-forwarded-for`'u kendisi yazar (istemcinin gönderdiği değerin üzerine), ilk değer istemci IP'sidir.
export async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "bilinmiyor";
  } catch {
    // İstek bağlamı yoksa (ör. bir script) auth akışı hız sınırı yüzünden kırılmasın.
    return "bilinmiyor";
  }
}

// true: izin var (olay kaydedildi) — false: sınır aşıldı. Sayaç okunamıyorsa (ör. migration henüz uygulanmamış)
// FAIL-OPEN: kayıt/giriş/sipariş akışı hız sınırı yüzünden bozulmaz, hata loglanır.
export async function consumeRateLimit(rule: RateLimitRule, subject: string): Promise<boolean> {
  try {
    const key = `${rule.action}:${subject}`.slice(0, 200);
    const since = new Date(Date.now() - rule.windowMinutes * 60_000);
    const count = await prisma.rateLimitEvent.count({ where: { key, createdAt: { gt: since } } });
    if (count >= rule.max) return false;
    await prisma.rateLimitEvent.create({ data: { key } });
    // Ara sıra (≈%2) 24 saatten eski satırları temizle — tablo şişmesin, ayrı bir zamanlanmış iş gerekmesin.
    if (Math.random() < 0.02) {
      void prisma.rateLimitEvent
        .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3_600_000) } } })
        .catch(() => undefined);
    }
    return true;
  } catch (error) {
    console.error("[rateLimit] sayaç kullanılamadı, izin verildi:", error instanceof Error ? error.message : error);
    return true;
  }
}

// IP tabanlı kural için kısayol.
export async function consumeIpRateLimit(rule: RateLimitRule): Promise<boolean> {
  return consumeRateLimit(rule, await clientIp());
}
