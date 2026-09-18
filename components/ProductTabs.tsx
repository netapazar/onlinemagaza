"use client";

import { useState } from "react";

type Spec = { label: string; value: string };

export default function ProductTabs({
  description,
  specs,
}: {
  description: string | null;
  specs: Spec[];
}) {
  const hasDescription = Boolean(description);
  const hasSpecs = specs.length > 0;
  const [tab, setTab] = useState<"aciklama" | "ozellikler">(hasDescription ? "aciklama" : "ozellikler");

  if (!hasDescription && !hasSpecs) return null;

  return (
    <div className="mt-10">
      <div className="flex gap-6 border-b border-neutral-200">
        {hasDescription && (
          <button
            type="button"
            onClick={() => setTab("aciklama")}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === "aciklama" ? "border-[var(--color-brand)] text-[var(--color-brand)]" : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Açıklama
          </button>
        )}
        {hasSpecs && (
          <button
            type="button"
            onClick={() => setTab("ozellikler")}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === "ozellikler" ? "border-[var(--color-brand)] text-[var(--color-brand)]" : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Özellikler
          </button>
        )}
      </div>

      <div className="py-5">
        {tab === "aciklama" && hasDescription && (
          <p className="whitespace-pre-line text-sm text-neutral-600">{description}</p>
        )}
        {tab === "ozellikler" && hasSpecs && (
          <dl className="divide-y divide-neutral-100 text-sm">
            {specs.map((s) => (
              <div key={s.label} className="flex justify-between py-2">
                <dt className="text-neutral-500">{s.label}</dt>
                <dd className="font-medium text-neutral-800">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
