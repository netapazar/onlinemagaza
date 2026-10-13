// Banner/slider için ürün fotoğraflarından kompozisyon: 1-3 fotoğraf, hafif eğimli, beyaz çerçeveli, yumuşak gölgeli kartlar
// (sürekli süzülme animasyonu 2026-10-13'te kaldırıldı — DESIGN.md / Derinlik, hareket). Görsel dosyası (public/banners) YOKKEN kullanılır; hiç fotoğraf yoksa görsel
// alanı boş kalır. Dekoratif — alt metin boş. Boyutlar kabın YÜZDESİ: slider genişliği değişse de oran bozulmaz.
import StoreImage from "@/components/StoreImage";

export type CollagePhoto = { url: string; name: string };

const SLOTS = [
  { cls: "right-[6%] top-[8%] w-[62%] rotate-[4deg]" },
  { cls: "left-[2%] top-[46%] w-[44%] -rotate-[7deg]" },
  { cls: "right-[1%] top-[64%] w-[36%] rotate-[9deg]" },
];

export default function ProductCollage({ photos, offset = 0 }: { photos: CollagePhoto[]; offset?: number }) {
  if (photos.length === 0) return null;
  const list = Array.from({ length: Math.min(3, photos.length) }, (_, i) => photos[(i + offset) % photos.length]);

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] sm:block" aria-hidden="true">
      {list.map((photo, i) => (
        <div key={`${photo.url}-${i}`} className={`absolute aspect-square ${SLOTS[i].cls}`}>
          <div
            className="h-full w-full overflow-hidden rounded-2xl bg-white p-1 shadow-xl shadow-black/25 lg:p-1.5"
          >
            {/* Tembel (lazy): mobilde bu kolaj gizli (display:none) — eager olsaydı gizli olduğu hâlde indirilirdi. */}
            <div className="relative h-full w-full">
              <StoreImage src={photo.url} alt="" sizes="(min-width: 1024px) 220px, 200px" className="rounded-xl object-cover" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
