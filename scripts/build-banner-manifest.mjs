#!/usr/bin/env node
// public/banners/ klasöründeki banner görsellerini tarayıp lib/bannerManifest.json'u üretir.
//
// Neden build-zamanı manifest (çalışma zamanında dosya kontrolü değil): Vercel'de public/ dosyaları CDN'e gider,
// sunucu fonksiyonunun içinde bulunmayabilir — çalışma anında fs ile "dosya var mı" bakmak canlıda sessizce
// "yok" dönebilir. Manifest build'de (dosyalar diskteyken) üretilip koda gömülür.
//
// KULLANIM (görseli değiştirmek için): görseli public/banners/ içine, ANAHTAR ADIYLA koyun ve dağıtın:
//   hero-1.webp   anasayfa slider, 1. slayt ("Firmanıza Özel Fiyatlar")
//   hero-cari.webp  slider, "cari hesabınızla ödeyin" slaydı (yalnız misafir/onaysız kullanıcıda görünür)
//   hero-2.webp   slider, 2. slayt ("Aynı Gün Kargo")
//   hero-3.webp   slider, 3. slayt ("Toplu Alım")
//   promo-1.webp  sağ üst banner ("Firmanıza Özel Fiyatlar")
//   promo-2.webp  sağ alt banner ("Toplu Alım Avantajı")
// Desteklenen uzantılar: webp, avif, jpg, jpeg, png, svg. Dosya yoksa ürün fotoğraflı kompozisyon / ikon yedeği kullanılır.
// Önerilen: slider için ~900x700 px, saydam arka planlı ürün kolajı (png/webp); promo için ~400x400 px.
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "banners");
const EXT = /\.(webp|avif|jpe?g|png|svg)$/i;
const manifest = {};
if (existsSync(dir)) {
  for (const file of readdirSync(dir).sort()) {
    if (!EXT.test(file)) continue;
    const key = file.replace(EXT, "");
    if (!manifest[key]) manifest[key] = `/banners/${file}`;
  }
}
writeFileSync(path.join(root, "lib", "bannerManifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`[banner-manifest] ${Object.keys(manifest).length} görsel: ${Object.keys(manifest).join(", ") || "(yok — yedek kompozisyon kullanılacak)"}`);
