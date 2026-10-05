// iyzico bildirimi (webhook) — müşteri tarayıcıyı kapatsa ya da dönüş gerçekleşmese bile ödeme sonucu işlensin.
// Adres iyzico panelinde: Ayarlar > İşyeri Ayarları > İşyeri Bildirimleri → https://www.tedarikhane.com/api/iyzico/bildirim
// 1) X-IYZ-SIGNATURE-V3 imzası doğrulanır; doğrulanmayan istek 401 alır ve HİÇBİR şey yapılmaz.
// 2) Doğrulanmış bildirim bile durumu TEK BAŞINA değiştirmez: yalnız odemeSonucuIsle'yi tetikler (sonuç iyzico'dan sorgulanır,
//    imza + tutar kontrol edilir). Dönüşle aynı fonksiyon olduğu için aynı siparişi iki kez işlemez (idempotent).
import { webhookImzasiDogru } from "@/lib/iyzico";
import { odemeSonucuIsle } from "@/lib/iyzicoOdeme";
import { prisma } from "@/lib/prisma";
import { notifyOrderPlaced, runAfterResponse } from "@/lib/email/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let govde: Record<string, unknown>;
  try {
    govde = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response("gecersiz", { status: 400 });
  }
  if (!govde || typeof govde !== "object" || !webhookImzasiDogru(govde, request.headers.get("x-iyz-signature-v3"))) {
    console.warn("[iyzico-bildirim] imza doğrulanamadı, istek işlenmedi");
    return new Response("imza", { status: 401 });
  }

  // Checkout Form bildiriminde token gelir; yoksa referans (paymentConversationId) ile denemeyi bul.
  let token = typeof govde.token === "string" ? govde.token : null;
  if (!token && typeof govde.paymentConversationId === "string") {
    const d = await prisma.webOrderOdemeDenemesi.findUnique({ where: { referans: govde.paymentConversationId }, select: { token: true } });
    token = d?.token ?? null;
  }
  if (!token) {
    console.warn(`[iyzico-bildirim] eşleşen ödeme denemesi yok (olay ${String(govde.iyziEventType ?? "-")})`);
    return new Response("ok", { status: 200 });
  }

  const r = await odemeSonucuIsle(token);
  if (r.yeniOdendi && r.orderId) {
    const orderId = r.orderId;
    runAfterResponse("ORDER_PLACED", () => notifyOrderPlaced(orderId));
  }
  console.info(`[iyzico-bildirim] olay ${String(govde.iyziEventType ?? "-")} → ${r.durum}${r.yeniOdendi ? " (yeni ödendi)" : ""}`);
  return new Response("ok", { status: 200 });
}
