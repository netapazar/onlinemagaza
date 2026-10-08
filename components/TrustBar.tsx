// Dört madde de sitede gerçekten sunulan/mevcut olana dayanıyor — henüz otomatikleşmemiş hiçbir şey vaat edilmiyor
// (ödeme entegrasyonu ve e-Fatura otomasyonu hâlâ ertelenenler listesinde): aynı gün kargo kesim saati lib/shipping.ts'te
// gerçek, kart/havale checkout'ta seçilebilir birer yöntem (otomatik/online tahsilat iddiası yok), 14 gün cayma hakkı
// Türk tüketici mevzuatının yasal tabanı. "Kurumsal Alışveriş" kutusu kaldırıldı: aynı mesaj hemen altındaki
// "Kurumsal Üyelik Avantajları" bölümünde zaten var (tekrar) — yerine sitede gerçekten olan "Tek Adresten Tedarik" geldi.
// Görseller: public/gorseller/serit/*.webp (72 px, saydam zemin) — beyaz dairede, mobil 44 px / geniş ekran 48 px.
const ITEMS = [
  { image: "/gorseller/serit/kargo.webp", title: "Aynı Gün Kargo", description: "13:30'a kadar verilen siparişler" },
  { image: "/gorseller/serit/kart-havale.webp", title: "Kart ve Havale Seçenekleri", description: "Siparişte tercihinizi belirtin" },
  { image: "/gorseller/serit/tek-adres.webp", title: "Tek Adresten Tedarik", description: "Tüm ofis ihtiyacı bir arada" },
  { image: "/gorseller/serit/iade.webp", title: "14 Gün İçinde İade", description: "Cayma hakkınızı kullanabilirsiniz" },
];

export default function TrustBar() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ITEMS.map(({ image, title, description }) => (
        <div key={title} className="flex items-center gap-3 rounded-xl p-2 sm:p-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[var(--color-brand-100)] sm:h-12 sm:w-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" width={34} height={34} decoding="async" className="h-8 w-8 sm:h-[34px] sm:w-[34px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] leading-tight font-bold text-[var(--color-brand-800)] sm:truncate">{title}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-neutral-600 sm:truncate">{description}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
