export default function LegalPage({
  title,
  updatedNote,
  children,
}: {
  title: string;
  updatedNote?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Taslak metin.</strong> Bu sayfa yayına alınmadan önce bir hukuk danışmanı tarafından
        gözden geçirilmeli ve köşeli parantez içindeki [şirket bilgileri] gerçek verilerle doldurulmalıdır.
      </div>
      <h1 className="mb-1 text-2xl font-bold text-neutral-900">{title}</h1>
      {updatedNote && <p className="mb-6 text-xs text-neutral-400">{updatedNote}</p>}
      <div className="prose-legal space-y-4 text-sm leading-relaxed text-neutral-700">{children}</div>
    </div>
  );
}
