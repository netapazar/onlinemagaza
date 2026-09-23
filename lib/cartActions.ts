"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnlineStoreId, getOnlineFiyatArtisOrani } from "@/lib/onlineStore";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import { getMembershipStatus } from "@/lib/membershipStatus";
import { getWebSession } from "@/lib/webSession";
import { resolvePrice, computeListPriceCents } from "@/lib/pricing";
import { SHIPPING_COST_CENTS, isBeforeShippingCutoff } from "@/lib/shipping";
import { notifyOrderPlaced, runAfterResponse } from "@/lib/email/notifications";
import { consumeIpRateLimit, RATE_LIMIT_MESSAGE, RULES } from "@/lib/rateLimit";
import { formatAddress, parseAddress } from "@/lib/addressCore";

export type CartItemInput = { productId: string; quantity: number };

export type MembershipKind = "guest" | "approved" | "pending" | "rejected" | "no_application";

// null — satın alınabilir. "STOCK" — stok bitmiş ama ürün hâlâ yayında
// (geçici, tekrar stok girilebilir). "NOT_FOR_SALE" — yayından kaldırılmış
// veya arşivlenmiş (kalıcı bir kaldırma, stok durumundan bağımsız). İkisi
// birden geçerliyse NOT_FOR_SALE önceliklidir — "yayından kaldırıldı" daha
// kesin/kalıcı bir durumu ifade eder.
export type CartUnavailableReason = "STOCK" | "NOT_FOR_SALE" | null;

export type CartLine = {
  productId: string;
  name: string;
  coverImageUrl: string | null;
  quantity: number;
  stock: number;
  unitPriceCents: number;
  lineTotalCents: number;
  // false — ürün bu store'da bulunuyor ama şu an satın alınamaz. Satır
  // sepetten SESSİZCE silinmiyor artık — kullanıcı nedene özel bir uyarıyla
  // (bkz. unavailableReason) görsün, siparişe dahil edilmesin. Gerçek kök
  // neden (2026-09-19'da canlıda doğrulandı): önceki sorgu showOnStorefront/
  // archivedAt'e göre filtrelediği için böyle bir ürün satırı hiç dönmüyordu
  // — sepette eklenmiş duruyordu (header rozeti doğru sayıyı gösteriyordu,
  // çünkü o saf localStorage'dan geliyor) ama /sepet ve mini-sepet boşmuş
  // gibi görünüyordu, rozet ile sayfa arasında tutarsızlık yaratıyordu.
  available: boolean;
  unavailableReason: CartUnavailableReason;
};

export async function getCartDetails(items: CartItemInput[]) {
  if (items.length === 0) {
    return {
      lines: [] as CartLine[],
      subtotalCents: 0,
      shippingCents: 0,
      totalCents: 0,
      membershipKind: null as MembershipKind | null,
    };
  }

  // Birbirinden bağımsız iki sorgu ayrı ayrı await ediliyordu (sıralı, toplam
  // gecikme ikisinin toplamıydı) — paralel çalıştırılınca sepet sayfasının/
  // çekmecesinin "Yükleniyor..." süresi gözle görülür şekilde kısalıyor.
  const [storeId, memberDiscountPercent, membershipStatus, markupPercent] = await Promise.all([
    getOnlineStoreId(),
    getMemberDiscountPercent(),
    getMembershipStatus(),
    getOnlineFiyatArtisOrani(),
  ]);

  // Kasıtlı olarak showOnStorefront/archivedAt'e göre FİLTRELENMİYOR — bir
  // ürün sepete eklendikten SONRA yayından kaldırılmış/arşivlenmiş/stoksuz
  // kalmış olabilir, bu durumda da satırı (uyarıyla) göstermemiz gerekiyor.
  // "Satın alınabilir mi" kararı aşağıda `available` alanıyla ayrıca veriliyor.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, storeId },
    include: { images: { where: { isCover: true }, take: 1 } },
  });

  const lines: CartLine[] = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    // Ürün bu store'da HİÇ bulunmuyor (gerçekten silinmiş) — gösterecek
    // hiçbir bilgi (isim/görsel) yok, bu tek durumda satır atlanıyor.
    // Nadir bir uç durum: proje genelinde ürünler silinmez, arşivlenir.
    if (!product) continue;
    const price = resolvePrice({ listPriceCents: computeListPriceCents(product, markupPercent) }, memberDiscountPercent);
    const notForSale = !product.showOnStorefront || Boolean(product.archivedAt);
    const outOfStock = product.stock <= 0;
    const unavailableReason: CartUnavailableReason = notForSale ? "NOT_FOR_SALE" : outOfStock ? "STOCK" : null;
    lines.push({
      productId: product.id,
      name: product.name,
      coverImageUrl: product.images[0]?.url ?? null,
      quantity: item.quantity,
      stock: product.stock,
      unitPriceCents: price.displayCents,
      lineTotalCents: price.displayCents * item.quantity,
      available: unavailableReason === null,
      unavailableReason,
    });
  }

  // Sadece satın alınabilir satırlar toplama giriyor — satın alınamayan bir
  // satırın fiyatı bilgi amaçlı gösteriliyor ama Ara Toplam'a eklenmiyor.
  const subtotalCents = lines.filter((l) => l.available).reduce((sum, l) => sum + l.lineTotalCents, 0);
  const shippingCents = lines.some((l) => l.available) ? SHIPPING_COST_CENTS : 0;
  // membershipKind: sepet sayfasındaki cari hesap tanıtım kutusu için (Grup 4) — yalnız durum türü,
  // firma bilgisi istemciye gitmez.
  return {
    lines,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    membershipKind: membershipStatus.kind as MembershipKind | null,
  };
}

