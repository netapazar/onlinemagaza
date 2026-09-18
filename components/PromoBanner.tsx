import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Düz renkli kutu yerine metin+katmanlı-daire-arkalı-ikon kompozisyonu —
// gerçek ürün fotoğrafımız olmayan kampanya alanları için sahte bir görsel
// uydurmak yerine sade, profesyonel bir illüstrasyon dili.
export default function PromoBanner({
  icon: Icon,
  title,
  description,
  href,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-1 items-center justify-between gap-3 overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${className}`}
    >
      <div className="relative z-10 max-w-[62%]">
        <h3 className="mb-1 text-base leading-tight font-bold text-white">{title}</h3>
        <p className="text-xs leading-snug text-white/85">{description}</p>
      </div>
      <div className="pointer-events-none absolute -right-6 -bottom-6 flex h-32 w-32 items-center justify-center rounded-full bg-white/10">
        <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white/15">
          <Icon className="h-10 w-10 text-white" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
