"use server";

import { redirect } from "next/navigation";
import { odemeOturumuBaslat } from "@/lib/iyzicoOdeme";
import { istekBilgisi } from "@/lib/odemeIstek";
import { consumeIpRateLimit, RULES } from "@/lib/rateLimit";

// "Tekrar Dene" / "Ödemeye devam et". Aynı sipariş için açık oturum varsa aynı ödeme sayfasına döner (çift ödeme koruması
// odemeOturumuBaslat'ta). Hata metni URL'ye yazılmaz; yalnız kod gider, sayfa metni kendisi seçer.
export async function odemeyiTekrarDene(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  if (!/^[\w-]{10,60}$/.test(orderId)) redirect("/");
  if (!(await consumeIpRateLimit(RULES.ORDER_IP))) redirect(`/odeme/${orderId}?hata=SINIR`);
  const r = await odemeOturumuBaslat(orderId, await istekBilgisi());
  if (r.ok) redirect(r.url);
  if (r.kod === "ODENDI") redirect(`/siparis-alindi/${orderId}`);
  redirect(`/odeme/${orderId}?hata=${r.kod}`);
}
