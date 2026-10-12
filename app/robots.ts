import type { MetadataRoute } from "next";
import { FILTRE_PARAMETRELERI, SITE_URL } from "@/lib/seo";

// robots.txt (2026-10-12, kullanıcı kararı). Sebep: botlar (en çok GPTBot, IP 74.7.241.17) ürün listesinin filtre
// birleşimlerinde (kategori+marka+sayfa+sıralama…) sonsuz URL uzayında dolaşıp günde 200–380 bin fonksiyon çağrısı
// yaptırıyordu. Kurallar:
//   * Tüm botlar: filtreli /urunler adresleri ve kişiye özel sayfalar (sepet, hesap, ödeme) yasak; ürün (/urun/…),
//     kategori (/urunler?kategori=…, sayfa dahil) ve içerik sayfaları serbest. Arama motorları ve yapay zekâ tarayıcıları
//     (Googlebot, Bingbot, GPTBot, OAI-SearchBot, meta-externalagent…) bu genel gruba tabidir — ayrı grup AÇILMAZ, çünkü
//     botlar kendine özel grup varsa genel grubu tamamen yok sayar.
//   * SERankingBacklinksBot: sitenin tamamı yasak (geri bağlantı tarayıcısı, mağazaya faydası yok).
// `*` joker karakteri Google, Bing ve OpenAI tarafından desteklenir; "/urunler?*marka=" parametre sırasından bağımsız eşleşir.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "SERankingBacklinksBot", disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ...FILTRE_PARAMETRELERI.map((p) => `/urunler?*${p}=`),
          "/sepet",
          "/checkout",
          "/odeme",
          "/siparis-alindi",
          "/hesabim",
          "/favoriler",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
