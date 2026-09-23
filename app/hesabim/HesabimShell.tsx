import Link from "next/link";
import type { ReactNode } from "react";

// Hesabım alt sayfalarının ortak çerçevesi: başlık + "← Hesabım" dönüş bağlantısı.
export default function HesabimShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/hesabim" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-800">
        ← Hesabım
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">{title}</h1>
      {description && <p className="mb-6 text-sm text-neutral-500">{description}</p>}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">{children}</div>
    </div>
  );
}
