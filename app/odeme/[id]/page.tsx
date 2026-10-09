import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { depoStokHaritasi } from "@/lib/depoStok";
import { centsToTl } from "@/lib/pricing";
import { miktarMetni } from "@/lib/satisBirimleri";
import { odemeSonucuIsle } from "@/lib/iyzicoOdeme";
import { notifyOrderPlaced, runAfterResponse } from "@/lib/email/notifications";
import { odemeyiTekrarDene } from "./actions";
import TekrarDeneButonu from "./TekrarDeneButonu";

export const metadata = { title: "Ödeme", robots: { index: false } };

// Hata kodu → metin (URL'den gelen serbest metin gösterilmez).
const HATA_METNI: Record<string, string> = {
  STOK: "Sepetinizdeki bazı ürünlerde yeterli stok kalmadı. Lütfen bizimle iletişime geçin.",
  INCELEMEDE: "Önceki ödeme denemenizin sonucu henüz kesinleşmedi. Lütfen birkaç dakika sonra tekrar deneyin.",
  HAZIRLANIYOR: "Ödeme sayfası başka bir sekmede açılıyor. Lütfen birkaç saniye sonra tekrar deneyin.",
  HATA: "Ödeme sayfası açılamadı. Lütfen tekrar deneyin.",
  UYGUN_DEGIL: "Bu sipariş için ödeme yapılamaz.",
  SINIR: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.",
};

async function siparisiOku(id: string) {
  return prisma.webOrder.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { barcode: true } } } },
      odemeDenemeleri: { orderBy: { denemeNo: "desc" }, take: 1 },
    },
  });
}

export default async function OdemePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hata?: string }>;
}) {
  const { id } = await params;
  const { hata } = await searchParams;
  let order = await siparisiOku(id);
  if (!order) notFound();
  if (order.paymentMethod !== "KART" || order.status === "ODENDI" || order.paidAt) redirect(`/siparis-alindi/${order.id}`);

  // Sayfa açılınca açık oturumun sonucu iyzico'ya sorulur (dönüş gelmediyse/takıldıysa düzelir).
  const acik = order.odemeDenemeleri[0];
  if (acik?.durum === "BASLATILDI" && acik.token) {
    const r = await odemeSonucuIsle(acik.token);
    if (r.yeniOdendi) runAfterResponse("ORDER_PLACED", () => notifyOrderPlaced(id));
    if (r.durum === "ODENDI") redirect(`/siparis-alindi/${id}`);
    order = (await siparisiOku(id)) ?? order;
  }
  const son = order.odemeDenemeleri[0];
  // Stok hatasında hangi ürünlerde sorun olduğu sunucuda yeniden hesaplanır (URL'deki metne güvenilmez).
  // Stok Ana Depo'dan, e-ticaret kuralıyla (tek havuz, 2026-10).
  const depo = hata === "STOK" ? await depoStokHaritasi(prisma, order.items.map((i) => i.product.barcode)) : null;
  const stoguYetmeyen = depo
    ? [...new Set(order.items.filter((i) => i.quantity > (depo.get(i.product.barcode)?.eticaretSatilabilir ?? 0)).map((i) => i.name))]
    : [];
  const iptal = order.status === "IPTAL_EDILDI";
  const dogrulanamadi = son?.durum === "TUTAR_UYUSMAZ" || son?.hataKodu === "SIPARIS_UYGUN_DEGIL";
  const devamEdiyor = son?.durum === "BASLATILDI";
  const tekrarDenenebilir = !iptal && !dogrulanamadi && order.status === "ODEME_BEKLIYOR";
  const baslik = iptal
    ? "Sipariş İptal Edildi"
    : dogrulanamadi
      ? "Ödemeniz Doğrulanamadı"
      : devamEdiyor
        ? "Ödemeniz Tamamlanmadı"
        : "Ödeme Alınamadı";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="mb-1 text-xl font-semibold">{baslik}</h1>
        <p className="text-sm text-neutral-500">Sipariş No: {order.id.slice(-8).toUpperCase()}</p>
      </div>

      {hata && HATA_METNI[hata] && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {stoguYetmeyen.length > 0 ? `Şu ürünlerde yeterli stok kalmadı: ${stoguYetmeyen.join(", ")}. Lütfen bizimle iletişime geçin.` : HATA_METNI[hata]}
        </p>
      )}
      {dogrulanamadi ? (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ödemeniz kontrol edilmek üzere ekibimize iletildi. Kartınızdan çekim yapıldıysa ekibimiz sizinle iletişime geçecek; lütfen
          tekrar ödeme yapmayın.
        </p>
      ) : iptal ? (
        <p className="mb-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-700">Bu sipariş iptal edildi.</p>
      ) : (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {devamEdiyor
            ? "Ödeme sayfasından çıkmışsınız ya da ödeme henüz tamamlanmadı. Kaldığınız yerden devam edebilirsiniz."
            : `Kartınızdan ödeme alınamadı${son?.hataMesaji ? `: ${son.hataMesaji.replace(/[.\s]+$/, "")}.` : "."} Siparişiniz kaydedildi, ödemesi alınmadı.`}
        </p>
      )}

      <div className="mb-6 rounded-xl border border-neutral-200 p-5">
        <div className="divide-y divide-neutral-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.name} × {miktarMetni(item.satisBirimi, item.birimIcerigi, item.quantity)}
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

      {tekrarDenenebilir && (
        <form action={odemeyiTekrarDene} className="mb-3">
          <input type="hidden" name="orderId" value={order.id} />
          <TekrarDeneButonu etiket={devamEdiyor ? "Ödemeye Devam Et" : "Tekrar Dene"} />
          <p className="mt-2 text-center text-xs text-neutral-500">Kart bilgilerinizi iyzico&apos;nun güvenli ödeme sayfasında gireceksiniz.</p>
        </form>
      )}
      <Link href="/" className="block text-center text-sm text-neutral-500 underline">
        Alışverişe dön
      </Link>
    </div>
  );
}
