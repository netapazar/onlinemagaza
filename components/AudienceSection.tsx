import Link from "next/link";
import { Building2, Factory, GraduationCap, Store } from "lucide-react";

// Segment bazlı ayrı bir ürün kataloğu/etiketleme yok — dördü de aynı gerçek hedefe (kurumsal üyelik başvurusu)
// yönlendiriyor, uydurma bir "bu segmentin ürünleri" listesi oluşturulmadı. Kompakt (yatay kart, tek satır) düzen.
const AUDIENCES = [
  { icon: Building2, title: "Ofisler", description: "Kurumsal ofis tedariki" },
  { icon: Factory, title: "Fabrikalar", description: "Toplu üretim ihtiyaçları" },
  { icon: GraduationCap, title: "Okullar", description: "Eğitim kurumu kırtasiyesi" },
  { icon: Store, title: "Mağaza & İşletmeler", description: "İşletmenize özel fiyatlar" },
];

export default function AudienceSection() {
  return (
    <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-lg font-bold text-neutral-900">Kimlere Hizmet Veriyoruz</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {AUDIENCES.map(({ icon: Icon, title, description }) => (
          <Link
            key={title}
            href="/hesabim/uyelik-basvurusu"
            className="group flex items-center gap-2.5 rounded-xl border border-neutral-200 p-2.5 transition-all duration-200 hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)] transition-colors group-hover:bg-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-900">{title}</span>
              <span className="block truncate text-[11px] text-neutral-500">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
