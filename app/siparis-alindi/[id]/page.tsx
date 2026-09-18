import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centsToTl } from "@/lib/pricing";
import ClearCartOnMount from "@/components/ClearCartOnMount";

const PAYMENT_LABELS: Record<string, string> = {
  KART: "Kredi/Banka Kartı",
  HAVALE: "Havale/EFT",
  CARI_HESAP: "Cari Hesap",
};

export default async function SiparisAlindiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.webOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <ClearCartOnMount />

      <div className="mb-6 text-center">
        <p className="mb-2 text-3xl">✓</p>
        <h1 className="mb-1 text-xl font-semibold">Siparişiniz Alındı</h1>
        <p className="text-sm text-neutral-500">Sipariş No: {order.id.slice(-8).toUpperCase()}</p>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Ürünler</h2>
        <div className="divide-y divide-neutral-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">{centsToTl(item.lineTotalCents)} ₺</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3 text-base font-semibold">
          <span>Toplam</span>
          <span>{centsToTl(order.totalCents)} ₺</span>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-5 text-sm text-neutral-600">
        <p className="mb-1">
          <span className="font-medium text-neutral-900">Ödeme yöntemi:</span> {PAYMENT_LABELS[order.paymentMethod]}
        </p>
        <p>
          <span className="font-medium text-neutral-900">Teslimat adresi:</span> {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}, {order.shippingIlce}/{order.shippingIl}
        </p>
      </div>

      {(order.paymentMethod === "KART" || order.paymentMethod === "HAVALE") && (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ödeme onayı için ekibimiz sizinle iletişime geçecek.
        </p>
      )}

      <Link href="/" className="block w-full rounded-lg bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-neutral-800">
        Alışverişe Devam Et
      </Link>
    </div>
  );
}
