import type { Metadata } from "next";
import { getStorefrontProductBySlug } from "@/lib/search";
import { grupMetasi, urunMetasi } from "@/lib/seo";
import { getGorunurGrupBySlug } from "@/lib/urunGrubu";
import { grupUyesiyseYonlendir } from "@/lib/urunSayfasi";
import ProductDetail from "@/components/ProductDetail";
import UrunGrubuDetay from "@/components/UrunGrubuDetay";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// /urun/<slug> iki şeyden biri olabilir (slug ad alanı ortak, çakışmayı CRM engeller — varyant, 2026-10):
//   1. görünür bir Ürün Grubu → grup sayfası (seçim ?renk=…&ebat=… parametrelerinden);
//   2. ürün → görünür bir grubun üyesiyse grup adresine 308, değilse bugünkü ürün sayfası.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const grup = await getGorunurGrupBySlug(slug);
  if (grup) {
    const varsayilanKapak = grup.uyeler.find((u) => u.varsayilan)?.urun.images[0] ?? grup.uyeler[0].urun.images[0] ?? null;
    return grupMetasi({
      ...grup,
      gorsel: grup.gorseller[0] ?? varsayilanKapak,
      yedekAciklama: grup.uyeler.map((u) => u.urun.shortDescription || u.urun.description).find(Boolean) ?? null,
    });
  }
  const product = await getStorefrontProductBySlug(slug);
  if (!product) return {};
  await grupUyesiyseYonlendir(product.barcode, await searchParams);
  return urunMetasi(product);
}

export default async function UrunSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const grup = await getGorunurGrupBySlug(slug);
  if (grup) return <UrunGrubuDetay grup={grup} searchParams={await searchParams} />;
  const product = await getStorefrontProductBySlug(slug);
  await grupUyesiyseYonlendir(product?.barcode, await searchParams);
  return <ProductDetail product={product} />;
}
