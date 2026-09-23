// Grup 5 — storefront tarafında tetiklenen e-postalar: müşteriye "sipariş
// alındı"; yöneticiye "yeni sipariş" ve "yeni üyelik başvurusu".
// (Ödeme onayı / kargo / teslim / iptal / üyelik onayı magaza-crm tarafında.)
//
// Yönetici bildirimleri TEK sabit adrese gider ve adres koda gömülü değil:
//   ADMIN_NOTIFICATION_EMAIL  — yönetici bildirim adresi (yoksa yönetici
//                               e-postaları atlanır ve EmailLog'a SKIPPED yazılır)
//   CRM_URL                   — opsiyonel; varsa e-postadaki "CRM'de aç"
//                               butonu için CRM'in kök adresi (tahmin edilmez)
//
// Her `notify*` fonksiyonu DB yazımı başarıyla bittikten SONRA
// `runAfterResponse` içinden çağrılır ve her hatayı yutar — sipariş/kayıt
// akışını asla etkilemez.
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSkippedEmail, sendEmail, type SendEmailInput } from "./send";
import { formatTl, orderNo, renderEmail, storefrontUrl, type EmailBlock } from "./render";
import { RESET_TOKEN_TTL_MINUTES, VERIFY_TOKEN_TTL_HOURS } from "@/lib/passwordPolicy";
import { emailVerificationEnabled } from "@/lib/featureFlags";

const PAYMENT_LABELS: Record<string, string> = {
  KART: "Kredi/Banka Kartı",
  HAVALE: "Havale/EFT",
  CARI_HESAP: "Cari Hesap",
};

export function runAfterResponse(label: string, task: () => Promise<unknown>) {
  const safeTask = async () => {
    try {
      await task();
    } catch (error) {
      console.error(`[email] ${label} hazırlanırken hata:`, error);
    }
  };
  try {
    after(safeTask);
  } catch {
    // İstek bağlamı dışında çağrılırsa (ör. bir script) doğrudan çalıştır.
    void safeTask();
  }
}

function crmLink(path: string, label: string): EmailBlock[] {
  const base = process.env.CRM_URL?.replace(/\/+$/, "");
  return base ? [{ kind: "button", label, url: `${base}${path}` }] : [];
}

async function sendToAdmin(input: Omit<SendEmailInput, "to">) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (!to) {
    await logSkippedEmail({ ...input, to: "-" }, "ADMIN_NOTIFICATION_EMAIL tanımlı değil.");
    return;
  }
  await sendEmail({ ...input, to });
}

