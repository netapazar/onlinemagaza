import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import { centsToTl } from "@/lib/pricing";
import Pagination from "@/components/Pagination";
import {
  formatOrderDate,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PAYMENT_LABEL,
} from "@/lib/orderStatus";
import { orderNo } from "@/lib/email/render";

export const metadata = { title: "Siparişlerim", robots: { index: false } };

const PAGE_SIZE = 15;

// Hesabım › Siparişlerim: yalnızca GİRİŞ YAPMIŞ müşterinin kendi siparişleri (webCustomerId ile). Misafir
// siparişleri hesaba bağlı değil, burada listelenmez.
export default async function SiparislerimPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  const { sayfa } = await searchParams;
  const page = Math.max(1, Number(sayfa) || 1);

  const where = { webCustomerId: session.webCustomerId };
  const [orders, total] = await Promise.all([
    prisma.webOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        createdAt: true,
        status: true,
        paymentMethod: true,
        totalCents: true,
        kargoTakipNo: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.webOrder.count({ where }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Siparişlerim</h1>
        <Link href="/hesabim" className="text-sm text-neutral-500 underline">
          Hesabım
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 p-8 text-center">
          <p className="mb-4 text-sm text-neutral-600">
            {total === 0 ? "Henüz bir siparişiniz yok." : "Bu sayfada sipariş yok."}
          </p>
          <Link
            href="/urunler"
            className="inline-block rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
          >
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/hesabim/siparisler/${order.id}`}
                className="block rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-900">Sipariş #{orderNo(order.id)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_TONE[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                  <span>
                    {formatOrderDate(order.createdAt)} · {order._count.items} kalem · {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">{centsToTl(order.totalCents)} ₺</span>
                </div>
                {order.kargoTakipNo && (
                  <p className="mt-2 text-xs text-indigo-700">Kargo takip no: {order.kargoTakipNo}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / PAGE_SIZE)}
          buildHref={(overrides) => `/hesabim/siparisler?sayfa=${overrides.sayfa ?? "1"}`}
        />
      )}
    </div>
  );
}