export type CheckoutAddress = {
  id: string;
  title: string;
  recipientName: string;
  text: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

export async function getCheckoutEligibility() {
  const session = await getWebSession();
  if (!session) {
    return { loggedIn: false, name: "", email: "", phone: "", canUseCariHesap: false, addresses: [] as CheckoutAddress[], corporateUnvan: null as string | null };
  }
  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    include: {
      firma: { select: { onlineErisimAktif: true, onlineCariHesapAktif: true, unvan: true } },
      addresses: { orderBy: [{ isDefaultShipping: "desc" }, { updatedAt: "desc" }] },
    },
  });
  const addresses: CheckoutAddress[] = (customer?.addresses ?? []).map((a) => ({
    id: a.id,
    title: a.label || a.recipientName,
    recipientName: a.recipientName,
    text: formatAddress(a),
    isDefaultShipping: a.isDefaultShipping,
    isDefaultBilling: a.isDefaultBilling,
  }));
  return {
    loggedIn: true,
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    addresses,
    // Onaylı kurumsal üyede fatura firma kartından kesilir — ödemede fatura adresi sorulmaz.
    corporateUnvan: customer?.firma?.onlineErisimAktif ? customer.firma.unvan : null,
    // Grup 3: cari hesapla ödeme artık ayrı bir yetki (onlineCariHesapAktif) —
    // üyelik erişimi (iskonto) açık olsa bile bu kapalı olabilir.
    canUseCariHesap: Boolean(customer?.firma?.onlineErisimAktif && customer.firma.onlineCariHesapAktif),
  };
}

export type CreateOrderState = { error: string | null };