export async function notifyOrderPlaced(orderId: string) {
  const order = await prisma.webOrder.findUnique({
    where: { id: orderId },
    include: { items: true, webCustomer: { include: { firma: { select: { unvan: true } } } } },
  });
  if (!order) return;

  const no = orderNo(order.id);
  const customerEmail = order.webCustomer?.email ?? order.guestEmail;
  const customerName = order.webCustomer?.name ?? order.guestName ?? "";
  const customerPhone = order.webCustomer?.phone ?? order.guestPhone ?? "";
  const address = [order.shippingLine1, order.shippingLine2, `${order.shippingIlce}/${order.shippingIl}`]
    .filter(Boolean)
    .join(", ");
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;

  const summary: Array<[string, string]> = [];
  if (order.shippingCents > 0) {
    summary.push(["Ara toplam", formatTl(order.subtotalCents)], ["Kargo", formatTl(order.shippingCents)]);
  }
  summary.push(["Toplam", formatTl(order.totalCents)]);
  const itemsBlock: EmailBlock = {
    kind: "items",
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, totalCents: i.lineTotalCents })),
    summary,
  };

  // Müşteriye — ödeme yöntemine göre gerçekçi bir sonraki adım. KART/HAVALE
  // için sipariş sayfasıyla aynı söz: ödeme onayı için ekip iletişime geçer.
  if (customerEmail) {
    const nextStep =
      order.paymentMethod === "CARI_HESAP"
        ? "Siparişiniz onaylandığında cari hesabınıza işlenecek ve size ayrıca bilgi vereceğiz."
        : "Ödeme onayı için ekibimiz sizinle iletişime geçecek. Ödemeniz onaylandığında size ayrıca bilgi vereceğiz.";
    const content = renderEmail({
      subject: `Siparişiniz alındı — #${no}`,
      preheader: `#${no} numaralı siparişinizi aldık.`,
      heading: "Siparişiniz alındı",
      blocks: [
        { kind: "p", text: customerName ? `Merhaba ${customerName},` : "Merhaba," },
        { kind: "p", text: `#${no} numaralı siparişinizi aldık, teşekkür ederiz. ${nextStep}` },
        itemsBlock,
        {
          kind: "kv",
          rows: [
            ["Sipariş No", `#${no}`],
            ["Ödeme yöntemi", paymentLabel],
            ["Teslimat adresi", address],
          ],
        },
      ],
    });
    await sendEmail({ type: "ORDER_PLACED", to: customerEmail, ...content, relatedOrderId: order.id });
  }

  // Yöneticiye — hazırlık için gereken her şey tek e-postada.
  const adminRows: Array<[string, string]> = [
    ["Sipariş No", `#${no}`],
    ["Müşteri", customerName || "-"],
    ["E-posta", customerEmail || "-"],
    ["Telefon", customerPhone || "-"],
    ["Üyelik", order.webCustomer?.firma ? `Kurumsal üye — ${order.webCustomer.firma.unvan}` : order.webCustomer ? "Bireysel üye" : "Misafir"],
    ["Ödeme yöntemi", paymentLabel],
    ["Teslimat adresi", address],
  ];
  if (order.sameDayShipping) adminRows.push(["Kargo", "Aynı gün kargo kesimi içinde (13:30 öncesi)"]);
  const adminContent = renderEmail({
    subject: `Yeni sipariş — #${no} — ${formatTl(order.totalCents)}`,
    preheader: `${customerName || "Bir müşteri"} yeni bir sipariş verdi.`,
    heading: "Yeni sipariş alındı",
    blocks: [
      { kind: "kv", rows: adminRows },
      itemsBlock,
      ...crmLink(`/online-magaza/siparisler/${order.id}`, "Siparişi CRM'de aç"),
    ],
  });
  await sendToAdmin({ type: "ADMIN_NEW_ORDER", ...adminContent, relatedOrderId: order.id });
}

export async function notifyNewMembershipApplication(applicationId: string) {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: applicationId },
    include: { webCustomer: { select: { name: true, email: true, phone: true } } },
  });
  if (!application) return;

  const rows: Array<[string, string]> = [
    ["Firma", application.unvan],
    ["VKN/TCKN", application.vkn || "-"],
    ["Vergi dairesi", application.vergiDairesi || "-"],
    ["Yetkili", application.webCustomer.name],
    ["E-posta", application.webCustomer.email],
    ["Telefon", application.telefon || application.webCustomer.phone || "-"],
    ["Adres", application.adres || "-"],
  ];
  if (application.aciklama) rows.push(["Açıklama", application.aciklama]);

  const content = renderEmail({
    subject: `Yeni üyelik başvurusu — ${application.unvan}`,
    preheader: `${application.unvan} kurumsal üyelik için başvurdu.`,
    heading: "Yeni üyelik başvurusu",
    blocks: [
      { kind: "kv", rows },
      ...crmLink("/online-magaza/uyelik-basvurulari", "Başvuruları CRM'de aç"),
    ],
  });
  await sendToAdmin({ type: "ADMIN_NEW_APPLICATION", ...content, relatedApplicationId: application.id });
}

