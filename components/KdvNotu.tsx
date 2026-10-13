// Liste sayfalarında (kategori, arama, Çok Satanlar, Yeni Ürünler, Favoriler) başlığın yanında BİR KEZ yazılır; ürün
// kartlarında "KDV Dahil" etiketi yok (DESIGN.md / KDV kuralı, 2026-10-13). Ürün sayfası fiyatın altında ayrıca yazar.
export const KDV_NOTU = "Tüm fiyatlara KDV dahildir.";

export default function KdvNotu({ className = "" }: { className?: string }) {
  return <p className={`text-xs text-neutral-500 ${className}`}>{KDV_NOTU}</p>;
}
