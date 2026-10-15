import { resolvePrice } from "@/lib/pricing";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import { getMembershipStatus } from "@/lib/membershipStatus";
import { getRelatedProducts } from "@/lib/search";
import { isBeforeShippingCutoff } from "@/lib/shipping";
import { trTitle } from "@/lib/text";
import { unitLabel } from "@/lib/units";
import { birimEtiketi, SATIS_BIRIMI_ETIKET } from "@/lib/satisBirimleri";
import { SITE_URL } from "@/lib/seo";
import type { GrupSayfaVerisi } from "@/lib/urunGrubu";
import { eksenSchemaOzelligi, grupYolu, secimiCoz, secimMetni, secimSorgusu } from "@/lib/urunGrubuCore";
import ProductMembershipBox from "@/components/ProductMembershipBox";
import ProductRow from "@/components/ProductRow";
import UrunGrubuSecici, { type GrupUyeVerisi } from "@/components/UrunGrubuSecici";
import TopluAdetTablosu from "@/components/TopluAdetTablosu";

type Ozellik = { label: string; value: string };

function ozellikleriOku(raw: unknown): Ozellik[] {
  return Array.isArray(raw)
    ? (raw as { ad?: unknown; deger?: unknown }[])
        .filter((f) => typeof f.ad === "string" && typeof f.deger === "string")
        .map((f) => ({ label: f.ad as string, value: f.deger as string }))
    : [];
}

const dolu = (s: string | null | undefined) => (s && s.trim() ? s : null);

