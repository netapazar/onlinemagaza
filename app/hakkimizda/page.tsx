import LegalPage from "@/components/LegalPage";
import { SIRKET } from "@/lib/sirket";

export const metadata = { title: "Hakkımızda" };

const h2 = "mt-6 mb-2 text-base font-semibold text-neutral-900";
const ul = "list-disc space-y-1 pl-5";

export default function HakkimizdaPage() {
  return (
    <LegalPage title="Hakkımızda">
      <p>
        {SIRKET.marka}, Uşak&apos;ta faaliyet gösteren ofis ve kırtasiye mağazalarımızın çevrimiçi satış kanalıdır.
        Şehir merkezindeki <strong>3 şubemiz</strong> ve kurumlara hizmet veren <strong>pazarlama ağımızla</strong>{" "}
        yıllardır biriktirdiğimiz tedarik deneyimini, işletmelerin ve bireysel müşterilerin hizmetine internet
        üzerinden de sunuyoruz.
      </p>

      <h2 className={h2}>Ne Yapıyoruz?</h2>
      <ul className={ul}>
        <li>Kırtasiye, ofis malzemeleri, kâğıt ürünleri, dosyalama ve arşiv ürünleri, okul ihtiyaçları.</li>
        <li>Fabrikalar, ofisler, okullar ve kurumlar için düzenli toplu tedarik.</li>
        <li>Bireysel müşterilere evden, iş yerinden kolay sipariş.</li>
      </ul>

      <h2 className={h2}>Kurumsal Müşterilerimiz İçin</h2>
      <p>
        Kurumsal üyelerimiz, onaylı hesaplarında kendilerine özel fiyatlarla alışveriş yapabilir; uygun görülen
        firmalar siparişlerini cari hesaplarına işleterek ödemeyi sonraya bırakabilir. Pazarlama ekibimiz, firmanızın
        ihtiyaç listesine göre size özel teklif hazırlar.
      </p>

      <h2 className={h2}>Neden {SIRKET.marka}?</h2>
      <ul className={ul}>
        <li>Mağazalarımızın stoğundan hızlı tedarik.</li>
        <li>İş günlerinde 13:30&apos;a kadar verilen siparişlerde aynı gün kargo ({SIRKET.kargoFirmasi}).</li>
        <li>Kredi/banka kartı ile güvenli ödeme, havale/EFT ve kurumsal üyeler için cari hesap seçeneği.</li>
        <li>Her siparişte e-fatura/e-arşiv fatura.</li>
      </ul>

      <h2 className={h2}>İletişim</h2>
      <ul className={ul}>
        <li>
          <strong>Ünvan:</strong> {SIRKET.unvan}
        </li>
        <li>
          <strong>Adres:</strong> {SIRKET.adres}
        </li>
        <li>
          <strong>Telefon:</strong>{" "}
          <a href={SIRKET.telefonHref} className="underline">
            {SIRKET.telefonGorunen}
          </a>
        </li>
        <li>
          <strong>E-posta:</strong>{" "}
          <a href={`mailto:${SIRKET.email}`} className="underline">
            {SIRKET.email}
          </a>
        </li>
      </ul>
    </LegalPage>
  );
}
