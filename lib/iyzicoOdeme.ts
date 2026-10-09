// Kartla ödeme çekirdeği (iyzico Checkout Form, 2026-10). magaza-crm'de (src/lib/iyzicoOdeme.ts) ve magaza-online'da
// (lib/iyzicoOdeme.ts) BİREBİR aynıdır.
//
// Güvenlik kuralları:
//   * Tarayıcıdan gelen hiçbir tutar/sipariş no/durum bilgisine güvenilmez — sonuç HER ZAMAN sunucudan iyzico'ya sorulur
//     (odemeSonucuIsle), yanıt imzası doğrulanır, tutar kuruş bazında sipariş kalemlerinden yeniden hesaplanan tutarla karşılaştırılır.
//   * Dönüş (callback), webhook ve takılı kontrol aynı fonksiyondan geçer; "ödendi" yazımı koşullu tek güncellemedir → idempotent.
//   * Bir siparişin aynı anda tek açık oturumu olur (çift tıklama/geri/yenileme aynı ödeme sayfasına döner); yeni oturumdan önce
//     önceki oturumun sonucu iyzico'ya sorulur. iyzico'ya giden referans (conversationId) her oturumda tekildir.
//   * Kart bilgisi bu sisteme gelmez; iyzico yanıtının tamamı saklanmaz/loglanmaz.
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { sendEmail, logSkippedEmail } from "@/lib/email/send";
import { renderEmail, formatTl, orderNo } from "@/lib/email/render";
import { satilabilirMiktar } from "@/lib/depoStok";
import { odemeSonrasiStokDus } from "@/lib/siparisStok";
import {
  IYZICO_YOLLARI,
  baslatmaYanitiImzasiDogru,
  iyzicoIstek,
  iyzicoYapilandirildi,
  kurustanTutar,
  sorguYanitiImzasiDogru,
  tutardanKurus,
  type IyzicoYanit,
} from "@/lib/iyzico";

// iyzico Checkout Form oturumu 30 dakika geçerli; 1 dakika pay bırakılır.
const OTURUM_DAKIKA = 30;
const YENIDEN_KULLANIM_PAYI_MS = 60_000;
// Siteden TCKN toplanmıyor — iyzico'nun bu durum için kabul ettiği değer.
const VARSAYILAN_TCKN = "11111111111";

const MESAJ_KISA = 500;
function kisalt(s: unknown): string | null {
  if (s === undefined || s === null || s === "") return null;
  return String(s).slice(0, MESAJ_KISA);
}

// iyzico gsmNumber "+905551112233" biçiminde ister; tanınmayan biçimde hiç gönderilmez (alan isteğe bağlı).
function gsmBicimi(ham: string): string | undefined {
  const d = ham.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("90")) return `+${d}`;
  if (d.length === 11 && d.startsWith("0")) return `+9${d}`;
  if (d.length === 10 && d.startsWith("5")) return `+90${d}`;
  return undefined;
}

type KalemIslemi = { paymentTransactionId: string; paidPriceCents: number; iadeEdildi?: boolean; iadeRef?: string };

// ---------------------------------------------------------------------------------------------------------------------
// Ödeme oturumu başlat
// ---------------------------------------------------------------------------------------------------------------------

export type OdemeBaslatSonucu =
  | { ok: true; url: string }
  | { ok: false; kod: "ODENDI" | "UYGUN_DEGIL" | "STOK" | "INCELEMEDE" | "HAZIRLANIYOR" | "HATA"; hata: string };

