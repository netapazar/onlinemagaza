// Kargo firması ve ücret tarifesi henüz netleşmedi (plan: "şartlara göre
// şekillenecek"), sadece ücretsiz kargo eşiği olacağı biliniyor — o yüzden
// şimdilik kargo ücretsiz kabul ediliyor. Gerçek tarife/eşik netleşince bu
// dosya güncellenmeli, bir fiyat uydurulmadı.
export const SHIPPING_COST_CENTS = 0;

// 13:30 kesim saati — Türkiye sabit UTC+3 kullanıyor (2016'dan beri DST yok),
// bu yüzden sunucunun kendi saat dilimi ne olursa olsun (Vercel genelde UTC)
// doğrudan UTC'den +3 ekleyerek hesaplamak güvenli. magaza-crm'in
// toLocalIsoDate dersiyle aynı gerekçe: sunucu yerel saatine güvenme.
export function isBeforeShippingCutoff(now: Date = new Date()): boolean {
  const turkeyHour = (now.getUTCHours() + 3) % 24;
  const turkeyMinutes = now.getUTCMinutes();
  return turkeyHour < 13 || (turkeyHour === 13 && turkeyMinutes < 30);
}
