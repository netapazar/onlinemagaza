// Ana sayfa kategori kartlarındaki illüstrasyonlar (2026-10, public/gorseller/kategori/*.webp — 112 px, saydam zemin).
// Yalnız kategori kartlarında kullanılır; mega menü ve mobil menü çizgi ikonlarda kalır (lib/categoryIcons.tsx).
// Eşleşme yoksa (yeni bir ana kategori) kart eski çizgi ikona düşer.
// Daire renkleri: görsel okunurluğu önce; site sırasında (alfabetik) aynı ton art arda gelmesin diye brand-100 / brand-200
// dönüşümlü, Defter–Ajanda açık turuncu (accent-100). brand-50 (kartta görünmüyordu) ve brand-300 (teal görseli yutuyordu) kullanılmaz.
// large: çok uzun/çok yatay görseller (dik kalemler, zımba) kare çerçevede küçük kalıyor → dairede biraz daha büyük çizilir.
export type CategoryImage = { src: string; circleClass: string; large?: boolean };

const IMAGE_RULES: { keywords: string[]; image: CategoryImage }[] = [
  { keywords: ["defter", "ajanda"], image: { src: "/gorseller/kategori/defter-ajanda.webp", circleClass: "bg-[var(--color-accent-100)]" } },
  { keywords: ["okul"], image: { src: "/gorseller/kategori/okul-kirtasiye.webp", circleClass: "bg-[var(--color-brand-200)]" } },
  { keywords: ["ofis kırtasiye", "ofis kirtasiye"], image: { src: "/gorseller/kategori/ofis-kirtasiye.webp", circleClass: "bg-[var(--color-brand-100)]", large: true } },
  { keywords: ["elektronik"], image: { src: "/gorseller/kategori/ofis-elektronik.webp", circleClass: "bg-[var(--color-brand-200)]" } },
  { keywords: ["sanatsal"], image: { src: "/gorseller/kategori/sanatsal.webp", circleClass: "bg-[var(--color-brand-100)]" } },
  { keywords: ["yaşam", "yasam"], image: { src: "/gorseller/kategori/ev-yasam.webp", circleClass: "bg-[var(--color-brand-100)]" } },
  { keywords: ["kağıt", "kagit"], image: { src: "/gorseller/kategori/kagit-urunleri.webp", circleClass: "bg-[var(--color-brand-200)]" } },
  { keywords: ["kalem"], image: { src: "/gorseller/kategori/kalemler.webp", circleClass: "bg-[var(--color-brand-100)]", large: true } },
];

export function getCategoryImage(name: string): CategoryImage | null {
  const normalized = name.toLocaleLowerCase("tr-TR");
  return IMAGE_RULES.find((rule) => rule.keywords.some((kw) => normalized.includes(kw)))?.image ?? null;
}
