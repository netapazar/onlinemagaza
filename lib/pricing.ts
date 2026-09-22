// Guest and plain registered members see the plain list price (onlinePriceCents,
// falling back to salePriceCents — same nullable-override convention as
// magaza-crm's marketingPriceCents). Only a WebCustomer linked to an approved
// Firma (Firma.onlineErisimAktif) gets Firma.onlineIskontoOrani applied —
// this is the literal "üye olursan daha uygun fiyat" promise from the plan.
export type PriceInfo = {
  listCents: number;
  displayCents: number;
  discounted: boolean;
  discountPercent: number | null;
};

// En yakın 50 kuruşa (0,50 TL) yuvarlar — müşteriye düzgün görünen bir liste fiyatı için.
export function round50(cents: number): number {
  return Math.round(cents / 50) * 50;
}

// Vitrin liste fiyatı: elle girilmiş onlinePriceCents varsa aynen kullanılır (artış
// oranı hiç uygulanmaz); yoksa salePriceCents üzerine artış oranı eklenip 50 kuruşa
// yuvarlanır. Tek yer — hem listeleme (search.ts) hem sepet/sipariş (cartActions.ts)
// hem ürün detayı (ProductDetail.tsx) burayı çağırır, fiyat hiçbir yerde ayrıca
// hesaplanmaz/saklanmaz.
export function computeListPriceCents(
  product: { salePriceCents: number; onlinePriceCents: number | null },
  markupPercent: number
): number {
  if (product.onlinePriceCents !== null) return product.onlinePriceCents;
  return round50(product.salePriceCents * (1 + markupPercent / 100));
}

export function resolvePrice(
  product: { listPriceCents: number },
  memberDiscountPercent: number | null
): PriceInfo {
  const listCents = product.listPriceCents;
  if (memberDiscountPercent && memberDiscountPercent > 0) {
    const displayCents = Math.round(listCents * (1 - memberDiscountPercent / 100));
    return { listCents, displayCents, discounted: true, discountPercent: memberDiscountPercent };
  }
  return { listCents, displayCents: listCents, discounted: false, discountPercent: null };
}

export function centsToTl(cents: number): string {
  return (cents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
