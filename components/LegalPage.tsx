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
      <h1 className="mb-1 text-2xl font-bold text-neutral-900">{title}</h1>
      {updatedNote && <p className="mb-6 text-xs text-neutral-400">{updatedNote}</p>}
      <div className="prose-legal space-y-4 text-sm leading-relaxed text-neutral-700">{children}</div>
    </div>
  );
}