export async function odemeOturumuBaslat(
  orderId: string,
  ctx: { ip: string; tabanUrl: string }
): Promise<OdemeBaslatSonucu> {
  if (!iyzicoYapilandirildi()) return { ok: false, kod: "HATA", hata: "Kartla ödeme şu an kullanılamıyor." };

  const order = await prisma.webOrder.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { barcode: true, name: true } } } },
      webCustomer: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      odemeDenemeleri: { orderBy: { denemeNo: "desc" }, take: 1 },
    },
  });
  if (!order || order.paymentMethod !== "KART") return { ok: false, kod: "UYGUN_DEGIL", hata: "Sipariş bulunamadı." };
  if (order.status === "ODENDI" || order.paidAt) return { ok: false, kod: "ODENDI", hata: "Bu siparişin ödemesi zaten alındı." };
  if (order.status !== "ODEME_BEKLIYOR") return { ok: false, kod: "UYGUN_DEGIL", hata: "Bu sipariş için ödeme yapılamaz." };

  // Önceki oturum: hâlâ geçerliyse AYNI ödeme sayfasına dön (çift tıklama/geri/yenileme); değilse sonucunu iyzico'ya sor.
  const son = order.odemeDenemeleri[0];
  if (son && son.durum === "BASARISIZ" && son.token && son.tokenSonGecerlilik && son.tokenSonGecerlilik.getTime() > Date.now()) {
    // Başarısız görünen ama süresi dolmamış oturum: yeni oturumdan önce son kez sorulur (aynı oturumda ödenmiş olabilir).
    const r = await odemeSonucuIsle(son.token);
    if (r.durum === "ODENDI") return { ok: false, kod: "ODENDI", hata: "Bu siparişin ödemesi zaten alındı." };
  }
  if (son && son.durum === "BASLATILDI") {
    if (son.token && son.odemeSayfasiUrl && son.tokenSonGecerlilik && son.tokenSonGecerlilik.getTime() - Date.now() > YENIDEN_KULLANIM_PAYI_MS) {
      return { ok: true, url: son.odemeSayfasiUrl };
    }
    if (son.token) {
      const r = await odemeSonucuIsle(son.token);
      if (r.durum === "ODENDI") return { ok: false, kod: "ODENDI", hata: "Bu siparişin ödemesi zaten alındı." };
      if (r.durum === "BEKLIYOR") {
        return { ok: false, kod: "INCELEMEDE", hata: "Önceki ödeme denemenizin sonucu henüz kesinleşmedi. Lütfen birkaç dakika sonra tekrar deneyin." };
      }
    } else if (Date.now() - son.createdAt.getTime() < 2 * 60_000) {
      // Token'sız BASLATILDI: başka bir istek şu an oturum açıyor.
      return { ok: false, kod: "HAZIRLANIYOR", hata: "Ödeme sayfası başka bir sekmede açılıyor, lütfen birkaç saniye sonra tekrar deneyin." };
    } else {
      await prisma.webOrderOdemeDenemesi.updateMany({
        where: { id: son.id, durum: "BASLATILDI" },
        data: { durum: "BASARISIZ", hataMesaji: "Ödeme oturumu açılamadı.", sonuclananAt: new Date() },
      });
    }
  }

  // Stok kontrolü (rezervasyon yok; yalnız ödeme başlamadan önce kontrol — kesin kontrol ödeme doğrulanınca stok
  // düşülürken yapılır, bkz. lib/siparisStok.ts). Stok Ana Depo'dandır, e-ticaret kuralıyla: pazarlamaya ayrılan satılmaz.
  // Aynı ürünün birden çok satırı toplanır.
  const depoSatirlari = await prisma.product.findMany({
    where: { store: { isWarehouse: true }, barcode: { in: order.items.map((i) => i.product.barcode) } },
    select: { barcode: true, stock: true, pazarlamaAyrilan: true },
  });
  const depoStok = new Map(depoSatirlari.map((p) => [p.barcode, satilabilirMiktar("ETICARET", p.stock, p.pazarlamaAyrilan)]));
  const adetler = new Map<string, { ad: string; adet: number; stok: number }>();
  for (const i of order.items) {
    const e = adetler.get(i.product.barcode) ?? { ad: i.product.name, adet: 0, stok: depoStok.get(i.product.barcode) ?? 0 };
    e.adet += i.quantity;
    adetler.set(i.product.barcode, e);
  }
  const yetersiz = [...adetler.values()].filter((e) => e.adet > e.stok).map((e) => e.ad);
  if (yetersiz.length > 0) return { ok: false, kod: "STOK", hata: `Şu ürünlerde yeterli stok yok: ${yetersiz.join(", ")}` };

  // Tutar sunucuda sipariş kalemlerinden yeniden hesaplanır; siparişteki toplamla aynı olmalı.
  const beklenen = order.items.reduce((t, i) => t + i.lineTotalCents, 0) + order.shippingCents;
  if (beklenen !== order.totalCents || beklenen <= 0) {
    return { ok: false, kod: "HATA", hata: "Sipariş tutarı doğrulanamadı. Lütfen bizimle iletişime geçin." };
  }

  // Oturumu sahiplen: (webOrderId, denemeNo) tekil — aynı anda gelen ikinci istek burada düşer.
  const denemeNo = (son?.denemeNo ?? 0) + 1;
  let deneme;
  try {
    deneme = await prisma.webOrderOdemeDenemesi.create({
      data: { webOrderId: order.id, denemeNo, referans: `${order.id}-${denemeNo}`, beklenenTutarCents: beklenen },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, kod: "HAZIRLANIYOR", hata: "Ödeme sayfası başka bir sekmede açılıyor, lütfen birkaç saniye sonra tekrar deneyin." };
    }
    throw e;
  }

  const adSoyad = (order.webCustomer?.name ?? order.guestName ?? "Müşteri").trim();
  const bosluk = adSoyad.lastIndexOf(" ");
  const ad = bosluk > 0 ? adSoyad.slice(0, bosluk) : adSoyad;
  const soyad = bosluk > 0 ? adSoyad.slice(bosluk + 1) : adSoyad;
  const email = order.webCustomer?.email ?? order.guestEmail ?? "";
  const telefon = gsmBicimi(order.webCustomer?.phone ?? order.guestPhone ?? "");
  const teslimatAdres = [order.shippingLine1, order.shippingLine2, `${order.shippingIlce}/${order.shippingIl}`].filter(Boolean).join(", ");
  const faturaAdres = order.billingSameAsShipping || !order.billingLine1
    ? { contactName: adSoyad, city: order.shippingIl, country: "Turkey", address: teslimatAdres, zipCode: order.shippingPostaKodu ?? undefined }
    : {
        contactName: order.billingName ?? adSoyad,
        city: order.billingIl ?? order.shippingIl,
        country: "Turkey",
        address: [order.billingLine1, order.billingLine2, `${order.billingIlce}/${order.billingIl}`].filter(Boolean).join(", "),
        zipCode: order.billingPostaKodu ?? undefined,
      };

  const kalemler = order.items.map((i) => ({
    id: i.id,
    name: i.name.slice(0, 200),
    category1: "Kırtasiye ve Ofis",
    itemType: "PHYSICAL",
    price: kurustanTutar(i.lineTotalCents),
  }));
  if (order.shippingCents > 0) {
    kalemler.push({ id: "kargo", name: "Kargo", category1: "Kargo", itemType: "PHYSICAL", price: kurustanTutar(order.shippingCents) });
  }

  const yanit = await iyzicoIstek(IYZICO_YOLLARI.cfBaslat, {
    locale: "tr",
    conversationId: deneme.referans,
    price: kurustanTutar(beklenen),
    paidPrice: kurustanTutar(beklenen),
    currency: "TRY",
    basketId: order.id,
    paymentGroup: "PRODUCT",
    callbackUrl: `${ctx.tabanUrl}/odeme/sonuc`,
    enabledInstallments: [1],
    buyer: {
      id: order.webCustomer?.id ?? `misafir-${order.id}`,
      name: ad,
      surname: soyad,
      gsmNumber: telefon,
      email,
      identityNumber: VARSAYILAN_TCKN,
      registrationAddress: teslimatAdres,
      ip: ctx.ip,
      city: order.shippingIl,
      country: "Turkey",
      zipCode: order.shippingPostaKodu ?? undefined,
    },
    shippingAddress: { contactName: adSoyad, city: order.shippingIl, country: "Turkey", address: teslimatAdres, zipCode: order.shippingPostaKodu ?? undefined },
    billingAddress: faturaAdres,
    basketItems: kalemler,
  });

  if (yanit.status !== "success" || typeof yanit.token !== "string" || typeof yanit.paymentPageUrl !== "string") {
    await prisma.webOrderOdemeDenemesi.update({
      where: { id: deneme.id },
      data: { durum: "BASARISIZ", hataKodu: kisalt(yanit.errorCode), hataMesaji: kisalt(yanit.errorMessage) ?? "Ödeme oturumu açılamadı.", sonuclananAt: new Date() },
    });
    return { ok: false, kod: "HATA", hata: "Ödeme sayfası açılamadı. Lütfen tekrar deneyin." };
  }
  if (!baslatmaYanitiImzasiDogru(yanit) || yanit.conversationId !== deneme.referans) {
    await prisma.webOrderOdemeDenemesi.update({
      where: { id: deneme.id },
      data: { durum: "BASARISIZ", hataKodu: "IMZA", hataMesaji: "iyzico başlatma yanıtının imzası doğrulanamadı.", sonuclananAt: new Date() },
    });
    return { ok: false, kod: "HATA", hata: "Ödeme sayfası açılamadı. Lütfen tekrar deneyin." };
  }

  await prisma.$transaction([
    prisma.webOrderOdemeDenemesi.update({
      where: { id: deneme.id },
      data: {
        token: yanit.token,
        odemeSayfasiUrl: yanit.paymentPageUrl,
        tokenSonGecerlilik: new Date(Date.now() + OTURUM_DAKIKA * 60_000),
      },
    }),
    prisma.webOrder.update({ where: { id: order.id }, data: { iyzicoToken: yanit.token, paymentProvider: "IYZICO" } }),
  ]);
  return { ok: true, url: yanit.paymentPageUrl };
}