// Ürün grubu (varyant, 2026-10) sayfası. Başlık (h1) GRUP adı; seçili seçenek seçicinin etiketinde ("Renk: Kırmızı").
// Fiyat/stok/görsel/barkod seçili üyeden; içerik alanları üyede boşsa gruptan. Marka/kategori grubun (boşsa ilk görünür
// üyenin — lib/urunGrubu.ts). İstemciye üye başına yalnız seçimde değişen alanlar gider; grubun ortak metni bir kez.
export default async function UrunGrubuDetay({
  grup,
  searchParams,
}: {
  grup: GrupSayfaVerisi;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const eksenler = { eksen1Ad: grup.eksen1Ad, eksen2Ad: grup.eksen2Ad };
  const seciliIndeks = secimiCoz(eksenler, grup.uyeler, searchParams);
  const secili = grup.uyeler[seciliIndeks];

  const [memberDiscountPercent, membershipStatus, relatedProducts] = await Promise.all([
    getMemberDiscountPercent(),
    getMembershipStatus(),
    getRelatedProducts(
      grup.category?.id ?? secili.urun.categoryId,
      secili.urun.id,
      8,
      grup.uyeler.map((u) => u.urun.barcode)
    ),
  ]);

  const grupOzellikleri = ozellikleriOku(grup.features);
  const grupAciklamasi = dolu(grup.description);

  const uyeler: GrupUyeVerisi[] = grup.uyeler.map((u) => {
    const p = u.urun;
    const price = resolvePrice({ listPriceCents: u.listPriceCents }, memberDiscountPercent);
    const satisBirimiMetni = u.satisBirimleri
      ? u.satisBirimleri.map((b) => birimEtiketi(b.birim, b.adet)).join(", ")
      : unitLabel(p.unit);
    const kendiOzellikleri = ozellikleriOku(p.features);
    const specs = [
      ...(kendiOzellikleri.length > 0 ? kendiOzellikleri : grupOzellikleri),
      { label: grup.eksen1Ad, value: u.eksen1Deger },
      grup.eksen2Ad && u.eksen2Deger ? { label: grup.eksen2Ad, value: u.eksen2Deger } : null,
      grup.brand ? { label: "Marka", value: grup.brand.name } : null,
      grup.category ? { label: "Kategori", value: trTitle(grup.category.name) } : null,
      p.productCode ? { label: "Ürün Kodu", value: p.productCode } : null,
      { label: "Satış Birimi", value: satisBirimiMetni },
      p.packageInfo?.trim() ? { label: "Paket İçeriği", value: p.packageInfo.trim() } : null,
      { label: "Barkod", value: p.barcode },
      ...(u.satisBirimleri ?? [])
        .filter((b) => b.barkod)
        .map((b) => ({ label: `${SATIS_BIRIMI_ETIKET[b.birim]} Barkodu`, value: b.barkod as string })),
    ].filter((s): s is Ozellik => s !== null);
    return {
      id: p.id,
      e1: u.eksen1Deger,
      e2: u.eksen2Deger,
      renkHex: u.renkHex,
      kapak: p.images[0]?.url ?? null,
      ad: p.name,
      productCode: p.productCode,
      barkod: p.barcode && !p.barcodeIsGenerated ? p.barcode : null,
      listCents: price.listCents,
      displayCents: price.displayCents,
      discounted: price.discounted,
      discountPercent: price.discountPercent,
      satisBirimleri: u.satisBirimleri,
      satisBirimiMetni,
      packageInfo: p.packageInfo?.trim() || null,
      stock: p.stock,
      satilabilir: u.satilabilir,
      kisaAciklama: dolu(p.shortDescription),
      // Üyenin kendi açıklaması yalnız gruptan farklıysa gönderilir (istemci boşsa grubunkini gösterir).
      aciklama: dolu(p.description) && p.description !== grupAciklamasi ? p.description : null,
      specs,
      images: p.images,
    };
  });

  // schema.org ProductGroup (SEO): grup + her görünür üyenin Product+Offer'ı. Fiyat MİSAFİR fiyatı (üye indirimi yok), KDV
  // dahil, paketli satışta adet fiyatı (ProductDetail'deki tek ürün verisiyle aynı kural). variesBy yalnız Renk/Ebat-Boyut.
  const grupUrl = `${SITE_URL}${grupYolu(grup.slug)}`;
  const variesBy = [eksenSchemaOzelligi(grup.eksen1Ad), eksenSchemaOzelligi(grup.eksen2Ad)]
    .filter((x): x is "color" | "size" => x !== null)
    .map((x) => `https://schema.org/${x}`);
  const ozellik1 = eksenSchemaOzelligi(grup.eksen1Ad);
  const ozellik2 = eksenSchemaOzelligi(grup.eksen2Ad);
  const grupGorselleri = grup.gorseller.map((g) => g.url);
  const grupAciklamasiKisa = dolu(grup.shortDescription) ?? grupAciklamasi;
  const yapilandirilmisVeri = {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: grup.ad,
    productGroupID: grup.id,
    url: grupUrl,
    ...(grupAciklamasiKisa ? { description: grupAciklamasiKisa.slice(0, 500) } : {}),
    ...(grupGorselleri.length ? { image: grupGorselleri } : {}),
    ...(grup.brand ? { brand: { "@type": "Brand", name: grup.brand.name } } : {}),
    ...(grup.category ? { category: grup.category.name } : {}),
    ...(variesBy.length ? { variesBy } : {}),
    hasVariant: grup.uyeler.map((u) => {
      const p = u.urun;
      const url = `${SITE_URL}${grupYolu(grup.slug, secimSorgusu(eksenler, u))}`;
      const gtin = p.barcode && !p.barcodeIsGenerated && /^(\d{8}|\d{12,14})$/.test(p.barcode) ? p.barcode : null;
      const gorseller = p.images.length ? p.images.map((i) => i.url) : grupGorselleri;
      return {
        "@type": "Product",
        name: `${grup.ad} - ${[u.eksen1Deger, u.eksen2Deger].filter(Boolean).join(" ")}`,
        url,
        sku: p.productCode || p.barcode,
        ...(gtin ? { gtin } : {}),
        ...(gorseller.length ? { image: gorseller } : {}),
        ...(ozellik1 ? { [ozellik1]: u.eksen1Deger } : {}),
        ...(ozellik2 && u.eksen2Deger ? { [ozellik2]: u.eksen2Deger } : {}),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "TRY",
          price: (resolvePrice({ listPriceCents: u.listPriceCents }, null).displayCents / 100).toFixed(2),
          availability: u.satilabilir ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      };
    }),
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <script
        type="application/ld+json"
        // "<" kaçırılır: veri içindeki bir "</script>" etiketi kapatamasın.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(yapilandirilmisVeri).replace(/</g, "\\u003c") }}
      />
      <UrunGrubuSecici
        grup={{
          slug: grup.slug,
          ad: grup.ad,
          eksen1Ad: grup.eksen1Ad,
          eksen2Ad: grup.eksen2Ad,
          markaAdi: grup.brand?.name ?? null,
          kisaAciklama: dolu(grup.shortDescription),
          aciklama: grupAciklamasi,
          gorseller: grup.gorseller,
        }}
        uyeler={uyeler}
        ilkIndeks={seciliIndeks}
        kargoSaatiOncesi={isBeforeShippingCutoff()}
        uyelikKutusu={<ProductMembershipBox status={membershipStatus} />}
      />

      {uyeler.length > 1 && (
        <TopluAdetTablosu
          eksen1Ad={grup.eksen1Ad}
          eksen2Ad={grup.eksen2Ad}
          markaAdi={grup.brand?.name ?? null}
          satirlar={uyeler.map((u) => ({
            id: u.id,
            e1: u.e1,
            e2: u.e2,
            renkHex: u.renkHex,
            kapak: u.kapak,
            ad: u.ad,
            secim: secimMetni(eksenler, { eksen1Deger: u.e1, eksen2Deger: u.e2 }),
            displayCents: u.displayCents,
            satisBirimleri: u.satisBirimleri,
            stock: u.stock,
            satilabilir: u.satilabilir,
          }))}
        />
      )}

      {relatedProducts.length > 0 && (
        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <ProductRow title="Benzer Ürünler" products={relatedProducts} memberDiscountPercent={memberDiscountPercent} perRow={4} oklar />
        </div>
      )}
    </div>
  );
}
