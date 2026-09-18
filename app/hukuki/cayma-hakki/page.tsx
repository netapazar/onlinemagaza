import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Cayma Hakkı ve İade Koşulları" };

const h2 = "mt-6 mb-2 text-base font-semibold text-neutral-900";
const ul = "list-disc space-y-1 pl-5";

export default function CaymaHakkiPage() {
  return (
    <LegalPage title="Cayma Hakkı ve İade Koşulları">
      <h2 className={h2}>Cayma Hakkı Süresi</h2>
      <p>
        Tüketici, ürünün kendisine veya gösterdiği adresteki üçüncü kişiye tesliminden itibaren{" "}
        <strong>14 (on dört) gün</strong> içinde herhangi bir gerekçe göstermeksizin ve cezai şart
        ödemeksizin sözleşmeden cayma hakkına sahiptir.
      </p>

      <h2 className={h2}>Cayma Hakkının Kullanımı</h2>
      <ul className={ul}>
        <li>
          Cayma hakkı süresi içinde [e-posta adresi] adresine veya [telefon numarası] üzerinden yazılı
          bildirimde bulunulmalıdır.
        </li>
        <li>Ürün, faturası ile birlikte, kullanılmamış ve tekrar satılabilir durumda iade edilmelidir.</li>
        <li>
          Cayma bildiriminin SATICI&apos;ya ulaşmasından itibaren 10 gün içinde ürün SATICI&apos;ya geri
          gönderilmelidir.
        </li>
        <li>
          SATICI, cayma bildiriminin kendisine ulaşmasından itibaren en geç 14 gün içinde, varsa ürünü teslim
          alan üçüncü kişiye ait teslimat masrafları hariç, tahsil edilen tüm ödemeleri iade eder.
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
      <p className="text-xs text-neutral-400">
        [Not: satışa sunulan ürünlere göre bu istisna listesi hukuk danışmanı tarafından gözden geçirilmelidir.]
      </p>

      <h2 className={h2}>İade Kargo Ücreti</h2>
      <p>
        Cayma hakkının usulüne uygun kullanılması halinde iade kargo ücreti [SATICI tarafından karşılanır /
        ALICI tarafından karşılanır — netleşince belirtilecek].
      </p>

      <h2 className={h2}>Ayıplı/Hasarlı Ürün İadesi</h2>
      <p>
        Ayıplı veya hasarlı teslim edilen ürünlerde, cayma hakkı süresinden bağımsız olarak Tüketicinin
        Korunması Hakkında Kanun&apos;dan doğan haklar (ücretsiz onarım, ayıpsız misli ile değiştirme, bedel
        indirimi, sözleşmeden dönme) saklıdır.
      </p>
    </LegalPage>
  );
}
