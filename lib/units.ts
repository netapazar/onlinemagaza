// Satış birimi etiketleri (Product.unit → müşteriye gösterilen ad).
export const UNIT_LABELS: Record<string, string> = {
  ADET: "Adet",
  KOLI: "Koli",
  DUZINE: "Düzine",
  KUTU: "Kutu",
  PAKET: "Paket",
};

export function unitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit;
}
