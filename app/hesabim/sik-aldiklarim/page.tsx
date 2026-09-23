import Link from "next/link";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/webSession";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import { getFrequentPurchases } from "@/lib/frequentPurchases";
import FrequentList, { type FrequentRow } from "./FrequentList";

export const metadata = { title: "Sık Aldıklarım", robots: { index: false } };

export default async function SikAldiklarimPage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  const [items, memberDiscountPercent] = await Promise.all([
    getFrequentPurchases(session.webCustomerId),
    getMemberDiscountPercent(),
  ]);
  const rows: FrequentRow[] = items.map((i) => ({
    product: i.product,
    purchaseCount: i.purchaseCount,
    lastAt: i.lastAt.toISOString(),
    lastQuantity: i.lastQuantity,
    lastUnit: i.lastUnit,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link href="/hesabim" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-800">
        ← Hesabım
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Sık Aldıklarım</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Firmanızın daha önce aldığı ürünler — en sık alınan en üstte. Miktarı seçip tek tıkla tekrar sipariş verebilirsiniz.
      </p>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="mb-4 text-sm text-neutral-600">Henüz sitede satışta olan bir ürünü satın almadınız.</p>
          <Link
            href="/urunler"
            className="inline-block rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
          >
            Ürünlere göz atın
          </Link>
        </div>
      ) : (
        <FrequentList rows={rows} memberDiscountPercent={memberDiscountPercent} />
      )}
    </div>
  );
}