// ---------------------------------------------------------------------------------------------------------------------
// Sonucu iyzico'dan sorgula ve işle (dönüş, webhook, takılı kontrol — hepsi burası)
// ---------------------------------------------------------------------------------------------------------------------

export type OdemeSonucu = {
  orderId: string | null;
  durum: "ODENDI" | "BEKLIYOR" | "BASARISIZ" | "TUTAR_UYUSMAZ" | "SORUNLU" | "BILINMIYOR";
  // Bu çağrıda ilk kez "ödendi" yazıldıysa true — "sipariş alındı" e-postasını çağıran bir kez gönderir.
  yeniOdendi: boolean;
  hataMesaji?: string | null;
};

export async function odemeSonucuIsle(token: string): Promise<OdemeSonucu> {
  const deneme = await prisma.webOrderOdemeDenemesi.findUnique({ where: { token } });
  if (!deneme) return { orderId: null, durum: "BILINMIYOR", yeniOdendi: false };
  const sonDurum = (): OdemeSonucu["durum"] =>
    deneme.durum === "BASARILI" ? "ODENDI" : deneme.durum === "BASLATILDI" ? "BEKLIYOR" : deneme.durum;
  // Kesinleşmiş: BASARILI / TUTAR_UYUSMAZ. BASARISIZ ise oturum süresi dolana kadar yeniden sorulur — müşteri iyzico
  // sayfasına dönüp AYNI oturumda başka kartla ödemiş olabilir; o ödeme kaybolmasın.
  const tekrarSorulabilir =
    deneme.durum === "BASLATILDI" ||
    (deneme.durum === "BASARISIZ" && !!deneme.tokenSonGecerlilik && deneme.tokenSonGecerlilik.getTime() > Date.now());
  if (!tekrarSorulabilir) {
    return { orderId: deneme.webOrderId, durum: deneme.hataKodu === "SIPARIS_UYGUN_DEGIL" ? "SORUNLU" : sonDurum(), yeniOdendi: false, hataMesaji: deneme.hataMesaji };
  }
  const acikDurumlar = ["BASLATILDI", "BASARISIZ"] as ("BASLATILDI" | "BASARISIZ")[];

  const y = await iyzicoIstek(IYZICO_YOLLARI.cfSorgula, { locale: "tr", conversationId: deneme.referans, token });
  const suresiDoldu = !!deneme.tokenSonGecerlilik && deneme.tokenSonGecerlilik.getTime() < Date.now();

  if (y.status !== "success" && String(y.paymentStatus ?? "") === "FAILURE") {
    // Kesin ret (kart limiti, banka reddi, 3D hatası…). Para çekilmediği için imza gerekmez; yalnız "başarısız" yazılır.
    await basarisizYaz(deneme.id, y, "Ödeme alınamadı.");
    return { orderId: deneme.webOrderId, durum: "BASARISIZ", yeniOdendi: false, hataMesaji: kisalt(y.errorMessage) ?? "Ödeme alınamadı." };
  }
  if (y.status !== "success") {
    if (deneme.durum === "BASARISIZ") return { orderId: deneme.webOrderId, durum: "BASARISIZ", yeniOdendi: false, hataMesaji: deneme.hataMesaji };
    // Ağ hatası ya da oturum henüz sonuçlanmadı. Süre dolduysa ödeme tamamlanmamış sayılır.
    if (y.errorCode !== "NETWORK" && suresiDoldu) {
      // iyzico'nun teknik mesajı ("token bulunamadı" vb.) müşteriye gösterilmesin.
      await basarisizYaz(deneme.id, { errorCode: y.errorCode }, "Ödeme oturumunun süresi doldu, ödeme tamamlanmadı.");
      return { orderId: deneme.webOrderId, durum: "BASARISIZ", yeniOdendi: false, hataMesaji: "Ödeme tamamlanmadı." };
    }
    return { orderId: deneme.webOrderId, durum: "BEKLIYOR", yeniOdendi: false, hataMesaji: kisalt(y.errorMessage) };
  }

  if (!sorguYanitiImzasiDogru(y)) {
    // İmza tutmuyorsa yanıta güvenilmez: hiçbir şey yazılmaz (takılı kontrol tekrar dener), yönetici bilgilendirilir.
    await prisma.webOrderOdemeDenemesi.update({ where: { id: deneme.id }, data: { hataKodu: "IMZA", hataMesaji: "iyzico sorgu yanıtının imzası doğrulanamadı." } });
    console.error(`[iyzico] sorgu yanıtı imzası doğrulanamadı: deneme ${deneme.referans}`);
    return { orderId: deneme.webOrderId, durum: "BEKLIYOR", yeniOdendi: false, hataMesaji: "Ödeme sonucu doğrulanamadı." };
  }

  const paymentStatus = String(y.paymentStatus ?? "");
  if (paymentStatus !== "SUCCESS") {
    if (!paymentStatus && !suresiDoldu) {
      // Müşteri henüz ödeme sayfasında.
      if (deneme.durum === "BASARISIZ") return { orderId: deneme.webOrderId, durum: "BASARISIZ", yeniOdendi: false, hataMesaji: deneme.hataMesaji };
      return { orderId: deneme.webOrderId, durum: "BEKLIYOR", yeniOdendi: false };
    }
    if (!paymentStatus) {
      // Oturum süresi doldu, ödeme hiç denenmedi.
      await basarisizYaz(deneme.id, { errorCode: y.errorCode }, "Ödeme oturumunun süresi doldu, ödeme tamamlanmadı.");
      return { orderId: deneme.webOrderId, durum: "BASARISIZ", yeniOdendi: false, hataMesaji: "Ödeme tamamlanmadı." };
    }
    await basarisizYaz(deneme.id, y, "Ödeme alınamadı.");
    return { orderId: deneme.webOrderId, durum: "BASARISIZ", yeniOdendi: false, hataMesaji: kisalt(y.errorMessage) ?? "Ödeme alınamadı." };
  }
  // Dolandırıcılık incelemesindeki ödeme (fraudStatus 0) henüz kesin değil; -1 reddedilmiş.
  const fraud = Number(y.fraudStatus);
  if (fraud === 0) return { orderId: deneme.webOrderId, durum: "BEKLIYOR", yeniOdendi: false, hataMesaji: "Ödeme banka incelemesinde." };
  if (fraud !== 1) {
    await basarisizYaz(deneme.id, y, "Ödeme güvenlik incelemesinde reddedildi.");
    return { orderId: deneme.webOrderId, durum: "BASARISIZ", yeniOdendi: false, hataMesaji: "Ödeme alınamadı." };
  }

  // Tutar ve kimlik doğrulaması — kuruş bazında, sipariş kalemlerinden YENİDEN hesaplanan tutara karşı.
  const order = await prisma.webOrder.findUnique({ where: { id: deneme.webOrderId }, include: { items: { select: { lineTotalCents: true } } } });
  const yenidenHesap = order ? order.items.reduce((t, i) => t + i.lineTotalCents, 0) + order.shippingCents : null;
  const fiyat = tutardanKurus(y.price);
  const odenen = tutardanKurus(y.paidPrice);
  const paymentId = y.paymentId ? String(y.paymentId) : null;
  const kalemIslemleri: KalemIslemi[] = Array.isArray(y.itemTransactions)
    ? (y.itemTransactions as Record<string, unknown>[])
        .filter((t) => t.paymentTransactionId)
        .map((t) => ({ paymentTransactionId: String(t.paymentTransactionId), paidPriceCents: tutardanKurus(t.paidPrice) ?? 0 }))
    : [];
  const sorunlar: string[] = [];
  if (!order) sorunlar.push("sipariş bulunamadı");
  if (String(y.basketId ?? "") !== deneme.webOrderId) sorunlar.push(`sepet no farklı (${String(y.basketId ?? "-")})`);
  if (String(y.currency ?? "") !== "TRY") sorunlar.push(`para birimi ${String(y.currency ?? "-")}`);
  if (yenidenHesap === null || yenidenHesap !== deneme.beklenenTutarCents || (order && order.totalCents !== yenidenHesap)) {
    sorunlar.push(`sipariş tutarı değişmiş (oturumda ${formatTl(deneme.beklenenTutarCents)}, şimdi ${yenidenHesap === null ? "-" : formatTl(yenidenHesap)})`);
  }
  if (fiyat !== deneme.beklenenTutarCents || odenen !== deneme.beklenenTutarCents) {
    sorunlar.push(`iyzico tutarı ${odenen === null ? "-" : formatTl(odenen)} (sepet ${fiyat === null ? "-" : formatTl(fiyat)}), beklenen ${formatTl(deneme.beklenenTutarCents)}`);
  }

  const simdi = new Date();
  if (sorunlar.length > 0) {
    const hata = `Tutar/kimlik uyuşmazlığı: ${sorunlar.join("; ")}`;
    const yazildi = await prisma.webOrderOdemeDenemesi.updateMany({
      where: { id: deneme.id, durum: { in: acikDurumlar } },
      data: {
        durum: "TUTAR_UYUSMAZ",
        iyzicoPaymentId: paymentId,
        odenenTutarCents: odenen,
        kalemIslemleri: kalemIslemleri as unknown as Prisma.InputJsonValue,
        hataKodu: "TUTAR_UYUSMAZ",
        hataMesaji: kisalt(hata),
        sonuclananAt: simdi,
      },
    });
    if (yazildi.count === 1) await yoneticiyeBildir(deneme.id, "Ödeme tutar uyuşmazlığı");
    return { orderId: deneme.webOrderId, durum: "TUTAR_UYUSMAZ", yeniOdendi: false, hataMesaji: "Ödemeniz doğrulanamadı; ekibimiz sizinle iletişime geçecek." };
  }

  // Başarılı: deneme ve sipariş tek transaction'da, ikisi de KOŞULLU (idempotent).
  const sonuc = await prisma.$transaction(async (tx) => {
    const d = await tx.webOrderOdemeDenemesi.updateMany({
      where: { id: deneme.id, durum: { in: acikDurumlar } },
      data: {
        durum: "BASARILI",
        iyzicoPaymentId: paymentId,
        odenenTutarCents: odenen,
        kalemIslemleri: kalemIslemleri as unknown as Prisma.InputJsonValue,
        hataKodu: null,
        hataMesaji: null,
        sonuclananAt: simdi,
      },
    });
    if (d.count !== 1) return "ZATEN" as const;
    const o = await tx.webOrder.updateMany({
      where: { id: deneme.webOrderId, status: "ODEME_BEKLIYOR", paidAt: null },
      data: { status: "ODENDI", paidAt: simdi, paymentProvider: "IYZICO", paymentRef: paymentId, iyzicoToken: token },
    });
    if (o.count !== 1) {
      // Para çekildi ama sipariş ödenebilir durumda değildi (iptal edilmiş ya da başka bir denemeyle zaten ödenmiş).
      await tx.webOrderOdemeDenemesi.update({
        where: { id: deneme.id },
        data: { hataKodu: "SIPARIS_UYGUN_DEGIL", hataMesaji: "Ödeme alındı ama sipariş ödenebilir durumda değildi (iptal edilmiş ya da zaten ödenmiş) — İADE GEREKLİ." },
      });
      return "SORUNLU" as const;
    }
    return "ODENDI" as const;
  });

  if (sonuc === "ZATEN") {
    const guncel = await prisma.webOrderOdemeDenemesi.findUnique({ where: { id: deneme.id } });
    const durum: OdemeSonucu["durum"] = guncel?.hataKodu === "SIPARIS_UYGUN_DEGIL" ? "SORUNLU" : guncel?.durum === "BASARILI" ? "ODENDI" : guncel?.durum === "BASLATILDI" ? "BEKLIYOR" : (guncel?.durum ?? "BILINMIYOR");
    return { orderId: deneme.webOrderId, durum, yeniOdendi: false };
  }
  if (sonuc === "SORUNLU") {
    await yoneticiyeBildir(deneme.id, "Ödeme alındı ama sipariş ödenebilir durumda değil");
    return { orderId: deneme.webOrderId, durum: "SORUNLU", yeniOdendi: false, hataMesaji: "Ödemeniz alındı ancak siparişiniz işlenemedi; ekibimiz sizinle iletişime geçecek." };
  }
  // Stok ödeme anında düşer (ayrı transaction — ödeme kaydı stoktan bağımsız kesinleşmiştir). Stok yetmezse ödeme geri
  // alınmaz: sipariş ODENDI kalır, stokYetersizAt işaretlenir, yöneticiye e-posta gider (iade kararı personelde).
  try {
    const stok = await odemeSonrasiStokDus(deneme.webOrderId, null);
    if (stok.durum === "YETERSIZ") await stokYetersizBildir(deneme.webOrderId, stok.urunler);
  } catch (error) {
    // Stok düşümü başarısız olsa da ödeme kaydı geçerli; "İşle" adımı bayrak boşsa stoğu yeniden dener.
    console.error("[iyzico] ödeme sonrası stok düşülemedi:", error instanceof Error ? error.message : error);
  }
  return { orderId: deneme.webOrderId, durum: "ODENDI", yeniOdendi: true };
}

