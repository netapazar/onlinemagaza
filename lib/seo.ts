// Ürün sayfası için sayfa başlığı/meta açıklaması — CRM'de elle girilmişse
// (Product.seoTitle/seoDescription) aynen kullanılır, boşsa ürün adı/kısa
// açıklamadan üretilir (fiyat hesaplamasındaki nullable-override kuralıyla aynı desen).
export function resolveSeoTitle(product: { name: string; seoTitle?: string | null }): string {
  return product.seoTitle?.trim() || `${product.name} | Tedarikhane`;
}

export function resolveSeoDescription(product: {
  shortDescription?: string | null;
  description?: string | null;
  seoDescription?: string | null;
}): string {
  const fallback = product.shortDescription?.trim() || product.description?.trim() || "Tedarikhane — Online Mağaza";
  return (product.seoDescription?.trim() || fallback).slice(0, 160);
}
