import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import HesabimShell from "../HesabimShell";
import TalepForm from "./TalepForm";

// Talep durumu etiketi — bilinmeyen bir değer gelirse (şema ileride genişlerse) güvenli varsayılan: "İnceleniyor".
const DURUM: Record<string, { label: string; tone: string }> = {
  BEKLIYOR: { label: "İnceleniyor", tone: "bg-amber-50 text-amber-800" },
  ONAYLANDI: { label: "Onaylandı", tone: "bg-emerald-50 text-emerald-700" },
  REDDEDILDI: { label: "Onaylanmadı", tone: "bg-red-50 text-red-700" },
};
const durum = (d: string) => DURUM[d] ?? DURUM.BEKLIYOR;
const ALAN: Record<string, string> = { unvan: "Unvan", vkn: "VKN/TCKN", vergiDairesi: "Vergi Dairesi", faturaAdresi: "Fatura Adresi" };

export const metadata = { title: "Firma Bilgilerim", robots: { index: false } };


// Onaylı kurumsal üye kendi firma kartını GÖRÜR, doğrudan değiştiremez: faturalar bu bilgilerle kesildiği için
// değişiklik talep olarak bırakılır, CRM (Online Mağaza › Firma Bilgi Talepleri) onaylayınca karta işlenir.
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
          id: true,
        },
      },
    },
  });
  const firma = customer?.firma;
  if (!firma?.onlineErisimAktif) redirect("/hesabim");

  const talepler = await prisma.firmaBilgiTalebi.findMany({
    where: { firmaId: firma.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, durum: true, istenen: true, kararNotu: true, createdAt: true, kararTarihi: true },
  });
  const bekleyen = talepler.find((t) => durum(t.durum) === DURUM.BEKLIYOR);

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
      <div className="mt-6 border-t border-neutral-100 pt-5">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">Bilgi değişikliği</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Fatura güvenliği için bu bilgiler doğrudan değiştirilemez; talebiniz incelenip onaylandıktan sonra güncellenir.
        </p>
        {bekleyen ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            {bekleyen.createdAt.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })} tarihli talebiniz inceleniyor.
          </p>
        ) : (
          <TalepForm
            current={{ unvan: firma.unvan, vkn: firma.vkn ?? "", vergiDairesi: firma.vergiDairesi ?? "", faturaAdresi: faturaAdresi ?? "" }}
          />
        )}
        {talepler.length > 0 && (
          <ul className="mt-4 space-y-2">
            {talepler.map((t) => {
              const d = durum(t.durum);
              const alanlar = Object.keys((t.istenen ?? {}) as Record<string, unknown>).map((k) => ALAN[k] ?? k).join(", ");
              return (
                <li key={t.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-xs text-neutral-600">
                  <span className={`mr-2 rounded-full px-2 py-0.5 font-medium ${d.tone}`}>{d.label}</span>
                  {t.createdAt.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })} · {alanlar}
                  {t.kararNotu && <span className="mt-1 block text-neutral-500">Not: {t.kararNotu}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </HesabimShell>
  );
}