// Kart ödemesi alındı ama Ana Depo'da e-ticarete satılabilir stok yetmedi — yöneticiye e-posta (sipariş başına bir kez:
// stokYetersizAt yalnız ödeme anında bir kez yazılır, bu fonksiyon yalnız o anda çağrılır).
async function stokYetersizBildir(orderId: string, urunler: string[]) {
  try {
    const no = orderNo(orderId);
    const icerik = renderEmail({
      subject: `⚠ Stok yetersiz — Sipariş #${no} ödendi ama stok düşülemedi`,
      preheader: `Sipariş #${no}: ödeme alındı, Ana Depo'da yeterli stok yok.`,
      heading: "Ödeme alındı, stok yetersiz",
      blocks: [
        { kind: "p", text: `Sipariş: #${no} (${orderId})` },
        { kind: "p", text: `Stoğu yetmeyen ürünler: ${urunler.join(", ")}` },
        { kind: "p", text: "Ödeme alındı ve sipariş \"ödendi\" durumunda; stok DÜŞÜLMEDİ, otomatik iade YAPILMADI. CRM › Online Mağaza › Siparişler'den: ürünü tedarik edip siparişi işleyin ya da siparişi iptal edip ödemeyi iade edin." },
      ],
    });
    const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    const girdi = { type: "ADMIN_STOCK_ALERT", ...icerik, relatedOrderId: orderId };
    if (!to) {
      await logSkippedEmail({ ...girdi, to: "-" }, "ADMIN_NOTIFICATION_EMAIL tanımlı değil.");
      return;
    }
    await sendEmail({ ...girdi, to });
  } catch (error) {
    console.error("[iyzico] stok uyarısı gönderilemedi:", error instanceof Error ? error.message : error);
  }
}

