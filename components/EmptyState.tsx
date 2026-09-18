export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--color-brand)]" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-8.25-4.5-8.25 4.5m16.5 0l-8.25 4.5m8.25-4.5v9l-8.25 4.5m0-9L3.75 7.5m8.25 4.5v9m-8.25-13.5v9l8.25 4.5" />
        </svg>
      </div>
      <h3 className="mb-1 text-base font-semibold text-neutral-900">{title}</h3>
      <p className="max-w-sm text-sm text-neutral-500">{description}</p>
    </div>
  );
}
