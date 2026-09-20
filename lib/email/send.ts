// Grup 5 — Resend ile e-posta gönderimi. magaza-crm ve magaza-online'da
// BİREBİR AYNI dosya (bkz. render.ts başındaki not).
//
// Sözleşme: `sendEmail` ASLA throw etmez. RESEND_API_KEY / EMAIL_FROM yoksa,
// alıcı geçersizse, Resend hata dönerse veya ağ/zaman aşımı olursa e-posta
// atlanır/başarısız sayılır, sonuç EmailLog'a yazılır (o da başarısız olursa
// sadece console'a) ve çağıran hiçbir şey fark etmez — sipariş/başvuru/durum
// güncellemesi hiçbir koşulda e-posta yüzünden bozulmaz.
//
// Ortam değişkenleri (Vercel'de her iki projede):
//   RESEND_API_KEY  — Resend API anahtarı (kullanıcı kendisi ekler)
//   EMAIL_FROM      — doğrulanmış domain üzerinden gönderen, ör. "Tedarikhane <siparis@...>"
import { prisma } from "@/lib/prisma";

export type SendEmailInput = {
  // ORDER_PLACED, ADMIN_NEW_ORDER, PAYMENT_CONFIRMED, ... (EmailLog.type)
  type: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  relatedOrderId?: string | null;
  relatedApplicationId?: string | null;
};

export type SendEmailResult = "SENT" | "FAILED" | "SKIPPED";

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;
const MAX_ERROR_LENGTH = 1000;

async function writeLog(
  input: SendEmailInput,
  status: SendEmailResult,
  error: string | null,
  providerId: string | null
) {
  try {
    await prisma.emailLog.create({
      data: {
        type: input.type,
        toEmail: input.to,
        subject: input.subject,
        status,
        error: error ? error.slice(0, MAX_ERROR_LENGTH) : null,
        providerId,
        relatedOrderId: input.relatedOrderId ?? null,
        relatedApplicationId: input.relatedApplicationId ?? null,
      },
    });
  } catch (logError) {
    // Log tablosu yazılamıyorsa (ör. migration henüz uygulanmamış) en azından
    // Vercel loglarında iz kalsın. Gövde/API anahtarı asla yazılmıyor.
    console.error("[email] EmailLog yazılamadı", {
      type: input.type,
      to: input.to,
      status,
      error,
      logError: logError instanceof Error ? logError.message : String(logError),
    });
  }
}

// Gönderim hiç denenmeden atlanan durumlar için (ör. yönetici adresi ayarlı
// değil) — sendEmail ile aynı log satırını yazar.
export async function logSkippedEmail(input: SendEmailInput, reason: string): Promise<void> {
  await writeLog(input, "SKIPPED", reason, null);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey) {
      await writeLog(input, "SKIPPED", "RESEND_API_KEY tanımlı değil.", null);
      return "SKIPPED";
    }
    if (!from) {
      await writeLog(input, "SKIPPED", "EMAIL_FROM tanımlı değil.", null);
      return "SKIPPED";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to)) {
      await writeLog(input, "SKIPPED", "Geçersiz alıcı adresi.", null);
      return "SKIPPED";
    }

    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      await writeLog(input, "FAILED", `Resend HTTP ${response.status}: ${body}`, null);
      return "FAILED";
    }

    const data = (await response.json().catch(() => null)) as { id?: string } | null;
    await writeLog(input, "SENT", null, data?.id ?? null);
    return "SENT";
  } catch (error) {
    await writeLog(input, "FAILED", error instanceof Error ? error.message : String(error), null);
    return "FAILED";
  }
}
