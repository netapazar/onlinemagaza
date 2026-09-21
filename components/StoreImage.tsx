import Image from "next/image";

// Vitrin görselleri için tek giriş noktası (next/image sarmalayıcısı): doğru boyutta (srcset/sizes) WebP servis eder,
// varsayılan olarak tembel (lazy) yükler. `fill` modunda çalışır: üst kutu `relative` + boyutlu olmalı (aspect-square vb.).
//
// Yalnız KENDİ Supabase deposundaki ürün görselleri optimize edilir (next.config.ts remotePatterns ile aynı desen).
// Diğerleri — demo `data:` görselleri ve yöneticinin "Görsel URL" ile eklediği HARİCİ adresler — `unoptimized` olarak
// olduğu gibi gösterilir: tanımsız bir sunucu adresi next/image'de sayfayı hata ile kırardı.
const OPTIMIZABLE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/urun-gorselleri\//;

export function isOptimizableImage(src: string): boolean {
  return OPTIMIZABLE.test(src);
}

export default function StoreImage({
  src,
  alt,
  sizes,
  className = "",
  eager = false,
  preload = false,
}: {
  src: string;
  alt: string;
  /** Görselin ekranda kaplayacağı genişlik, ör. "(max-width: 640px) 45vw, 210px" — YANLIŞ/eksik olursa gereğinden büyük dosya iner. */
  sizes: string;
  className?: string;
  /** İlk ekranda görünen görsel: tembel yükleme LCP'yi geciktirir. */
  eager?: boolean;
  /** Sayfanın ana (LCP) görseli: <head>'e preload ekler. Yalnız her zaman görünen tek görsel için. */
  preload?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      loading={eager || preload ? "eager" : "lazy"}
      preload={preload}
      unoptimized={!isOptimizableImage(src)}
    />
  );
}
