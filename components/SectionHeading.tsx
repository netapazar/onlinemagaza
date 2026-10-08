import type { Icon } from "@/components/icons";

// Anasayfa bölüm başlıkları için tek görünüm: solda teal aksan çubuğu + (varsa) teal ikon + kalın başlık.
// 2026-10: punto bir kademe büyük (mobil 22 px, geniş ekran 24 px), çubuk 8 px kalın / 28 px yüksek, ikon 24 px.
// Bölümler aynı beyaz kart içinde dursa da başlıklar marka rengiyle birbirinden ayrışsın diye (tasarım turu 2026-10).
export default function SectionHeading({
  title,
  icon: Icon,
  as: Tag = "h2",
  className = "",
}: {
  title: string;
  icon?: Icon;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag className={`flex items-center gap-2.5 text-[1.375rem] leading-tight font-extrabold sm:text-2xl tracking-tight text-neutral-900 ${className}`}>
      <span className="h-7 w-2 shrink-0 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
      {Icon && <Icon className="h-6 w-6 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />}
      <span>{title}</span>
    </Tag>
  );
}
