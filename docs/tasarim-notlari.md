# Vitrin tasarım notları (tasarim-iyilestirme dalı)

## Footer bilgileri — ortam değişkenleri (Vercel → Project → Settings → Environment Variables → Production)

Hiçbiri kodda gömülü değil. Tanımsız/boş bırakılan alan footer'da **hiç gösterilmez**.

| Değişken | Örnek |
|---|---|
| `SITE_ADDRESS` | `Örnek Mah. Örnek Sk. No:1 \| Kadıköy / İstanbul` (satır sonu için `\|` ya da `\n`) |
| `SITE_EMAIL` | `bilgi@tedarikhane.com` |
| `SITE_HOURS` | `Hafta içi 09:00 - 18:00 \| Cumartesi 09:00 - 14:00` |
| `SOCIAL_INSTAGRAM` / `SOCIAL_FACEBOOK` / `SOCIAL_X` / `SOCIAL_LINKEDIN` / `SOCIAL_YOUTUBE` | tam adres (`https://...`); yalnız http(s) kabul edilir |

Değişiklik sonrası yeniden dağıtım (redeploy) gerekir.

## Banner görselleri

`public/banners/` klasörüne dosya koyun (ayrıntı: `public/banners/README.txt`). Anahtarlar (dosya adı, uzantısız):
`hero-1, hero-cari, hero-2, hero-3` (slider) ve `promo-1, promo-2` (sağ iki banner). Öncelik: **dosya > ürün fotoğrafı
kolajı > ikon**. Dosya yoksa mevcut ürün fotoğraflarından kompozisyon kullanılır. Manifest build'de otomatik üretilir
(`scripts/build-banner-manifest.mjs`).

## Diğer

- Kategori adları yalnız **gösterimde** düzgün Türkçe büyük/küçük harfe çevrilir (`lib/text.ts` → `trTitle`); veritabanı değişmez.
- "Kurumsal fiyat için giriş yapın" ipucu onaylı üyede görünmez (`components/MemberHint.tsx`); rakam göstermez.
- Önizleme (preview) dağıtımı varsayılan olarak DEMO katalog gösterir; `DEMO_DATA=false` verilirse gerçek katalog.
- Animasyonlar CSS-only; `prefers-reduced-motion` altında kapalı. Route düzeyinde `loading.tsx` bilerek YOK: ölçümde mobil
  DCL'yi ~330 ms geciktirdi.

## Görseller (next/image)

- Ürün görselleri `components/StoreImage.tsx` ile (next/image sarmalayıcısı) gösterilir: ekrandaki boyuta uygun WebP + `srcset`, varsayılan tembel (lazy) yükleme.
  İlk ekrandaki görseller (`/urunler` ilk 4 kart, detay ana görseli) hemen yüklenir (LCP); tembel yükleme onları geciktirir.
- YALNIZ kendi Supabase deposundaki (`urun-gorselleri`) görseller optimize edilir. Demo `data:` görselleri ve yöneticinin "Görsel URL" ile eklediği harici adresler
  `unoptimized` gösterilir (tanımsız sunucu adresi next/image'de sayfayı kırardı).
- `next.config.ts`: `remotePatterns` (yalnız o bucket), az sayıda boyut (`deviceSizes` 640/828/1200, `imageSizes` 96/192/256/384) ve 1 yıllık `minimumCacheTTL` —
  dönüşüm sayısı (Vercel Image Optimization kotası) düşük kalsın; dosya adları değişmez UUID olduğundan önbellek güvenli.
- Kaynak dosyaların kendisi CRM'de yüklenirken 1200 px WebP'ye küçültülür (CRM `docs/proje-kararlari.md` → "Ürün görseli optimizasyonu").
