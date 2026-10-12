import manifest from "@/lib/bannerManifest.json";

// Banner görselleri: public/banners/<anahtar>.<uzantı> dosyası varsa (build-zamanı manifest, bkz.
// scripts/build-banner-manifest.mjs) onun yolu, yoksa null (çağıran taraf ürün fotoğrafı kompozisyonu / ikon yedeğine düşer).
// hero-arka: tüm slaytların ortak, kutuyu dolduran arka plan fotoğrafı (varsa slayt görsellerinin ve kolajın yerine geçer).
export type BannerKey = "hero-arka" | "hero-1" | "hero-cari" | "hero-2" | "hero-3" | "promo-1" | "promo-2";

export function bannerImage(key: BannerKey): string | null {
  return (manifest as Record<string, string>)[key] ?? null;
}
