import type { StorefrontProductSummary, StorefrontSort } from "@/lib/search";

// Yalnızca yerel geliştirme ve Vercel önizleme (preview) dağıtımlarında
// aktif — canlı (production) ortamda HER ZAMAN kapalı. Gerçek veritabanına
// hiçbir sahte ürün yazılmıyor, bu modül sadece bellek-içi statik veri
// döndürüyor. Açık kontrol: `DEMO_DATA=true` ortam değişkeni (yerel'de
// isteğe bağlı açmak için); Vercel önizleme dağıtımlarında ekstra bir
// ayara gerek kalmasın diye `VERCEL_ENV === "preview"` iken otomatik açık.
export function isDemoMode(): boolean {
  // DEMO_DATA=false: önizleme (preview) dağıtımında da GERÇEK katalog gösterilsin (tasarımı gerçek verilerle görmek için).
  if (process.env.DEMO_DATA === "false") return false;
  return process.env.DEMO_DATA === "true" || process.env.VERCEL_ENV === "preview";
}

export type DemoProduct = StorefrontProductSummary & {
  description: string;
  barcode: string;
  unit: string;
};

export const DEMO_CATEGORIES: { id: string; name: string }[] = [
  { id: "demo-cat-kagit", name: "Fotokopi Kağıdı" },
  { id: "demo-cat-kirtasiye", name: "Ofis Kırtasiye" },
  { id: "demo-cat-kalem", name: "Kalem & Yazım" },
  { id: "demo-cat-dosya", name: "Dosyalama & Arşiv" },
  { id: "demo-cat-temizlik", name: "Temizlik & Hijyen" },
  { id: "demo-cat-baski", name: "Baskı & Toner" },
];

