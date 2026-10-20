// Varyant (Ürün Grubu, 2026-10) — veritabanına dokunmayan saf yardımcılar. Hem sunucu (lib/urunGrubu.ts) hem istemci
// (ürün grubu sayfasının seçicisi) kullanır; bu yüzden burada prisma ya da sunucuya özel içe aktarma YOK.
//
// Adres biçimi (sözleşme): grup /urun/<grup.slug>; seçim eksen adının slug'ıyla: ?renk=kirmizi ya da ?renk=kirmizi&ebat=a4.

// CRM'deki src/lib/slugify.ts ile aynı dönüşüm (Türkçe karakter → ascii, küçük harf, tire).
export function slugTr(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Seçim parametresi biçimi — CRM'deki src/lib/urunGrubu.ts eksenSlug ile BİREBİR aynı (CRM aynı grupta bu slug'ı çakışan
// eksen değerlerini reddeder): slugTr'ye ek olarak şapkalı/aksanlı harfler temel harfe iner ("Lâcivert" → "lacivert").
export function eksenSlug(deger: string): string {
  return slugTr(deger.normalize("NFD").replace(/[̀-ͯ]/g, ""));
}

// Eksen adı → parametre adı ("Renk" → "renk", "Ebat" → "ebat"). CRM boş slug'lı adı kabul etmez; yedek yalnız güvenlik için.
export function eksenParamAdi(eksenAd: string, yedek = "secenek"): string {
  return eksenSlug(eksenAd) || yedek;
}

// Eksen değeri → parametre değeri ("Kırmızı" → "kirmizi", "A4" → "a4"). CRM boş slug'lı değeri kabul etmez; boş kalırsa
// (eski/elle girilmiş veri) değerin kendisi.
export function degerSlug(deger: string): string {
  return eksenSlug(deger) || deger.trim().toLocaleLowerCase("tr-TR");
}

// Grubun iki parametre adı. İki eksen aynı slug'a düşerse (ör. "Renk" / "renk") ikincisi ayrışsın diye ek alır.
export function grupParamAdlari(g: { eksen1Ad: string; eksen2Ad: string | null }): { p1: string; p2: string | null } {
  const p1 = eksenParamAdi(g.eksen1Ad, "secenek");
  if (!g.eksen2Ad) return { p1, p2: null };
  let p2 = eksenParamAdi(g.eksen2Ad, "secenek2");
  if (p2 === p1) p2 = `${p2}-2`;
  return { p1, p2 };
}

export type SecimUyesi = {
  eksen1Deger: string;
  eksen2Deger: string | null;
  varsayilan: boolean;
  // Satılabilir mi (e-ticaret stoğu ≥ en küçük satış biriminin içeriği) — seçicide pasif/aktif.
  satilabilir: boolean;
};

export function grupYolu(slug: string, sorgu?: string): string {
  return sorgu ? `/urun/${slug}?${sorgu}` : `/urun/${slug}`;
}

// Üyenin seçim parametreleri ("renk=kirmizi&ebat=a4"). Sıra sabit: önce eksen1, sonra eksen2.
export function secimSorgusu(g: { eksen1Ad: string; eksen2Ad: string | null }, u: { eksen1Deger: string; eksen2Deger: string | null }): string {
  const { p1, p2 } = grupParamAdlari(g);
  const sp = new URLSearchParams();
  sp.set(p1, degerSlug(u.eksen1Deger));
  if (p2 && u.eksen2Deger) sp.set(p2, degerSlug(u.eksen2Deger));
  return sp.toString();
}

// Parametresiz açılış: varsayılan üye; stokta değilse sıradaki ilk stoklu üye; o da yoksa ilk üye. uyeler sıralı (sira) gelir.
export function varsayilanIndeks(uyeler: SecimUyesi[]): number {
  if (uyeler.length === 0) return -1;
  const v = uyeler.findIndex((u) => u.varsayilan);
  if (v >= 0 && uyeler[v].satilabilir) return v;
  // "Sıradaki": varsayılandan sonra gelen ilk stoklu, yoksa baştan ilk stoklu.
  const sonra = v >= 0 ? uyeler.findIndex((u, i) => i > v && u.satilabilir) : -1;
  if (sonra >= 0) return sonra;
  const ilk = uyeler.findIndex((u) => u.satilabilir);
  return ilk >= 0 ? ilk : 0;
}

type Param = string | string[] | undefined;
const tek = (p: Param) => (Array.isArray(p) ? p[0] : p)?.trim().toLocaleLowerCase("tr-TR") || undefined;

// Adres parametrelerinden seçili üyenin indeksi. Eksen1 eşleşip eksen2 eşleşmezse (ya da yoksa) o eksen1 değerinin ilk
// stoklu üyesi; hiç eşleşme yoksa varsayılan kural. Parametre değeri slug ya da (elle yazılmışsa) değerin kendisi olabilir.
export function secimiCoz(
  g: { eksen1Ad: string; eksen2Ad: string | null },
  uyeler: SecimUyesi[],
  params: Record<string, Param>
): number {
  const { p1, p2 } = grupParamAdlari(g);
  const v1 = tek(params[p1]);
  const v2 = p2 ? tek(params[p2]) : undefined;
  if (!v1) return varsayilanIndeks(uyeler);
  const esit = (deger: string, aranan: string) => degerSlug(deger) === aranan || deger.toLocaleLowerCase("tr-TR") === aranan;
  const ayniEksen1 = uyeler.map((u, i) => ({ u, i })).filter(({ u }) => esit(u.eksen1Deger, v1));
  if (ayniEksen1.length === 0) return varsayilanIndeks(uyeler);
  if (v2) {
    const tam = ayniEksen1.find(({ u }) => u.eksen2Deger !== null && esit(u.eksen2Deger, v2));
    if (tam) return tam.i;
  }
  return (ayniEksen1.find(({ u }) => u.satilabilir) ?? ayniEksen1[0]).i;
}

// Eksen değerlerinin ilk görülme sırasıyla tekil listesi (üyeler sira'ya göre sıralı geldiği için seçici de o sırada).
export function tekilDegerler(uyeler: { eksen1Deger: string; eksen2Deger: string | null }[], eksen: 1 | 2): string[] {
  const out: string[] = [];
  const gorulen = new Set<string>();
  for (const u of uyeler) {
    const d = eksen === 1 ? u.eksen1Deger : u.eksen2Deger;
    if (d === null || gorulen.has(d)) continue;
    gorulen.add(d);
    out.push(d);
  }
  return out;
}

// Liste kartındaki seçenek etiketi: "11 renk" ya da iki eksende "11 renk · 4 ebat". Tek seçenekli eksen yazılmaz.
export function secenekEtiketi(
  g: { eksen1Ad: string; eksen2Ad: string | null },
  uyeler: { eksen1Deger: string; eksen2Deger: string | null }[]
): string | null {
  const parca = (ad: string, n: number) => (n > 1 ? `${n} ${ad.toLocaleLowerCase("tr-TR")}` : null);
  const parcalar = [
    parca(g.eksen1Ad, tekilDegerler(uyeler, 1).length),
    g.eksen2Ad ? parca(g.eksen2Ad, tekilDegerler(uyeler, 2).length) : null,
  ].filter((x): x is string => x !== null);
  return parcalar.length > 0 ? parcalar.join(" · ") : null;
}

// schema.org variesBy: yalnız Renk → color, Ebat/Boyut → size. Diğer eksen adlarında (Hacim, Uç...) variesBy yazılmaz.
export function eksenSchemaOzelligi(eksenAd: string | null): "color" | "size" | null {
  if (!eksenAd) return null;
  const s = slugTr(eksenAd);
  if (s === "renk") return "color";
  if (s === "ebat" || s === "boyut" || s === "ebat-boyut" || s === "boyut-ebat") return "size";
  return null;
}

// Seçenek etiketi metni: "Renk: Kırmızı" / "Renk: Kırmızı · Ebat: A4".
export function secimMetni(g: { eksen1Ad: string; eksen2Ad: string | null }, u: { eksen1Deger: string; eksen2Deger: string | null }): string {
  return [`${g.eksen1Ad}: ${u.eksen1Deger}`, g.eksen2Ad && u.eksen2Deger ? `${g.eksen2Ad}: ${u.eksen2Deger}` : null]
    .filter(Boolean)
    .join(" · ");
}
