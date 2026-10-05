// iyzico Checkout Form dönüşü (callbackUrl). iyzico müşteriyi buraya POST ile (form alanı: token) gönderir.
// Tarayıcıdan gelen hiçbir tutar/durum bilgisine güvenilmez: yalnız token alınır, sonuç sunucudan iyzico'ya sorulur.
import { odemeSonucuIsle } from "@/lib/iyzicoOdeme";
import { istekBilgisi } from "@/lib/odemeIstek";
import { notifyOrderPlaced, runAfterResponse } from "@/lib/email/notifications";

export const dynamic = "force-dynamic";

async function isle(token: string | null) {
  const { tabanUrl } = await istekBilgisi();
  if (!token) return Response.redirect(`${tabanUrl}/`, 303);
  const r = await odemeSonucuIsle(token);
  if (r.yeniOdendi && r.orderId) {
    const orderId = r.orderId;
    runAfterResponse("ORDER_PLACED", () => notifyOrderPlaced(orderId));
  }
  if (!r.orderId) return Response.redirect(`${tabanUrl}/`, 303);
  return Response.redirect(r.durum === "ODENDI" ? `${tabanUrl}/siparis-alindi/${r.orderId}` : `${tabanUrl}/odeme/${r.orderId}`, 303);
}

export async function POST(request: Request) {
  let token: string | null = null;
  try {
    const form = await request.formData();
    const t = form.get("token");
    token = typeof t === "string" && /^[\w-]{10,200}$/.test(t) ? t : null;
  } catch {
    token = null;
  }
  return isle(token);
}

export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("token");
  return isle(t && /^[\w-]{10,200}$/.test(t) ? t : null);
}