export const DEMO_BRANDS: { id: string; name: string }[] = [
  { id: "demo-brand-vege", name: "VEGE" },
  { id: "demo-brand-noki", name: "NOKI" },
  { id: "demo-brand-umur", name: "UMUR" },
  { id: "demo-brand-ofispro", name: "OfisPro" },
  { id: "demo-brand-kirtasiyeplus", name: "KırtasiyePlus" },
  { id: "demo-brand-masamax", name: "MasaMax" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "demo-cat-kagit": "%230e6b6b",
  "demo-cat-kirtasiye": "%23189089",
  "demo-cat-kalem": "%233fb3ac",
  "demo-cat-dosya": "%230b5555",
  "demo-cat-temizlik": "%230a4444",
  "demo-cat-baski": "%23093838",
};

// Gerçek ürün fotoğrafı DEĞİL — bilerek büyük harfli, düz renkli bir SVG
// (data URI), önizlemede yoğunluk/düzen değerlendirmesi için yeterli, gerçek
// bir görselmiş gibi yanıltıcı olmayacak kadar açıkça "yer tutucu".
function placeholderImage(text: string, categoryId: string): string {
  const bg = CATEGORY_COLORS[categoryId] ?? "%230e6b6b";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='480'><rect width='480' height='480' fill='${bg}'/><text x='50%25' y='50%25' font-family='Arial, sans-serif' font-weight='700' font-size='140' fill='white' fill-opacity='0.92' text-anchor='middle' dominant-baseline='central'>${text}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

const PRODUCT_NAMES_BY_CATEGORY: Record<string, string[]> = {
  "demo-cat-kagit": [
    "A4 Fotokopi Kağıdı 80gr 500'lü",
    "A3 Fotokopi Kağıdı 80gr 500'lü",
    "Renkli Fotokopi Kağıdı A4 100'lü",
    "Fotoğraf Kağıdı Parlak A4 50'li",
    "Etiket Kağıdı A4 100'lü",
  ],
  "demo-cat-kirtasiye": [
    "Zımba Teli No:10 1000'li",
    "Ataç Kutusu 100'lü",
    "Yapışkanlı Not Kağıdı 5 Renk",
    "Cetvel Seti 3'lü",
    "Ofis Makası Ergonomik",
  ],
  "demo-cat-kalem": [
    "Tükenmez Kalem Mavi 50'li Kutu",
    "Jel Kalem Seti 12 Renk",
    "Kurşun Kalem HB 12'li",
    "Fosforlu Kalem Seti 6 Renk",
    "Silgi ve Kalemtıraş Seti",
  ],
  "demo-cat-dosya": [
    "Telli Dosya A4 50'li",
    "Asetat Poşet Dosya 100'lü",
    "Arşiv Kutusu Büyük Boy",
    "Klasör Geniş Sırt 2'li",
    "Sunum Dosyası 20 Cepli",
  ],
  "demo-cat-temizlik": [
    "Kağıt Havlu 6'lı Paket",
    "El Dezenfektanı 500ml",
    "Çok Amaçlı Temizlik Mendili 80'li",
    "Tuvalet Kağıdı 32'li Koli",
    "Cam Silme Solüsyonu 750ml",
  ],
  "demo-cat-baski": [
    "Lazer Yazıcı Toner Siyah",
    "Mürekkep Kartuşu Renkli Set",
    "Termal Yazıcı Rulosu 10'lu",
    "Etiket Yazıcı Ribonu",
    "Fotokopi Makinesi Toner XL",
  ],
};

const UNITS = ["ADET", "KOLI", "PAKET"];

export const DEMO_PRODUCTS: DemoProduct[] = DEMO_CATEGORIES.flatMap((cat, catIndex) => {
  const names = PRODUCT_NAMES_BY_CATEGORY[cat.id] ?? [];
  return names.map((name, i) => {
    const globalIndex = catIndex * names.length + i;
    const brand = DEMO_BRANDS[globalIndex % DEMO_BRANDS.length];
    const basePrice = 4500 + ((globalIndex * 733) % 40000);
    const hasOnlineOverride = globalIndex % 3 === 0;
    const stock = globalIndex % 11 === 0 ? 0 : 5 + ((globalIndex * 3) % 60);
    return {
      id: `demo-${cat.id}-${i}`,
      slug: `demo-${cat.id}-${i}`,
      name,
      salePriceCents: basePrice,
      onlinePriceCents: hasOnlineOverride ? Math.round(basePrice * 0.92) : null,
      stock,
      storefrontSortOrder: globalIndex,
      coverImageUrl: placeholderImage(name.slice(0, 2).toUpperCase(), cat.id),
      brandId: brand.id,
      brandName: brand.name,
      categoryId: cat.id,
      description: `${name} — işletmeniz için kaliteli, günlük kullanıma uygun ${cat.name.toLowerCase()} ürünü. (Demo veri — sadece önizleme amaçlıdır.)`,
      barcode: `869${String(1000000000 + globalIndex).slice(0, 10)}`,
      unit: UNITS[globalIndex % UNITS.length],
      // Önizleme için: koli/paket satılan ürünlerin bir kısmında paket içeriği var, bir kısmında boş (gizli görünüm de görülsün)
      packageInfo:
        UNITS[globalIndex % UNITS.length] === "KOLI" ? (globalIndex % 2 === 0 ? "Koli: 12 adet" : null) : UNITS[globalIndex % UNITS.length] === "PAKET" ? "50'li paket" : null,
    } satisfies DemoProduct;
  });
});

function effectiveListCents(p: { salePriceCents: number; onlinePriceCents: number | null }): number {
  return p.onlinePriceCents ?? p.salePriceCents;
}

export function demoListStorefrontProducts(options: {
  query?: string;
  categoryId?: string;
  brandIds?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: StorefrontSort;
}): StorefrontProductSummary[] {
  let items = [...DEMO_PRODUCTS];

  if (options.query) {
    const q = options.query.trim().toLocaleLowerCase("tr-TR");
    items = items.filter(
      (p) => p.name.toLocaleLowerCase("tr-TR").includes(q) || (p.brandName?.toLocaleLowerCase("tr-TR").includes(q) ?? false)
    );
  }
  if (options.categoryId) items = items.filter((p) => p.categoryId === options.categoryId);
  if (options.brandIds && options.brandIds.length > 0) {
    const set = new Set(options.brandIds);
    items = items.filter((p) => p.brandId && set.has(p.brandId));
  }
  if (options.minPriceCents !== undefined) items = items.filter((p) => effectiveListCents(p) >= options.minPriceCents!);
  if (options.maxPriceCents !== undefined) items = items.filter((p) => effectiveListCents(p) <= options.maxPriceCents!);

  switch (options.sort) {
    case "fiyat-artan":
      items.sort((a, b) => effectiveListCents(a) - effectiveListCents(b));
      break;
    case "fiyat-azalan":
      items.sort((a, b) => effectiveListCents(b) - effectiveListCents(a));
      break;
    case "isim-az":
      items.sort((a, b) => a.name.localeCompare(b.name, "tr"));
      break;
    case "yeni":
      items.sort((a, b) => (b.storefrontSortOrder ?? 0) - (a.storefrontSortOrder ?? 0));
      break;
    default:
      items.sort((a, b) => (a.storefrontSortOrder ?? 0) - (b.storefrontSortOrder ?? 0));
  }

  return items;
}

export function demoCategoriesWithCounts(): { id: string; name: string; count: number; imageUrl: string | null }[] {
  return DEMO_CATEGORIES.map((c) => {
    const inCategory = DEMO_PRODUCTS.filter((p) => p.categoryId === c.id);
    return { ...c, count: inCategory.length, imageUrl: inCategory[0]?.coverImageUrl ?? null };
  });
}

// Gerçek satış verisi yok (demo modunda WebOrderItem sorgulanmıyor) — sadece
// düzen/yoğunluk önizlemesi için ilk N ürün "çok satan" gibi gösteriliyor.
export function demoBestSellers(limit: number): StorefrontProductSummary[] {
  return DEMO_PRODUCTS.slice(0, limit);
}

export function demoNewArrivals(limit: number): StorefrontProductSummary[] {
  return [...DEMO_PRODUCTS].sort((a, b) => (b.storefrontSortOrder ?? 0) - (a.storefrontSortOrder ?? 0)).slice(0, limit);
}

export function demoRelatedProducts(categoryId: string | null, excludeId: string, limit: number): StorefrontProductSummary[] {
  if (!categoryId) return [];
  return DEMO_PRODUCTS.filter((p) => p.categoryId === categoryId && p.id !== excludeId).slice(0, limit);
}

export function demoProductBySlugOrId(slugOrId: string) {
  const product = DEMO_PRODUCTS.find((p) => p.slug === slugOrId || p.id === slugOrId);
  if (!product) return null;
  const category = DEMO_CATEGORIES.find((c) => c.id === product.categoryId) ?? null;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    salePriceCents: product.salePriceCents,
    onlinePriceCents: product.onlinePriceCents,
    stock: product.stock,
    barcode: product.barcode,
    productCode: `TDR-${product.barcode.slice(-5)}`,
    unit: product.unit,
    packageInfo: product.packageInfo,
    categoryId: product.categoryId,
    images: [{ id: `${product.id}-img`, url: product.coverImageUrl ?? "", altText: product.name }],
    brand: product.brandName ? { name: product.brandName } : null,
    category: category ? { name: category.name } : null,
  };
}

export function demoProductsByIds(ids: string[]): StorefrontProductSummary[] {
  const byId = new Map(DEMO_PRODUCTS.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is DemoProduct => p !== undefined);
}
