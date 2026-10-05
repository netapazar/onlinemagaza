// Kartla ödeme: iyzico'ya giden IP ve dönüş (callback) adresinin tabanı istek başlıklarından okunur — dönüş adresi
// müşterinin geldiği alan adıyla aynı olsun (www.tedarikhane.com / yerel test). Ortam değişkeni gerekmez.
import { headers } from "next/headers";
import { clientIp } from "@/lib/rateLimit";

export async function istekBilgisi(): Promise<{ ip: string; tabanUrl: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "www.tedarikhane.com";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https");
  const ip = await clientIp();
  return { ip: /^[\d.:a-fA-F]+$/.test(ip) ? ip : "127.0.0.1", tabanUrl: `${proto}://${host}` };
}