// Şifre sıfırlama bağlantısı. Ham token yalnızca bu e-postada yaşar (veritabanında özeti var); EmailLog'a
// bağlantı/gövde YAZILMAZ (sendEmail yalnız alıcı, konu ve durum kaydeder).
export async function notifyPasswordReset(webCustomerId: string, token: string) {
  const customer = await prisma.webCustomer.findUnique({
    where: { id: webCustomerId },
    select: { email: true, name: true },
  });
  if (!customer) return;

  const url = `${storefrontUrl()}/uyelik/sifre-sifirla?token=${encodeURIComponent(token)}`;
  const content = renderEmail({
    subject: "Şifre sıfırlama bağlantınız",
    preheader: "Şifrenizi sıfırlamak için bağlantıya tıklayın.",
    heading: "Şifrenizi sıfırlayın",
    blocks: [
      { kind: "p", text: customer.name ? `Merhaba ${customer.name},` : "Merhaba," },
      {
        kind: "p",
        text: `Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki düğmeyle yeni şifrenizi belirleyebilirsiniz. Bağlantı ${RESET_TOKEN_TTL_MINUTES} dakika geçerlidir ve yalnızca bir kez kullanılabilir.`,
      },
      { kind: "button", label: "Şifremi sıfırla", url },
      {
        kind: "p",
        text: "Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz; şifreniz değişmez.",
      },
    ],
  });
  await sendEmail({ type: "PASSWORD_RESET", to: customer.email, ...content });
}

// Şifre değiştirildikten sonra bilgilendirme — hesabı kim değiştirdiyse müşteri fark edebilsin.
export async function notifyPasswordChanged(webCustomerId: string) {
  const customer = await prisma.webCustomer.findUnique({
    where: { id: webCustomerId },
    select: { email: true, name: true },
  });
  if (!customer) return;

  const content = renderEmail({
    subject: "Şifreniz değiştirildi",
    preheader: "Hesabınızın şifresi değiştirildi.",
    heading: "Şifreniz değiştirildi",
    blocks: [
      { kind: "p", text: customer.name ? `Merhaba ${customer.name},` : "Merhaba," },
      {
        kind: "p",
        text: "Hesabınızın şifresi az önce değiştirildi ve açık oturumlarınız kapatıldı. Bu işlemi siz yapmadıysanız lütfen bizimle hemen iletişime geçin.",
      },
    ],
  });
  await sendEmail({ type: "PASSWORD_CHANGED", to: customer.email, ...content });
}

// E-posta doğrulama bağlantısı (yumuşak doğrulama — siparişi/girişi engellemez). Ham token yalnız bu e-postada yaşar.
export async function notifyEmailVerification(webCustomerId: string, token: string) {
  if (!emailVerificationEnabled()) return; // özellik kapalıyken hiçbir yoldan doğrulama e-postası gitmez
  const customer = await prisma.webCustomer.findUnique({
    where: { id: webCustomerId },
    select: { email: true, name: true, emailVerifiedAt: true },
  });
  if (!customer || customer.emailVerifiedAt) return;

  const url = `${storefrontUrl()}/uyelik/eposta-dogrula?token=${encodeURIComponent(token)}`;
  const content = renderEmail({
    subject: "E-posta adresinizi doğrulayın",
    preheader: "Hesabınızın e-posta adresini doğrulamak için bağlantıya tıklayın.",
    heading: "E-posta adresinizi doğrulayın",
    blocks: [
      { kind: "p", text: customer.name ? `Merhaba ${customer.name},` : "Merhaba," },
      {
        kind: "p",
        text: `Tedarikhane hesabınızın e-posta adresini doğrulamak için aşağıdaki düğmeye tıklayın. Bağlantı ${VERIFY_TOKEN_TTL_HOURS} saat geçerlidir. Doğrulama yapmasanız da alışveriş yapabilirsiniz.`,
      },
      { kind: "button", label: "E-postamı doğrula", url },
      { kind: "p", text: "Bu hesabı siz açmadıysanız bu e-postayı görmezden gelebilirsiniz." },
    ],
  });
  await sendEmail({ type: "EMAIL_VERIFICATION", to: customer.email, ...content });
}

// Hesabım › Firma Bilgilerim — onaylı üyenin firma bilgisi değişiklik talebi (yöneticiye).
const FIRMA_ALAN_ETIKET: Record<string, string> = {
  unvan: "Unvan",
  vkn: "VKN/TCKN",
  vergiDairesi: "Vergi dairesi",
  faturaAdresi: "Fatura adresi",
};

