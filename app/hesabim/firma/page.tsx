import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import HesabimShell from "../HesabimShell";

export const metadata = { title: "Firma Bilgilerim", robots: { index: false } };

const PHONE_DISPLAY = "0551 487 21 74";
const PHONE_HREF = "tel:+905514872174";

// Onaylı kurumsal üye kendi firma kartını GÖRÜR, doğrudan değiştiremez: faturalar bu bilgilerle kesildiği için
// değişiklik CRM'de onaylanmalı. (Düzenleme talebi formu, talep tablosunun şema onayından sonra eklenecek.)
export default async function FirmaPage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    select: {
      firma: {
        select: {
          unvan: true,
          vkn: true,
          vergiDairesi: true,
          faturaAdresi: true,
          adres: true,
          il: true,
          ilce: true,
          telefon: true,
          email: true,
          onlineErisimAktif: true,
        },
      },
    },
  });
  const firma = customer?.firma;
  if (!firma?.onlineErisimAktif) redirect("/hesabim");

  const faturaAdresi = firma.faturaAdresi || [firma.adres, [firma.ilce, firma.il].filter(Boolean).join(" / ")].filter(Boolean).join(", ");
  const rows: Array<[string, string | null]> = [
    ["Unvan", firma.unvan],
    [firma.vkn && firma.vkn.length === 11 ? "TC Kimlik No" : "Vergi Kimlik No", firma.vkn],
    ["Vergi Dairesi", firma.vergiDairesi],
    ["Fatura Adresi", faturaAdresi || null],
    ["Telefon", firma.telefon],
    ["E-posta", firma.email],
  ];

  return (
    <HesabimShell title="Firma Bilgilerim" description="Faturalarınız bu bilgilerle düzenlenir.">
      <dl className="divide-y divide-neutral-100 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-3 py-2.5">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="col-span-2 text-neutral-900">{value || <span className="text-neutral-400">—</span>}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
        Bu bilgiler fatura güvenliği için yalnız onayla değiştirilebilir. Bir değişiklik gerekiyorsa{" "}
        <a href={PHONE_HREF} className="font-medium text-[var(--color-brand)] underline">
          {PHONE_DISPLAY}
        </a>{" "}
        numarasından bize ulaşın.
      </p>
    </HesabimShell>
  );
}
