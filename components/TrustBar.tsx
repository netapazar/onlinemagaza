import { Truck, CreditCard, Package, Undo2 } from "lucide-react";

// Dört madde de sitede gerçekten sunulan/mevcut olana dayanıyor — henüz otomatikleşmemiş hiçbir şey vaat edilmiyor
// (ödeme entegrasyonu ve e-Fatura otomasyonu hâlâ ertelenenler listesinde): aynı gün kargo kesim saati lib/shipping.ts'te
// gerçek, kart/havale checkout'ta seçilebilir birer yöntem (otomatik/online tahsilat iddiası yok), 14 gün cayma hakkı
// Türk tüketici mevzuatının yasal tabanı. "Kurumsal Alışveriş" kutusu kaldırıldı: aynı mesaj hemen altındaki
// "Kurumsal Üyelik Avantajları" bölümünde zaten var (tekrar) — yerine sitede gerçekten olan "Tek Adresten Tedarik" geldi.
const ITEMS = [
  { icon: Truck, title: "Aynı Gün Kargo", description: "13:30'a kadar verilen siparişler" },
  { icon: CreditCard, title: "Kart ve Havale Seçenekleri", description: "Siparişte tercihinizi belirtin" },
  { icon: Package, title: "Tek Adresten Tedarik", description: "Tüm ofis ihtiyacı bir arada" },
  { icon: Undo2, title: "14 Gün İçinde İade", description: "Cayma hakkınızı kullanabilirsiniz" },
];

export default function TrustBar() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ITEMS.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex items-center gap-2.5 rounded-xl border border-neutral-200 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-neutral-900">{title}</span>
            <span className="block truncate text-[11px] text-neutral-500">{description}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
