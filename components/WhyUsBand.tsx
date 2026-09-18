import { Percent, Truck, Landmark, MapPin } from "lucide-react";

// Dördü de sitede gerçekten var olan yeteneklere dayanıyor (bkz. TrustBar'daki
// aynı gerekçe) — üyelik indirimi, kesim saatine bağlı aynı gün kargo, onaylı
// üyeler için cari hesap, tek kataloğun altındaki geniş ürün yelpazesi.
const REASONS = [
  { icon: Percent, title: "Firmalara Özel Fiyat", description: "Üyelik ile indirimli tedarik" },
  { icon: Truck, title: "Aynı Gün Kargo", description: "13:30 kesim saatine kadar" },
  { icon: Landmark, title: "Cari Hesap ile Alışveriş", description: "Onaylı üyelere özel" },
  { icon: MapPin, title: "Tek Adresten Tedarik", description: "Tüm ofis ihtiyacı bir arada" },
];

export default function WhyUsBand() {
  return (
    <div className="mb-5 rounded-2xl bg-[var(--color-brand-900)] px-5 py-7 sm:px-8">
      <h2 className="mb-5 text-xl font-bold text-white">Neden Tedarikhane?</h2>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {REASONS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-start gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-white">{title}</span>
            <span className="text-xs text-white/70">{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
