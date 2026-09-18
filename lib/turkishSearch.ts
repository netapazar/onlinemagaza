// Postgres'in varsayılan (Türkçe olmayan) harf katlama kuralları I/İ/ı/i
// dörtlüsünü birbirine eşitlemiyor — doğrulanmış örnekler:
//   'İNOX' ILIKE '%inox%'  -> false
//   'INOX' ILIKE '%ınox%'  -> false (düz ASCII I ile yazılmış "Inox", Türkçe
//                             ı ile aranınca bulunamıyor)
// Üstelik katalogdaki ürün adlarının kendisi de tutarsız yazılmış (bazıları
// "GIPTA" düz ASCII I ile, bazıları "Gıpta" doğru Türkçe ı ile) — bu yüzden
// "doğru" Türkçe eşleşmeyi (I<->ı, İ<->i) uygulamak tek başına yetmiyor.
// Arama sırasında bu dört karakteri birbirinin yerine geçebilir sayıyoruz;
// hangi biçimde kayıtlı olursa olsun bulunabilsin diye.
const TURKISH_I_FAMILY = new Set(["i", "I", "İ", "ı"]);
// mode:"insensitive" zaten düz ASCII I<->i eşleşmesini kendiliğinden
// katlıyor (doğrulandı: 'INOX' ILIKE '%inox%' -> true), o yüzden o çifti
// tek bir temsilci ("i") ile kapsamak yeterli; İ ve ı ise kendi başına
// hiçbir şeyle katlanmıyor, ayrı birer temsilci gerekiyor.
const REPRESENTATIVES = ["i", "İ", "ı"] as const;
// Gerçekçi bir arama kelimesinin bu kadar çok belirsiz harf içermesi
// beklenmez — OR listesinin sınırsız büyümesine karşı bir güvenlik sınırı.
const MAX_AMBIGUOUS_CHARS = 4;

function isTurkishIFamily(ch: string): boolean {
  return TURKISH_I_FAMILY.has(ch);
}

// Bir arama kelimesini, içindeki her I/İ/ı/i konumu için mümkün temsilci
// varyantların kartezyen çarpımına genişletir — örn. "gıpta" ->
// ["gipta", "gİpta", "gıpta"]. Belirsiz harf yoksa kelimeyi olduğu gibi
// döndürür (davranış hiç değişmez, ekstra sorgu maliyeti oluşmaz).
export function expandTurkishIVariants(keyword: string): string[] {
  const chars = [...keyword];
  const ambiguousIndexes: number[] = [];
  chars.forEach((ch, i) => {
    if (isTurkishIFamily(ch)) ambiguousIndexes.push(i);
  });
  if (ambiguousIndexes.length === 0) return [keyword];
  if (ambiguousIndexes.length > MAX_AMBIGUOUS_CHARS) return [keyword];

  let variants: string[][] = [chars];
  for (const idx of ambiguousIndexes) {
    variants = variants.flatMap((v) =>
      REPRESENTATIVES.map((rep) => {
        const next = [...v];
        next[idx] = rep;
        return next;
      })
    );
  }
  return [...new Set(variants.map((v) => v.join("")))];
}
