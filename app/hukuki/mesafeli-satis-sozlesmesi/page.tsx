import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Mesafeli Satış Sözleşmesi" };

const h2 = "mt-6 mb-2 text-base font-semibold text-neutral-900";
const ul = "list-disc space-y-1 pl-5";

export default function MesafeliSatisPage() {
  return (
    <LegalPage title="Mesafeli Satış Sözleşmesi" updatedNote="6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği'ne uygun hazırlanmıştır.">
      <h2 className={h2}>1. Taraflar</h2>
      <p>
        <strong>SATICI:</strong> [Şirket Unvanı], [Adres], [Vergi Dairesi/No], [Mersis No], [E-posta], [Telefon]
        (bundan sonra &quot;SATICI&quot; olarak anılacaktır).
      </p>
      <p>
        <strong>ALICI:</strong> Sipariş sırasında bilgileri girilen, siteyi ziyaret eden ve/veya sipariş veren kişi
        (bundan sonra &quot;ALICI&quot; olarak anılacaktır).
      </p>

      <h2 className={h2}>2. Sözleşmenin Konusu</h2>
      <p>
        İşbu sözleşmenin konusu, ALICI&apos;nın SATICI&apos;ya ait internet sitesi üzerinden elektronik ortamda
        siparişini verdiği, sözleşmede belirtilen niteliklere sahip ürün/ürünlerin satışı ve teslimi ile ilgili
        olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri
        gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.
      </p>

      <h2 className={h2}>3. Sözleşme Konusu Ürün/Ödeme/Teslimat Bilgileri</h2>
      <p>
        Ürünün/ürünlerin türü, miktarı, marka/modeli, rengi, adedi, satış bedeli, ödeme şekli ve teslimat
        bilgileri, sipariş sırasında ALICI tarafından onaylanan sipariş özetinde ve sipariş onay e-postasında
        belirtildiği gibidir.
      </p>

      <h2 className={h2}>4. Genel Hükümler</h2>
      <ul className={ul}>
        <li>
          ALICI, internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile
          teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu, elektronik ortamda gerekli teyidi
          verdiğini kabul eder.
        </li>
        <li>
          Sözleşme konusu ürün, yasal 30 günlük süreyi aşmamak koşulu ile her bir ürün için ALICI&apos;nın
          yerleşim yerinin uzaklığına bağlı olarak internet sitesinde belirtilen süre içinde ALICI veya
          gösterdiği adresteki kişi/kuruluşa teslim edilir.
        </li>
        <li>
          Ürün, ALICI&apos;dan başka bir kişi/kuruluşa teslim edilecek ise, teslim edilecek kişi/kuruluşun
          teslimatı kabul etmemesinden SATICI sorumlu tutulamaz.
        </li>
        <li>
          SATICI, sözleşme konusu ürünün sağlam, eksiksiz, siparişte belirtilen niteliklere uygun teslim
          edilmesinden sorumludur.
        </li>
      </ul>

      <h2 className={h2}>5. Cayma Hakkı</h2>
      <p>
        ALICI; sözleşme konusu ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa tesliminden itibaren
        <strong> 14 (on dört) gün</strong> içinde, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir
        gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkına sahiptir. Cayma hakkının kullanılması
        için bu süre içinde SATICI&apos;ya [e-posta] veya [telefon] üzerinden yazılı bildirimde bulunulması
        gerekmektedir. Detaylı bilgi ve istisnalar için{" "}
        <a href="/hukuki/cayma-hakki" className="underline">
          Cayma Hakkı ve İade Koşulları
        </a>{" "}
        sayfasını inceleyiniz.
      </p>

      <h2 className={h2}>6. Temerrüt Hali ve Hukuki Sonuçları</h2>
      <p>
        ALICI, ödeme işlemlerini kredi kartı ile yaptığı durumda temerrüde düştüğü takdirde, kart sahibi
        banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu
        olacağını kabul eder.
      </p>

      <h2 className={h2}>7. Yetkili Mahkeme</h2>
      <p>
        İşbu sözleşmenin uygulanmasında, Ticaret Bakanlığınca ilan edilen değere kadar ALICI&apos;nın
        yerleşim yerindeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2 className={h2}>8. Yürürlük</h2>
      <p>
        ALICI, sipariş onayı ile birlikte işbu sözleşmenin tüm koşullarını kabul etmiş sayılır. SATICI,
        siparişin gerçekleşmesi öncesinde işbu sözleşmeyi ALICI&apos;nın onayına sunar.
      </p>
    </LegalPage>
  );
}
