// Ana sayfa kategori kartlarındaki illüstrasyonlar (2026-10): tek sprite public/gorseller/kategori-sprite.webp (8 hücre × 112 px,
// saydam zemin, tek satır); `index` hücre sırası. Stil ve geç yükleme: app/globals.css .kategori-sprite.
// Yalnız kategori kartlarında kullanılır; mega menü ve mobil menü çizgi ikonlarda kalır (lib/categoryIcons.tsx).
// Eşleşme yoksa (yeni bir ana kategori) kart eski çizgi ikona düşer.
// Daire renkleri: görsel okunurluğu önce; site sırasında (alfabetik) aynı ton art arda gelmesin diye brand-100 / brand-200
// dönüşümlü, Defter–Ajanda açık turuncu (accent-100). brand-50 (kartta görünmüyordu) ve brand-300 (teal görseli yutuyordu) kullanılmaz.
// large: çok uzun/çok yatay görseller (dik kalemler, zımba) kare çerçevede küçük kalıyor → dairede biraz daha büyük çizilir.
export type CategoryImage = { index: number; circleClass: string; large?: boolean };
export const CATEGORY_SPRITE_CELLS = 8;

const IMAGE_RULES: { keywords: string[]; image: CategoryImage }[] = [
  { keywords: ["defter", "ajanda"], image: { index: 0, circleClass: "bg-[var(--color-accent-100)]" } },
  { keywords: ["okul"], image: { index: 1, circleClass: "bg-[var(--color-brand-200)]" } },
  { keywords: ["ofis kırtasiye", "ofis kirtasiye"], image: { index: 2, circleClass: "bg-[var(--color-brand-100)]", large: true } },
  { keywords: ["elektronik"], image: { index: 3, circleClass: "bg-[var(--color-brand-200)]" } },
  { keywords: ["sanatsal"], image: { index: 4, circleClass: "bg-[var(--color-brand-100)]" } },
  { keywords: ["yaşam", "yasam"], image: { index: 5, circleClass: "bg-[var(--color-brand-100)]" } },
  { keywords: ["kağıt", "kagit"], image: { index: 6, circleClass: "bg-[var(--color-brand-200)]" } },
  { keywords: ["kalem"], image: { index: 7, circleClass: "bg-[var(--color-brand-100)]", large: true } },
];

export function getCategoryImage(name: string): CategoryImage | null {
  const normalized = name.toLocaleLowerCase("tr-TR");
  return IMAGE_RULES.find((rule) => rule.keywords.some((kw) => normalized.includes(kw)))?.image ?? null;
}
