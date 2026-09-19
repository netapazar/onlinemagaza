"use client";

import { useState } from "react";

// Grup 1a — daha önce miktar sadece +/- ile değiştirilebiliyordu (span,
// input değil), klavyeyle rakam yazılamıyordu. Ürün kartı/detay/sepet/mini
// sepetin dördü de bu tek bileşeni kullanıyor — kod tekrarı yok, doğrulama
// mantığı (stok üstü/geçersiz değer düzeltme+uyarı) tek yerde.
const SIZE_CLASSES = {
  sm: { button: "px-2 py-1", input: "w-8", text: "text-xs" },
  md: { button: "px-2.5 py-1.5", input: "w-10", text: "text-sm" },
  lg: { button: "px-3 py-3", input: "w-10", text: "text-sm" },
} as const;

export function QuantityStepper({
  value,
  max,
  onChange,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  size?: keyof typeof SIZE_CLASSES;
}) {
  const [text, setText] = useState(String(value));
  const [warning, setWarning] = useState<string | null>(null);
  // Dışarıdan (üst bileşenden, ör. sepetteki +/- ya da başka bir kaynak)
  // value değişirse input'u senkronize et — render sırasında koşullu
  // setState, React'ın "adjusting state when a prop changes" için önerdiği
  // desen (bkz. react.dev), bir effect'te yapılsaydı gereksiz bir ekstra
  // render turuna yol açardı.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(String(value));
  }

  function clamp(n: number): { next: number; warning: string | null } {
    if (!Number.isFinite(n)) return { next: value, warning: "Geçerli bir sayı girin." };
    const floored = Math.floor(n);
    if (floored < 1) return { next: 1, warning: "En az 1 adet girebilirsiniz." };
    if (max > 0 && floored > max) return { next: max, warning: `Stokta sadece ${max} adet var.` };
    return { next: floored, warning: null };
  }

  function commit(raw: string) {
    const parsed = raw.trim() === "" ? NaN : Number(raw);
    const { next, warning: w } = clamp(parsed);
    setWarning(w);
    setText(String(next));
    if (next !== value) onChange(next);
  }

  function step(delta: number) {
    const { next, warning: w } = clamp(value + delta);
    setWarning(w);
    setText(String(next));
    if (next !== value) onChange(next);
  }

  const cls = SIZE_CLASSES[size];

  return (
    <div>
      <div className={`flex items-center rounded-lg border border-neutral-300 ${cls.text}`}>
        <button type="button" onClick={() => step(-1)} aria-label="Azalt" className={`text-neutral-600 hover:text-neutral-900 ${cls.button}`}>
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label="Adet"
          className={`border-0 bg-transparent text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${cls.input}`}
        />
        <button type="button" onClick={() => step(1)} aria-label="Artır" className={`text-neutral-600 hover:text-neutral-900 ${cls.button}`}>
          +
        </button>
      </div>
      {warning && <p className="mt-0.5 text-[11px] font-medium text-red-600">{warning}</p>}
    </div>
  );
}
