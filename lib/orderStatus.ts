// Müşteriye gösterilen sipariş durumu etiketleri (Hesabım › Siparişlerim). Dahili durum adları müşteriye
// olduğu gibi gösterilmez.
export const ORDER_STATUS_LABEL: Record<string, string> = {
  ODEME_BEKLIYOR: "Ödeme onayı bekleniyor",
  ODENDI: "Ödendi",
  HAZIRLANIYOR: "Hazırlanıyor",
  KARGOYA_VERILDI: "Kargoya verildi",
  TESLIM_EDILDI: "Teslim edildi",
  IPTAL_EDILDI: "İptal edildi",
};

export const ORDER_STATUS_TONE: Record<string, string> = {
  ODEME_BEKLIYOR: "bg-amber-50 text-amber-800",
  ODENDI: "bg-sky-50 text-sky-800",
  HAZIRLANIYOR: "bg-sky-50 text-sky-800",
  KARGOYA_VERILDI: "bg-indigo-50 text-indigo-800",
  TESLIM_EDILDI: "bg-emerald-50 text-emerald-800",
  IPTAL_EDILDI: "bg-neutral-100 text-neutral-600",
};

export const PAYMENT_LABEL: Record<string, string> = {
  KART: "Kredi/Banka Kartı",
  HAVALE: "Havale/EFT",
  CARI_HESAP: "Cari Hesap",
};

// İlerleme çubuğu adımları (iptal ayrı gösterilir).
export const ORDER_STEPS: Array<{ status: string; label: string }> = [
  { status: "ODEME_BEKLIYOR", label: "Sipariş alındı" },
  { status: "HAZIRLANIYOR", label: "Hazırlanıyor" },
  { status: "KARGOYA_VERILDI", label: "Kargoda" },
  { status: "TESLIM_EDILDI", label: "Teslim edildi" },
];

export function orderStepIndex(status: string): number {
  // ODENDI kullanılmıyor ama gelirse "hazırlanıyor" öncesi/aynı aşama sayılır.
  if (status === "ODENDI") return 0;
  return ORDER_STEPS.findIndex((s) => s.status === status);
}

export function formatOrderDate(date: Date): string {
  return date.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
