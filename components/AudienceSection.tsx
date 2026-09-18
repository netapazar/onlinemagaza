import Link from "next/link";
import { Building2, Factory, GraduationCap, Store } from "lucide-react";

// Segment bazlı ayrı bir ürün kataloğu/etiketleme yok — dördü de aynı
// gerçek hedefe (kurumsal üyelik başvurusu) yönlendiriyor, uydurma bir
// "bu segmentin ürünleri" listesi oluşturulmadı.
const AUDIENCES = [
  { icon: Building2, title: "Ofisler", description: "Kurumsal ofis tedariki" },
  { icon: Factory, title: "Fabrikalar", description: "Toplu üretim ihtiyaçları" },
  { icon: GraduationCap, title: "Okullar", description: "Eğitim kurumu kırtasiyesi" },
  { icon: Store, title: "Mağaza & İşletmeler", description: "İşletmenize özel fiyatlar" },
];

export default function AudienceSection() {
  return (
    <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-xl font-bold text-neutral-900">Kimlere Hizmet Veriyoruz</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AUDIENCES.map(({ icon: Icon, title, description }) => (
          <Link
            key={title}
            href="/hesabim/uyelik-basvurusu"
            className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-200 p-4 text-center transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)] group-hover:bg-white">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-neutral-900">{title}</span>
            <span className="text-xs text-neutral-500">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
