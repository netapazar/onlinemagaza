import { BoxIcon } from "@/components/icons";

export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)]">
        <BoxIcon className="h-7 w-7 text-[var(--color-brand)]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-neutral-900">{title}</h3>
      <p className="max-w-sm text-sm text-neutral-500">{description}</p>
    </div>
  );
}
