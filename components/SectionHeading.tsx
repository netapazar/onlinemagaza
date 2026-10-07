import type { LucideIcon } from "lucide-react";

// Anasayfa bölüm başlıkları için tek görünüm: solda teal aksan çubuğu + (varsa) teal ikon + kalın başlık.
// Bölümler aynı beyaz kart içinde dursa da başlıklar marka rengiyle birbirinden ayrışsın diye (tasarım turu 2026-10).
export default function SectionHeading({
  title,
  icon: Icon,
  as: Tag = "h2",
  className = "",
}: {
  title: string;
  icon?: LucideIcon;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag className={`flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-neutral-900 ${className}`}>
      <span className="h-6 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
      {Icon && <Icon className="h-5 w-5 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />}
      <span>{title}</span>
    </Tag>
  );
}
