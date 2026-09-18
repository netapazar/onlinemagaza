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

export function resolvePrice(
  product: { salePriceCents: number; onlinePriceCents: number | null },
  memberDiscountPercent: number | null
): PriceInfo {
  const listCents = product.onlinePriceCents ?? product.salePriceCents;
  if (memberDiscountPercent && memberDiscountPercent > 0) {
    const displayCents = Math.round(listCents * (1 - memberDiscountPercent / 100));
    return { listCents, displayCents, discounted: true, discountPercent: memberDiscountPercent };
  }
  return { listCents, displayCents: listCents, discounted: false, discountPercent: null };
}

export function centsToTl(cents: number): string {
  return (cents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
