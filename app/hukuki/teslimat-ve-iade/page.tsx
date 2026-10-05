import LegalPage from "@/components/LegalPage";
import { SIRKET } from "@/lib/sirket";

export const metadata = { title: "Teslimat ve İade Şartları" };

const h2 = "mt-6 mb-2 text-base font-semibold text-neutral-900";
const ul = "list-disc space-y-1 pl-5";

export default function TeslimatVeIadePage() {
  return (
    <LegalPage title="Teslimat ve İade Şartları">
      <h2 className={h2}>Teslimat</h2>
      <ul className={ul}>
        <li>
          Siparişler <strong>{SIRKET.kargoFirmasi}</strong> ile gönderilir.
        </li>
        <li>
          İş günlerinde <strong>saat 13:30&apos;a kadar</strong> verilen ve onaylanan siparişler aynı gün kargoya
          teslim edilir. Bu saatten sonra, hafta sonu veya resmi tatillerde verilen siparişler bir sonraki iş günü
          kargoya verilir.
        </li>
        <li>
          Kargoya teslim edilen siparişler, teslimat adresine bağlı olarak genellikle 1-3 iş günü içinde ulaştırılır.
          Teslimat süresi hiçbir durumda yasal 30 günlük süreyi aşmaz.
        </li>
        <li>Şu anda tüm siparişlerde kargo ücretsizdir.</li>
        <li>
          Siparişiniz kargoya verildiğinde kargo takip bilgisi &quot;Hesabım › Siparişlerim&quot; sayfasında
          görüntülenir.
        </li>
        <li>
          Teslimat sırasında paketi kontrol etmenizi rica ederiz. Hasarlı paketi teslim almadan kargo görevlisine
          tutanak tutturunuz.
        </li>
      </ul>

      <h2 className={h2}>Cayma Hakkı Süresi</h2>
      <p>
        Tüketici, ürünün kendisine veya gösterdiği adresteki üçüncü kişiye tesliminden itibaren{" "}
        <strong>14 (on dört) gün</strong> içinde herhangi bir gerekçe göstermeksizin ve cezai şart
        ödemeksizin sözleşmeden cayma hakkına sahiptir.
      </p>

      <h2 className={h2}>Cayma Hakkının Kullanımı</h2>
      <ul className={ul}>
        <li>
          Cayma hakkı süresi içinde{" "}
          <a href={`mailto:${SIRKET.email}`} className="underline">
            {SIRKET.email}
          </a>{" "}
          adresine veya {SIRKET.telefonGorunen} numaralı telefona bildirimde bulunulmalıdır.
        </li>
        <li>Ürün, faturası ile birlikte, kullanılmamış ve tekrar satılabilir durumda iade edilmelidir.</li>
        <li>
          Cayma bildiriminin SATICI&apos;ya ulaşmasından itibaren 10 gün içinde ürün SATICI&apos;ya geri
          gönderilmelidir. İade adresi: {SIRKET.adres}.
        </li>
        <li>
          SATICI, cayma bildiriminin kendisine ulaşmasından itibaren en geç 14 gün içinde tahsil edilen tüm ödemeleri,
          ödemenin yapıldığı yönteme uygun şekilde iade eder. Kredi/banka kartı ile yapılan ödemelerde iadenin karta
          yansıma süresi bankaya bağlıdır.
        </li>
      </ul>

      <h2 className={h2}>Cayma Hakkının Kullanılamayacağı Haller</h2>
      <p>Mevzuat gereği aşağıdaki ürünlerde cayma hakkı kullanılamaz:</p>
      <ul className={ul}>
        <li>Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan/kişiselleştirilen ürünler.</li>
        <li>
          Ambalajı, bandrolü, mührü, garanti kaşesi gibi koruyucu unsurları açılmış olan ve iadesi sağlık/hijyen
          açısından uygun olmayan ürünler.
        </li>
        <li>
          Niteliği itibarıyla iade edildikten sonra yeniden satılamayacak ürünler, hızlı bozulan veya son
          kullanma tarihi geçebilecek ürünler.
        </li>
      </ul>

      <h2 className={h2}>İade Kargo Ücreti</h2>
      <p>
        Cayma hakkı kapsamındaki iadelerde kargo ücreti ALICI tarafından karşılanır. Ayıplı, hasarlı veya
        siparişten farklı gönderilen ürünlerin iade kargo ücreti SATICI tarafından karşılanır.
      </p>

      <h2 className={h2}>Ayıplı/Hasarlı Ürün İadesi</h2>
      <p>
        Ayıplı veya hasarlı teslim edilen ürünlerde, cayma hakkı süresinden bağımsız olarak Tüketicinin
        Korunması Hakkında Kanun&apos;dan doğan haklar (ücretsiz onarım, ayıpsız misli ile değiştirme, bedel
        indirimi, sözleşmeden dönme) saklıdır.
      </p>

      <h2 className={h2}>İletişim</h2>
      <p>
        {SIRKET.unvan} ({SIRKET.marka}) — {SIRKET.adres} — {SIRKET.telefonGorunen} — {SIRKET.email}
      </p>
    </LegalPage>
  );
}
