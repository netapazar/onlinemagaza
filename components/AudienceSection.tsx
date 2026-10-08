import Link from "next/link";
import { BuildingIcon, FactoryIcon, GraduationCapIcon, StoreIcon, UsersIcon } from "@/components/icons";
import SectionHeading from "@/components/SectionHeading";

// Segment bazlı ayrı bir ürün kataloğu/etiketleme yok — dördü de aynı gerçek hedefe (kurumsal üyelik başvurusu)
// yönlendiriyor, uydurma bir "bu segmentin ürünleri" listesi oluşturulmadı. Kompakt (yatay kart, tek satır) düzen.
const AUDIENCES = [
  { icon: BuildingIcon, title: "Ofisler", description: "Kurumsal ofis tedariki" },
  { icon: FactoryIcon, title: "Fabrikalar", description: "Toplu üretim ihtiyaçları" },
  { icon: GraduationCapIcon, title: "Okullar", description: "Eğitim kurumu kırtasiyesi" },
  { icon: StoreIcon, title: "Mağaza & İşletmeler", description: "İşletmenize özel fiyatlar" },
];

export default function AudienceSection() {
  return (
    <div className="mb-6 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5 sm:p-6">
      <SectionHeading title="Kimlere Hizmet Veriyoruz" icon={UsersIcon} className="mb-4" />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {AUDIENCES.map(({ icon: Icon, title, description }) => (
          <Link
            key={title}
            href="/hesabim/uyelik-basvurusu"
            className="group flex items-center gap-3 rounded-xl border border-[var(--color-brand-100)] bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)] transition-colors group-hover:bg-[var(--color-brand)] group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm leading-tight font-semibold text-neutral-900 sm:truncate">{title}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-neutral-600 sm:truncate">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