async function basarisizYaz(denemeId: string, y: IyzicoYanit, varsayilan: string) {
  await prisma.webOrderOdemeDenemesi.updateMany({
    where: { id: denemeId, durum: { in: ["BASLATILDI", "BASARISIZ"] } },
    data: {
      durum: "BASARISIZ",
      hataKodu: kisalt(y.errorCode),
      hataMesaji: kisalt(y.errorMessage) ?? varsayilan,
      iyzicoPaymentId: y.paymentId ? String(y.paymentId) : undefined,
      sonuclananAt: new Date(),
    },
  });
}

// Yöneticiye e-posta (ADMIN_NOTIFICATION_EMAIL) — deneme başına BİR kez (uyusmazlikBildirildiAt koşullu güncellemesi).
async function yoneticiyeBildir(denemeId: string, baslik: string) {
  const isaret = await prisma.webOrderOdemeDenemesi.updateMany({
    where: { id: denemeId, uyusmazlikBildirildiAt: null },
    data: { uyusmazlikBildirildiAt: new Date() },
  });
  if (isaret.count !== 1) return;
  try {
    const d = await prisma.webOrderOdemeDenemesi.findUnique({ where: { id: denemeId } });
    if (!d) return;
    const no = orderNo(d.webOrderId);
    const odemeNo = d.iyzicoPaymentId ?? "-";
    const icerik = renderEmail({
      subject: `⚠ ${baslik} — Sipariş #${no}, iyzico ödeme no ${odemeNo}`,
      preheader: `Sipariş #${no} ödendi olarak işaretlenmedi; kontrol gerekiyor.`,
      heading: baslik,
      blocks: [
        { kind: "p", text: `Sipariş: #${no} (${d.webOrderId})` },
        { kind: "p", text: `iyzico ödeme numarası: ${odemeNo}` },
        { kind: "p", text: `Beklenen tutar: ${formatTl(d.beklenenTutarCents)} · iyzico'nun bildirdiği: ${d.odenenTutarCents === null ? "-" : formatTl(d.odenenTutarCents)}` },
        { kind: "p", text: `Ayrıntı: ${d.hataMesaji ?? "-"}` },
        { kind: "p", text: "Sipariş ödendi olarak işaretlenmedi. Para çekilmiş olabilir: CRM › Online Mağaza › Siparişler'den kontrol edip gerekiyorsa iade edin." },
      ],
    });
    const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    const girdi = { type: "ADMIN_PAYMENT_ALERT", ...icerik, relatedOrderId: d.webOrderId };
    if (!to) {
      await logSkippedEmail({ ...girdi, to: "-" }, "ADMIN_NOTIFICATION_EMAIL tanımlı değil.");
      return;
    }
    await sendEmail({ ...girdi, to });
  } catch (error) {
    console.error("[iyzico] yönetici bildirimi gönderilemedi:", error instanceof Error ? error.message : error);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Takılı ödemeler — zamanlanmış görev YOK; CRM'deki butondan ya da sipariş sayfası açılınca çalışır.
// ---------------------------------------------------------------------------------------------------------------------

export type TakiliKontrolSatiri = { orderId: string; referans: string; durum: OdemeSonucu["durum"]; yeniOdendi: boolean; hataMesaji?: string | null };

export async function takiliOdemeleriKontrolEt(enAzDakika = 30, enFazla = 50): Promise<TakiliKontrolSatiri[]> {
  const sinir = new Date(Date.now() - enAzDakika * 60_000);
  const denemeler = await prisma.webOrderOdemeDenemesi.findMany({
    where: { durum: "BASLATILDI", createdAt: { lt: sinir } },
    orderBy: { createdAt: "asc" },
    take: enFazla,
    select: { id: true, token: true, referans: true, webOrderId: true },
  });
  const sonuc: TakiliKontrolSatiri[] = [];
  for (const d of denemeler) {
    if (!d.token) {
      await prisma.webOrderOdemeDenemesi.updateMany({
        where: { id: d.id, durum: "BASLATILDI" },
        data: { durum: "BASARISIZ", hataMesaji: "Ödeme oturumu açılamadı.", sonuclananAt: new Date() },
      });
      sonuc.push({ orderId: d.webOrderId, referans: d.referans, durum: "BASARISIZ", yeniOdendi: false, hataMesaji: "Ödeme oturumu açılamadı." });
      continue;
    }
    const r = await odemeSonucuIsle(d.token);
    sonuc.push({ orderId: d.webOrderId, referans: d.referans, durum: r.durum, yeniOdendi: r.yeniOdendi, hataMesaji: r.hataMesaji });
  }
  return sonuc;
}

// ---------------------------------------------------------------------------------------------------------------------
// İptal / iade (CRM): ödeme bugünse (TR) iptal, önceki günlerdeyse kalem bazında tam iade.
// ---------------------------------------------------------------------------------------------------------------------

export type IadeSonucu = { ok: true; tur: "IPTAL" | "IADE" | "GEREKMEZ"; ref: string | null } | { ok: false; hata: string };

function trGunu(d: Date): string {
  return new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 10);
}

export async function siparisOdemesiniIadeEt(orderId: string, ip: string): Promise<IadeSonucu> {
  const order = await prisma.webOrder.findUnique({ where: { id: orderId }, select: { paymentMethod: true, paidAt: true } });
  if (!order) return { ok: false, hata: "Sipariş bulunamadı." };
  if (order.paymentMethod !== "KART" || !order.paidAt) return { ok: true, tur: "GEREKMEZ", ref: null };
  if (!iyzicoYapilandirildi()) return { ok: false, hata: "iyzico yapılandırılmamış; iade yapılamıyor, sipariş iptal edilmedi." };

  const deneme = await prisma.webOrderOdemeDenemesi.findFirst({ where: { webOrderId: orderId, durum: "BASARILI" }, orderBy: { denemeNo: "desc" } });
  if (!deneme || !deneme.iyzicoPaymentId) return { ok: false, hata: "Ödeme kaydı bulunamadı; iade yapılamadı, sipariş iptal edilmedi." };
  if (deneme.iadeAt) return { ok: true, tur: (deneme.iadeTuru as "IPTAL" | "IADE") ?? "IADE", ref: deneme.iadeRef };

  // Kilit: aynı anda iki iptal isteği iki kez iade etmesin.
  const kilit = await prisma.webOrderOdemeDenemesi.updateMany({
    where: { id: deneme.id, iadeAt: null, OR: [{ iadeTuru: null }, { iadeTuru: "HATA" }] },
    data: { iadeTuru: "ISLENIYOR" },
  });
  if (kilit.count !== 1) return { ok: false, hata: "Bu siparişin iadesi şu an işleniyor. Birkaç saniye sonra sayfayı yenileyin." };

  const kilidiAc = (hata: string) =>
    prisma.webOrderOdemeDenemesi.update({ where: { id: deneme.id }, data: { iadeTuru: "HATA", hataMesaji: kisalt(`İade hatası: ${hata}`) } });

  try {
    const kalemler = (Array.isArray(deneme.kalemIslemleri) ? deneme.kalemIslemleri : []) as unknown as KalemIslemi[];
    const hicIadeYok = kalemler.every((k) => !k.iadeEdildi);
    if (hicIadeYok && trGunu(order.paidAt) === trGunu(new Date())) {
      const y = await iyzicoIstek(IYZICO_YOLLARI.iptal, { locale: "tr", conversationId: `${deneme.referans}-iptal`, paymentId: deneme.iyzicoPaymentId, ip });
      if (y.status !== "success") {
        const hata = `${y.errorMessage ?? "iyzico iptali başarısız."}${y.errorCode ? ` (kod ${y.errorCode})` : ""}`;
        await kilidiAc(hata);
        return { ok: false, hata: `iyzico iptali başarısız: ${hata} Sipariş iptal edilmedi.` };
      }
      const ref = String(y.paymentId ?? deneme.iyzicoPaymentId);
      await prisma.webOrderOdemeDenemesi.update({ where: { id: deneme.id }, data: { iadeTuru: "IPTAL", iadeRef: ref, iadeAt: new Date(), hataMesaji: null } });
      return { ok: true, tur: "IPTAL", ref };
    }

    if (kalemler.length === 0) {
      await kilidiAc("ödeme kalemleri kayıtlı değil");
      return { ok: false, hata: "Ödeme kalemleri kayıtlı değil; iade yapılamadı, sipariş iptal edilmedi." };
    }
    for (const k of kalemler) {
      if (k.iadeEdildi || k.paidPriceCents <= 0) continue;
      const y = await iyzicoIstek(IYZICO_YOLLARI.iade, {
        locale: "tr",
        conversationId: `${deneme.referans}-iade-${k.paymentTransactionId}`,
        paymentTransactionId: k.paymentTransactionId,
        price: kurustanTutar(k.paidPriceCents),
        currency: "TRY",
        ip,
      });
      if (y.status !== "success") {
        await prisma.webOrderOdemeDenemesi.update({ where: { id: deneme.id }, data: { kalemIslemleri: kalemler as unknown as Prisma.InputJsonValue } });
        const hata = `${y.errorMessage ?? "iyzico iadesi başarısız."}${y.errorCode ? ` (kod ${y.errorCode})` : ""}`;
        await kilidiAc(hata);
        const yapilan = kalemler.filter((x) => x.iadeEdildi).length;
        return {
          ok: false,
          hata: `iyzico iadesi başarısız: ${hata}${yapilan > 0 ? ` (${yapilan}/${kalemler.length} kalem iade edildi; tekrar denediğinizde kalanlar iade edilir)` : ""} Sipariş iptal edilmedi.`,
        };
      }
      k.iadeEdildi = true;
      k.iadeRef = String(y.paymentTransactionId ?? y.paymentId ?? "");
    }
    const ref = kalemler.map((k) => k.iadeRef).filter(Boolean).join(",");
    await prisma.webOrderOdemeDenemesi.update({
      where: { id: deneme.id },
      // Önceki yarım kalmış denemenin hata metni temizlenir (iade tamamlandı).
      data: { kalemIslemleri: kalemler as unknown as Prisma.InputJsonValue, iadeTuru: "IADE", iadeRef: kisalt(ref), iadeAt: new Date(), hataMesaji: null },
    });
    return { ok: true, tur: "IADE", ref };
  } catch (e) {
    await kilidiAc(e instanceof Error ? e.message : "beklenmeyen hata");
    return { ok: false, hata: "İade sırasında beklenmeyen bir hata oluştu; sipariş iptal edilmedi." };
  }
}
