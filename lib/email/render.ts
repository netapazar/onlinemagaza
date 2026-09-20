// Grup 5 — e-posta şablon iskeleti. magaza-crm ve magaza-online'da BİREBİR AYNI
// dosya (repolar arası paylaşılan paket yok, mevcut proje kuralı) — birinde
// değişiklik yapılırsa diğerine de elle taşınmalı.
//
// Neden React Email değil, düz string şablon: e-postalar birkaç blok
// (paragraf / anahtar-değer / ürün tablosu / buton) — ek bir bağımlılık ve
// server-bundle riski taşımaya değmez. Yine de e-posta istemcileri için
// gereken şeyler burada elle uygulanıyor: tablo tabanlı yerleşim, inline
// stil, web font YOK (Gmail/Outlook yüklemez), logo görseli yerine metin
// wordmark (görseller varsayılan olarak engelleniyor), düz metin alternatifi.

const BRAND = "#0E6B6B";
const NIGHT = "#16181D";
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type EmailBlock =
  | { kind: "p"; text: string }
  | { kind: "kv"; rows: Array<[string, string]> }
  | {
      kind: "items";
      items: Array<{ name: string; quantity: number; totalCents: number }>;
      summary: Array<[string, string]>;
    }
  | { kind: "button"; label: string; url: string };

export type EmailContent = {
  subject: string;
  // Gelen kutusu listesinde konunun yanında görünen kısa önizleme.
  preheader: string;
  heading: string;
  blocks: EmailBlock[];
};

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatTl(cents: number): string {
  return `${(cents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

// Mevcut sipariş numarası kuralı (siparis-alindi sayfası, CRM sipariş
// ekranı): cuid'in son 8 karakteri, büyük harf.
export function orderNo(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

export function storefrontUrl(): string {
  return (process.env.STOREFRONT_URL || "https://tedarikhane.com").replace(/\/+$/, "");
}

// Sadece http(s) — buton URL'si e-postaya inline yazıldığı için.
function safeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : "#";
}

function renderBlockHtml(block: EmailBlock): string {
  switch (block.kind) {
    case "p":
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NIGHT};">${esc(block.text)}</p>`;

    case "kv":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#F3F7F7;border-radius:8px;">${block.rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:8px 14px;font-size:13px;color:#5B6470;width:38%;vertical-align:top;">${esc(label)}</td>` +
            `<td style="padding:8px 14px;font-size:14px;color:${NIGHT};font-weight:600;vertical-align:top;">${esc(value)}</td></tr>`
        )
        .join("")}</table>`;

    case "items":
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-top:1px solid #E3E8E8;">` +
        block.items
          .map(
            (it) =>
              `<tr><td style="padding:10px 0;border-bottom:1px solid #E3E8E8;font-size:14px;color:${NIGHT};">${esc(it.name)} <span style="color:#5B6470;">× ${it.quantity}</span></td>` +
              `<td align="right" style="padding:10px 0 10px 12px;border-bottom:1px solid #E3E8E8;font-size:14px;color:${NIGHT};white-space:nowrap;">${esc(formatTl(it.totalCents))}</td></tr>`
          )
          .join("") +
        block.summary
          .map(
            ([label, value], i) =>
              `<tr><td style="padding:${i === 0 ? "12px" : "4px"} 0 4px;font-size:${i === block.summary.length - 1 ? "16px" : "13px"};color:${NIGHT};font-weight:${i === block.summary.length - 1 ? "700" : "400"};">${esc(label)}</td>` +
              `<td align="right" style="padding:${i === 0 ? "12px" : "4px"} 0 4px 12px;font-size:${i === block.summary.length - 1 ? "16px" : "13px"};color:${NIGHT};font-weight:${i === block.summary.length - 1 ? "700" : "400"};white-space:nowrap;">${esc(value)}</td></tr>`
          )
          .join("") +
        `</table>`
      );

    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="background:${BRAND};border-radius:8px;"><a href="${esc(safeUrl(block.url))}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${FONT};">${esc(block.label)}</a></td></tr></table>`;
  }
}

function renderBlockText(block: EmailBlock): string {
  switch (block.kind) {
    case "p":
      return block.text;
    case "kv":
      return block.rows.map(([l, v]) => `${l}: ${v}`).join("\n");
    case "items":
      return [
        ...block.items.map((it) => `- ${it.name} × ${it.quantity} — ${formatTl(it.totalCents)}`),
        ...block.summary.map(([l, v]) => `${l}: ${v}`),
      ].join("\n");
    case "button":
      return `${block.label}: ${block.url}`;
  }
}

export function renderEmail(content: EmailContent): { subject: string; html: string; text: string } {
  const html =
    `<!doctype html><html lang="tr"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">` +
    `<title>${esc(content.subject)}</title></head>` +
    `<body style="margin:0;padding:0;background:#EEF2F2;font-family:${FONT};">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(content.preheader)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">` +
    `<tr><td style="background:${BRAND};padding:20px 24px;border-radius:12px 12px 0 0;font-size:22px;font-weight:700;letter-spacing:.3px;color:#ffffff;font-family:${FONT};">Tedarikhane</td></tr>` +
    `<tr><td style="background:#ffffff;padding:28px 24px 12px;font-family:${FONT};">` +
    `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${NIGHT};">${esc(content.heading)}</h1>` +
    content.blocks.map(renderBlockHtml).join("") +
    `</td></tr>` +
    `<tr><td style="background:#ffffff;padding:0 24px 24px;border-radius:0 0 12px 12px;font-family:${FONT};">` +
    `<p style="margin:0;padding-top:16px;border-top:1px solid #E3E8E8;font-size:12px;line-height:1.5;color:#7A838E;">Bu e-posta, Tedarikhane üzerindeki işleminiz nedeniyle otomatik olarak gönderilmiştir.</p>` +
    `</td></tr></table></td></tr></table></body></html>`;

  const text = [content.heading, ...content.blocks.map(renderBlockText), "Tedarikhane"].join("\n\n");

  return { subject: content.subject, html, text };
}
