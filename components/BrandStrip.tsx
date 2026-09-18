// Tek marka varken bir "şerit" göstermenin anlamı yok — en az 2 marka
// olduğunda render ediliyor (bkz. proje kısıtı: az veriyle yarım/anlamsız
// görünen bölümler gizlenmeli).
const MIN_BRANDS = 2;

export default function BrandStrip({ brands }: { brands: { id: string; name: string }[] }) {
  if (brands.length < MIN_BRANDS) return null;

  return (
    <div>
      <h2 className="mb-3 text-xl font-bold text-neutral-900">Markalar</h2>
      <div className="flex flex-wrap gap-2">
        {brands.map((b) => (
          <span
            key={b.id}
            className="rounded-full border border-neutral-200 px-3.5 py-1.5 text-sm font-medium text-neutral-600"
          >
            {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}
