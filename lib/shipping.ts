// Kargo ücreti ve ücretsiz kargo eşiği (2026-10-13). Tutarlar KODDA SABİT DEĞİL: CRM › Mağazalar › Online Mağaza ›
// Düzenle'deki Store.kargoUcretiCents ve Store.ucretsizKargoEsigiCents alanlarından okunur (bkz. lib/onlineStore.ts
// getKargoAyari). Ücret girilmemişse (NULL) kural KAPALIDIR: tüm siparişler ücretsiz, metinler "tüm siparişlerde ücretsiz".
//
// Kural (kullanıcı kararı): ürün toplamı — KDV dahil, kurumsal indirim uygulanmış, müşterinin ödeyeceği tutar — eşiğe
// ULAŞIRSA (>=, tam 5.000,00 TL dahil) kargo ücretsiz; altındaysa kargo ücreti alınır. Firma kartında "Kargo ücretsiz"
// işaretli firmadan hiç alınmaz. Kart, havale ve cari hesap siparişlerinde aynı kural. Sepet önizlemesi ve sipariş
// oluşturma bu dosyadaki kargoHesapla'yı kullanır — iki yerde ayrı hesap yok.

export type KargoAyari = {
  /** KDV dahil kargo ücreti; null = kargo kuralı kapalı */
  ucretCents: number | null;
  /** Bu tutar ve üzeri ürün toplamında kargo ücretsiz */
  esikCents: number;
};

export type KargoSonucu = {
  kargoCents: number;
  /** Kural açık ve bu müşteri için geçerli mi (firma muafiyeti yoksa) */
  kuralAktif: boolean;
  /** Ücretsiz kargoya kalan tutar; ücretsizse ya da kural kapalıysa 0 */
  kalanCents: number;
};

export function kargoKuraliAcik(ayar: KargoAyari): boolean {
  return ayar.ucretCents !== null && ayar.ucretCents > 0;
}

export function kargoHesapla(araToplamCents: number, ayar: KargoAyari, firmaKargoUcretsiz: boolean): KargoSonucu {
  if (!kargoKuraliAcik(ayar) || firmaKargoUcretsiz || araToplamCents <= 0) {
    return { kargoCents: 0, kuralAktif: kargoKuraliAcik(ayar) && !firmaKargoUcretsiz, kalanCents: 0 };
  }
  if (araToplamCents >= ayar.esikCents) return { kargoCents: 0, kuralAktif: true, kalanCents: 0 };
  return { kargoCents: ayar.ucretCents!, kuralAktif: true, kalanCents: ayar.esikCents - araToplamCents };
}

// Vitrin metinleri (duyuru çubuğu, ürün sayfası, SSS, Teslimat ve İade, SEO açıklamaları) bu iki yardımcıdan.
// "5.000 TL" — kuruş sıfırsa küçük gösterim (kullanıcı kararı: "5.000 TL ve üzeri ücretsiz kargo").
export function tlKisa(cents: number): string {
  const tl = cents / 100;
  return `${tl.toLocaleString("tr-TR", { minimumFractionDigits: Number.isInteger(tl) ? 0 : 2, maximumFractionDigits: 2 })} TL`;
}

export function ucretsizKargoMetni(ayar: KargoAyari): string {
  return kargoKuraliAcik(ayar) ? `${tlKisa(ayar.esikCents)} ve üzeri ücretsiz kargo` : "Tüm siparişlerde ücretsiz kargo";
}

// SSS ve Teslimat ve İade Şartları'ndaki kargo ücreti cümlesi.
export function kargoUcretiCumlesi(ayar: KargoAyari): string {
  if (!kargoKuraliAcik(ayar)) return "Şu anda tüm siparişlerde kargo ücretsizdir.";
  return `Ürün toplamı ${tlKisa(ayar.esikCents)} ve üzeri olan siparişlerde kargo ücretsizdir; altındaki siparişlerde kargo ücreti ${tlKisa(ayar.ucretCents!)} (KDV dahil). Ürün toplamına kurumsal indirimli, KDV dahil tutar esas alınır; kargo ücreti sepette ve ödeme adımında ayrıca gösterilir.`;
}

// 13:30 kesim saati — Türkiye sabit UTC+3 kullanıyor (2016'dan beri DST yok),
// bu yüzden sunucunun kendi saat dilimi ne olursa olsun (Vercel genelde UTC)
// doğrudan UTC'den +3 ekleyerek hesaplamak güvenli. magaza-crm'in
// toLocalIsoDate dersiyle aynı gerekçe: sunucu yerel saatine güvenme.
export function isBeforeShippingCutoff(now: Date = new Date()): boolean {
  const turkeyHour = (now.getUTCHours() + 3) % 24;
  const turkeyMinutes = now.getUTCMinutes();
  return turkeyHour < 13 || (turkeyHour === 13 && turkeyMinutes < 30);
}
