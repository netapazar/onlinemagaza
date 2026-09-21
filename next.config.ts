import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Ürün görselleri CRM'den yüklenirken zaten en çok 1200 px WebP'ye küçültülüp Supabase'e konuyor; next/image bunu
    // ekrandaki gerçek boyuta (kart ~200-400 px) indirir. Yalnız bu bucket'a izin verilir (bkz. components/StoreImage.tsx).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/urun-gorselleri/**" },
    ],
    // Az sayıda boyut = az sayıda dönüşüm (Vercel Image Optimization kotası): kart/küçük resim + galeri boyutları.
    deviceSizes: [640, 828, 1200],
    imageSizes: [96, 192, 256, 384],
    // Dosya adları her yüklemede yeni UUID (içerik değişmez) → dönüştürülmüş sonuç 1 yıl önbellekte tutulabilir.
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
