import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import { centsToTl } from "@/lib/pricing";
import {
  formatOrderDate,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_STEPS,
  orderStepIndex,
  PAYMENT_LABEL,
} from "@/lib/orderStatus";
import { orderNo } from "@/lib/email/render";

export const metadata = { title: "Sipariş Detayı", robots: { index: false } };

// Sipariş yalnızca SAHİBİ olan giriş yapmış müşteriye gösterilir (id + webCustomerId birlikte aranır): başka
// birinin sipariş numarasını tahmin etmek/yapıştırmak 404 verir. Dahili alanlar (maliyet, CRM bağlantıları,
// ödeme referansı) seçilmez.
export default async function SiparisDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  const { id } = await params;
  const order = await prisma.webOrder.findFirst({
    where: { id, webCustomerId: session.webCustomerId },
    select: {
      id: true,
      createdAt: true,
      status: true,
      paymentMethod: true,
      subtotalCents: true,
      shippingCents: true,
      totalCents: true,
      shippingLine1: true,
      shippingLine2: true,
      shippingIl: true,
      shippingIlce: true,
      kargoFirmasi: true,
      kargoTakipNo: true,
      items: { select: { id: true, name: true, quantity: true, unitPriceCents: true, lineTotalCents: true } },
    },
  });
  if (!order) notFound();

  const cancelled = order.status === "IPTAL_EDILDI";
  const stepIndex = orderStepIndex(order.status);
  const address = [order.shippingLine1, order.shippingLine2, `${order.shippingIlce}/${order.shippingIl}`]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sipariş #{orderNo(order.id)}</h1>
          <p className="text-xs text-neutral-500">{formatOrderDate(order.createdAt)}</p>
        </div>
        <Link href="/hesabim/siparisler" className="text-sm text-neutral-500 underline">
          Tüm siparişlerim
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Sipariş durumu</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_TONE[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
            {ORDER_STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        {cancelled ? (
          <p className="text-sm text-neutral-600">Bu sipariş iptal edildi.</p>
        ) : (
          <ol className="grid grid-cols-4 gap-2">
            {ORDER_STEPS.map((step, i) => {
              const done = i <= stepIndex;
              return (
                <li key={step.status} className="text-center">
                  <div className={`mx-auto mb-1.5 h-1.5 rounded-full ${done ? "bg-[var(--color-brand)]" : "bg-neutral-200"}`} />
                  <span className={`text-[11px] ${done ? "font-medium text-neutral-900" : "text-neutral-400"}`}>{step.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        {order.status === "ODEME_BEKLIYOR" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {order.paymentMethod === "CARI_HESAP"
              ? "Siparişiniz onaylandığında cari hesabınıza işlenecek."
              : "Ödeme onayı için ekibimiz sizinle iletişime geçecek."}
          </p>
        )}

        {(order.kargoFirmasi || order.kargoTakipNo) && (
          <div className="mt-4 rounded-lg bg-indigo-50 px-3 py-3 text-sm text-indigo-900">
            <p className="font-medium">Kargo bilgisi</p>
            {order.kargoFirmasi && <p className="mt-1">Kargo firması: {order.kargoFirmasi}</p>}
            {order.kargoTakipNo && <p className="mt-0.5">Takip numarası: <span className="font-mono">{order.kargoTakipNo}</span></p>}
          </div>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Ürünler</h2>
        <div className="divide-y divide-neutral-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <span className="text-neutral-800">
                {item.name}
                <span className="text-neutral-500"> × {item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium">{centsToTl(item.lineTotalCents)} ₺</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Ara toplam</span>
            <span>{centsToTl(order.subtotalCents)} ₺</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Kargo</span>
            <span>{order.shippingCents === 0 ? "Ücretsiz" : `${centsToTl(order.shippingCents)} ₺`}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-neutral-900">
            <span>Toplam</span>
            <span>{centsToTl(order.totalCents)} ₺</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 p-5 text-sm text-neutral-600">
        <p className="mb-1">
          <span className="font-medium text-neutral-900">Ödeme yöntemi:</span> {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
        </p>
        <p>
          <span className="font-medium text-neutral-900">Teslimat adresi:</span> {address}
        </p>
      </div>
    </div>
  );
}
