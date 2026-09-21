// Görüntüleme için Türkçe "Başlık Düzeni" (Title Case): veritabanındaki kayıt DEĞİŞMEZ, yalnız gösterimde uygulanır.
// Kategori adları "FOTOKOPİ KAĞIDI" / "fotokopi kağıdı" gibi karışık yazılmış olsa da menüde, kartlarda ve
// footer'da "Fotokopi Kağıdı" görünür.
//
// Türkçe i/İ, ı/I dönüşümü için locale'li toLocaleLowerCase/UpperCase("tr-TR") kullanılır: "İNOX" → "inox" → "İnox",
// "IŞIK" → "ışık" → "Işık" (varsayılan İngilizce dönüşümde "I" → "i" olup "IŞık" gibi bozulurdu).

// Küçük harfle kalan bağlaçlar (kelime başında değilse).
const KUCUK_KELIMELER = new Set(["ve", "ile", "için", "veya", "de", "da", "ya"]);

// Tamamı büyük harfle yazılan, yaygın kısaltmalar ve ölçüler (ör. A4 kâğıdı, USB bellek) olduğu gibi kalır.
const KISALTMALAR = new Set(["A3", "A4", "A5", "USB", "PVC", "LED", "CD", "DVD", "UV", "PP", "PE", "PET", "ABS", "POS", "RFID", "QR", "TV", "PC"]);

export function trTitle(input: string): string {
  const parcalar = input.trim().split(/(\s+|[/&()\-–,]+)/);
  let ilkKelimeGorulduMu = false;
  return parcalar
    .map((parca) => {
      if (parca === "" || /^(\s+|[/&()\-–,]+)$/.test(parca)) return parca;
      const kelimeIlk = !ilkKelimeGorulduMu;
      ilkKelimeGorulduMu = true;
      if (KISALTMALAR.has(parca)) return parca;
      const kucuk = parca.toLocaleLowerCase("tr-TR");
      if (!kelimeIlk && KUCUK_KELIMELER.has(kucuk)) return kucuk;
      // İlk HARFİ büyüt (sayı/işaretle başlıyorsa ilk harf bulunur): "3'lü" → "3'Lü" olmasın diye yalnız kelimenin ilk karakteri
      const [ilk, ...geri] = Array.from(kucuk);
      return ilk.toLocaleUpperCase("tr-TR") + geri.join("");
    })
    .join("");
}
