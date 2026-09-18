"use client";

import { useState } from "react";

export type FaqItem = { question: string; answer: string };

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-900"
            >
              {item.question}
              <span className="ml-3 shrink-0 text-neutral-400">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <p className="px-4 pb-4 text-sm text-neutral-600">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