export async function createOrder(
  _prevState: CreateOrderState,
  formData: FormData
): Promise<CreateOrderState> {
  let items: CartItemInput[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Sepet verisi geçersiz." };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Sepetiniz boş." };
  }

  // getOnlineStoreId() session/webCustomer'dan bağımsız — aşağıdaki sıralı
  // await'lerle yarışacak şekilde en baştan başlatılıyor, gerçek kullanımı
  // (storeId) sadece aşağıda gerektiğinde await ediliyor. Sıralıydı, toplam
  // gecikme sıralı iki DB round-trip'in toplamıydı — bkz. getCartDetails'teki
  // aynı gerekçe.
  const storeIdPromise = getOnlineStoreId();
  const markupPercentPromise = getOnlineFiyatArtisOrani();

  const paymentMethodRaw = String(formData.get("paymentMethod") ?? "KART");
  const paymentMethod =
    paymentMethodRaw === "HAVALE" ? "HAVALE" : paymentMethodRaw === "CARI_HESAP" ? "CARI_HESAP" : "KART";

  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestEmail = String(formData.get("guestEmail") ?? "").trim();
  const guestPhone = String(formData.get("guestPhone") ?? "").trim();
  let shippingLine1 = String(formData.get("shippingLine1") ?? "").trim();
  let shippingLine2 = String(formData.get("shippingLine2") ?? "").trim();
  let shippingIl = String(formData.get("shippingIl") ?? "").trim();
  let shippingIlce = String(formData.get("shippingIlce") ?? "").trim();
  let shippingPostaKodu = String(formData.get("shippingPostaKodu") ?? "").trim();

  const session = await getWebSession();
  const webCustomer = session
    ? await prisma.webCustomer.findUnique({ where: { id: session.webCustomerId }, include: { firma: true } })
    : null;

  // Kayıtlı teslimat adresi seçildiyse adres SUNUCUDA, müşteriye ait olduğu doğrulanarak okunur
  // (istemcinin gönderdiği adres metnine güvenilmez).
  const shippingAddressId = String(formData.get("shippingAddressId") ?? "");
  if (webCustomer && shippingAddressId) {
    const saved = await prisma.webCustomerAddress.findFirst({ where: { id: shippingAddressId, webCustomerId: webCustomer.id } });
    if (!saved) return { error: "Seçilen teslimat adresi bulunamadı." };
    shippingLine1 = saved.line1;
    shippingLine2 = saved.line2 ?? "";
    shippingIl = saved.il;
    shippingIlce = saved.ilce;
    shippingPostaKodu = saved.postaKodu ?? "";
  }

  if (!shippingLine1 || !shippingIl || !shippingIlce) {
    return { error: "Teslimat adresi eksik." };
  }

  // Fatura adresi: kurumsal üyede firma kartından (sorulmaz). Diğerlerinde "teslimat ile aynı" varsayılan;
  // değilse kayıtlı bir adres ya da elle girilen adres (billing.* alanları).
  const corporate = Boolean(webCustomer?.firma?.onlineErisimAktif);
  const billingSame = corporate || formData.get("billingSameAsShipping") !== "off";
  let billing: { billingName: string; billingLine1: string; billingLine2: string | null; billingIl: string; billingIlce: string; billingPostaKodu: string | null } | null = null;
  if (!billingSame) {
    const billingAddressId = String(formData.get("billingAddressId") ?? "");
    if (webCustomer && billingAddressId) {
      const saved = await prisma.webCustomerAddress.findFirst({ where: { id: billingAddressId, webCustomerId: webCustomer.id } });
      if (!saved) return { error: "Seçilen fatura adresi bulunamadı." };
      billing = { billingName: saved.recipientName, billingLine1: saved.line1, billingLine2: saved.line2, billingIl: saved.il, billingIlce: saved.ilce, billingPostaKodu: saved.postaKodu };
    } else {
      const parsed = parseAddress((k) => formData.get(`billing.${k}`));
      if (!parsed.ok) return { error: `Fatura adresi: ${parsed.error}` };
      const b = parsed.value;
      billing = { billingName: b.recipientName, billingLine1: b.line1, billingLine2: b.line2, billingIl: b.il, billingIlce: b.ilce, billingPostaKodu: b.postaKodu };
    }
  }
  const saveShippingAddress = Boolean(webCustomer) && !shippingAddressId && formData.get("saveAddress") === "on";

  if (!webCustomer && (!guestName || !guestEmail || !guestPhone)) {
    return { error: "Ad, e-posta ve telefon gerekli." };
  }

  // Sunucu tarafında zorunlu kontrol — client'ın "CARI_HESAP" göndermesi
  // yetmez, gerçekten onaylı üye mi diye burada tekrar bakılıyor.
  if (
    paymentMethod === "CARI_HESAP" &&
    !(webCustomer?.firma?.onlineErisimAktif && webCustomer.firma.onlineCariHesapAktif)
  ) {
    return { error: "Cari hesapla ödeme sadece onaylı üyelere açıktır." };
  }

  const memberDiscountPercent = webCustomer?.firma?.onlineErisimAktif
    ? webCustomer.firma.onlineIskontoOrani ?? null
    : null;

  const [storeId, markupPercent] = await Promise.all([storeIdPromise, markupPercentPromise]);
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, storeId, showOnStorefront: true, archivedAt: null },
  });

  const outOfStock: string[] = [];
  const orderItemsData: {
    productId: string;
    barcode: string;
    name: string;
    unitPriceCents: number;
    unitCostCents: number;
    vatRate: number;
    quantity: number;
    lineTotalCents: number;
  }[] = [];
  let subtotalCents = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    if (item.quantity <= 0) continue;
    // Plan kararı: stok biterse satış engellenir (mağaza panelinin aksine) —
    // burada online sipariş, gerçek para/cari borcu doğuracağı için sessizce
    // taşırılmıyor.
    if (item.quantity > product.stock) {
      outOfStock.push(product.name);
      continue;
    }
    const price = resolvePrice({ listPriceCents: computeListPriceCents(product, markupPercent) }, memberDiscountPercent);
    const lineTotalCents = price.displayCents * item.quantity;
    subtotalCents += lineTotalCents;
    orderItemsData.push({
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      unitPriceCents: price.displayCents,
      unitCostCents: product.costPriceCents,
      vatRate: product.vatRate,
      quantity: item.quantity,
      lineTotalCents,
    });
  }

  if (outOfStock.length > 0) {
    return { error: `Şu ürünler stokta yok: ${outOfStock.join(", ")}` };
  }
  if (orderItemsData.length === 0) {
    return { error: "Sepetinizdeki ürünler artık mevcut değil." };
  }

  // Hız sınırı: tüm doğrulamalar geçti, sipariş yazılmak üzere — burada sayılır (doğrulama hataları hakkı tüketmez).
  if (!(await consumeIpRateLimit(RULES.ORDER_IP))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const shippingCents = SHIPPING_COST_CENTS;
  const totalCents = subtotalCents + shippingCents;

  const order = await prisma.webOrder.create({
    data: {
      webCustomerId: webCustomer?.id ?? null,
      guestName: webCustomer ? null : guestName,
      guestEmail: webCustomer ? null : guestEmail,
      guestPhone: webCustomer ? null : guestPhone,
      shippingLine1,
      shippingLine2: shippingLine2 || null,
      shippingIl,
      shippingIlce,
      shippingPostaKodu: shippingPostaKodu || null,
      billingSameAsShipping: billingSame,
      ...(billing ?? {}),
      subtotalCents,
      shippingCents,
      totalCents,
      paymentMethod,
      sameDayShipping: isBeforeShippingCutoff(),
      items: { create: orderItemsData },
    },
  });

  // E-posta (müşteriye "sipariş alındı" + yöneticiye "yeni sipariş") DB yazımı
  // bittikten sonra, yanıttan bağımsız çalışır — başarısız olsa bile sipariş etkilenmez.
  // "Bu adresi kaydet": sipariş yazıldıktan sonra adres defterine eklenir (başarısız olsa bile sipariş etkilenmez).
  if (saveShippingAddress && webCustomer) {
    try {
      const count = await prisma.webCustomerAddress.count({ where: { webCustomerId: webCustomer.id } });
      const duplicate = await prisma.webCustomerAddress.findFirst({
        where: { webCustomerId: webCustomer.id, line1: shippingLine1, il: shippingIl.toLocaleUpperCase("tr-TR"), ilce: shippingIlce.toLocaleUpperCase("tr-TR") },
        select: { id: true },
      });
      if (!duplicate && count < 20) {
        await prisma.webCustomerAddress.create({
          data: {
            webCustomerId: webCustomer.id,
            recipientName: webCustomer.name,
            phone: webCustomer.phone,
            line1: shippingLine1,
            line2: shippingLine2 || null,
            il: shippingIl.toLocaleUpperCase("tr-TR"),
            ilce: shippingIlce.toLocaleUpperCase("tr-TR"),
            postaKodu: shippingPostaKodu || null,
            isDefaultShipping: count === 0,
            isDefaultBilling: count === 0,
          },
        });
      }
    } catch (error) {
      console.error("[checkout] adres kaydedilemedi:", error);
    }
  }

  runAfterResponse("ORDER_PLACED", () => notifyOrderPlaced(order.id));

  redirect(`/siparis-alindi/${order.id}`);
}
