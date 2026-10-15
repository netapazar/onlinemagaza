import { cache } from "react";
import { permanentRedirect } from "next/navigation";
import { uyeGrupBaglantilari } from "@/lib/urunGrubu";

type Arama = Record<string, string | string[] | undefined>;

const uyeGrupBaglantisi = cache(async (barcode: string) => (await uyeGrupBaglantilari([barcode])).get(barcode) ?? null);

// Eski üye adresleri (/urun/<üye.slug>, /urun/id/<id>): ürün görünür bir Ürün Grubu'nun üyesiyse 308 kalıcı yönlendirme →
// grup adresi + üyenin seçim parametreleri (varyant, 2026-10). Gelen diğer parametreler (utm_… gibi) korunur; seçim
// parametreleri her zaman üyeninkidir. Grup görünür değilse hiçbir şey yapmaz — üye sayfası bugünkü gibi çalışır.
export async function grupUyesiyseYonlendir(barcode: string | null | undefined, arama: Arama): Promise<void> {
  if (!barcode) return;
  const b = await uyeGrupBaglantisi(barcode);
  if (!b) return;
  const [yol, secim = ""] = b.href.split("?");
  const sp = new URLSearchParams(secim);
  for (const [k, v] of Object.entries(arama)) {
    if (sp.has(k) || v === undefined) continue;
    for (const x of Array.isArray(v) ? v : [v]) sp.append(k, x);
  }
  const qs = sp.toString();
  permanentRedirect(qs ? `${yol}?${qs}` : yol);
}