export async function notifyFirmaBilgiTalebi(talepId: string) {
  const talep = await prisma.firmaBilgiTalebi.findUnique({
    where: { id: talepId },
    include: { firma: { select: { unvan: true } }, webCustomer: { select: { name: true, email: true } } },
  });
  if (!talep) return;
  const istenen = (talep.istenen ?? {}) as Record<string, string>;
  const mevcut = (talep.mevcut ?? {}) as Record<string, string | null>;
  const rows: Array<[string, string]> = [
    ["Firma", talep.firma.unvan],
    ["Talep eden", `${talep.webCustomer.name} (${talep.webCustomer.email})`],
    ...Object.keys(istenen).map((k): [string, string] => [FIRMA_ALAN_ETIKET[k] ?? k, `${mevcut[k] || "—"} → ${istenen[k] || "—"}`]),
  ];
  if (talep.musteriNotu) rows.push(["Not", talep.musteriNotu]);
  const content = renderEmail({
    subject: `Firma bilgisi değişiklik talebi — ${talep.firma.unvan}`,
    preheader: `${talep.firma.unvan} firma bilgilerinde değişiklik istedi.`,
    heading: "Firma bilgisi değişiklik talebi",
    blocks: [{ kind: "kv", rows }, ...crmLink("/online-magaza/firma-talepleri", "Talebi CRM'de incele")],
  });
  await sendToAdmin({ type: "ADMIN_FIRMA_BILGI_TALEBI", ...content });
}

// E-posta değişikliği — onay bağlantısı YENİ adrese gider. Ham token yalnız bu e-postada yaşar.
export async function notifyEmailChangeRequest(webCustomerId: string, newEmail: string, token: string) {
  const customer = await prisma.webCustomer.findUnique({ where: { id: webCustomerId }, select: { name: true } });
  if (!customer) return;
  const url = `${storefrontUrl()}/hesabim/eposta-onay?token=${encodeURIComponent(token)}`;
  const content = renderEmail({
    subject: "Yeni e-posta adresinizi onaylayın",
    preheader: "Tedarikhane hesabınızın e-posta adresini değiştirmek için onay bağlantısı.",
    heading: "Yeni e-posta adresinizi onaylayın",
    blocks: [
      { kind: "p", text: customer.name ? `Merhaba ${customer.name},` : "Merhaba," },
      {
        kind: "p",
        text: `Tedarikhane hesabınızın e-posta adresini bu adresle değiştirmek istediniz. Değişikliği tamamlamak için aşağıdaki düğmeye tıklayın. Bağlantı ${VERIFY_TOKEN_TTL_HOURS} saat geçerlidir.`,
      },
      { kind: "button", label: "E-posta adresimi değiştir", url },
      { kind: "p", text: "Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz; hesabınızda bir değişiklik olmaz." },
    ],
  });
  await sendEmail({ type: "EMAIL_CHANGE_REQUEST", to: newEmail, ...content });
}

// E-posta değiştikten sonra ESKİ adrese bilgilendirme — hesabı kim değiştirdiyse sahibi fark edebilsin.
export async function notifyEmailChanged(oldEmail: string, name: string, newEmail: string) {
  const masked = newEmail.replace(/^(.{2}).*(@.*)$/, "$1***$2");
  const content = renderEmail({
    subject: "Hesabınızın e-posta adresi değiştirildi",
    preheader: "Tedarikhane hesabınızın e-posta adresi değiştirildi.",
    heading: "E-posta adresiniz değiştirildi",
    blocks: [
      { kind: "p", text: name ? `Merhaba ${name},` : "Merhaba," },
      {
        kind: "p",
        text: `Tedarikhane hesabınızın e-posta adresi ${masked} olarak değiştirildi. Bundan sonra bu adrese e-posta gelmeyecek. Bu işlemi siz yapmadıysanız lütfen bizimle hemen iletişime geçin.`,
      },
    ],
  });
  await sendEmail({ type: "EMAIL_CHANGED", to: oldEmail, ...content });
}
