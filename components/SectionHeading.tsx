// Bölüm başlıkları için tek görünüm: düz metin, 22 px (mobil) / 24 px, 800 ağırlık. Başına renkli çubuk ya da ikon
// konmaz — 2026-10-13 kararı, 7 Ekim'deki çubuk + ikon kararı geçersiz (bkz. DESIGN.md / Bölüm başlığı, Yapma 1).
export default function SectionHeading({
  title,
  as: Tag = "h2",
  className = "",
}: {
  title: string;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag className={`text-[1.375rem] leading-tight font-extrabold tracking-tight text-neutral-900 sm:text-2xl ${className}`}>
      {title}
    </Tag>
  );
}
