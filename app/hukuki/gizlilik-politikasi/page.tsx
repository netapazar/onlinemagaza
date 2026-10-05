import LegalPage from "@/components/LegalPage";
import { SIRKET } from "@/lib/sirket";

export const metadata = { title: "Gizlilik Politikası" };

const h2 = "mt-6 mb-2 text-base font-semibold text-neutral-900";
const ul = "list-disc space-y-1 pl-5";

export default function GizlilikPolitikasiPage() {
  return (
    <LegalPage title="Gizlilik Politikası">
      <p>
        {SIRKET.unvan} ({SIRKET.marka}) olarak, {SIRKET.site} adresli internet sitemizi kullanan ziyaretçilerimizin ve
        müşterilerimizin gizliliğine önem veriyoruz. Bu politika, sitemizi kullanırken paylaştığınız bilgilerin nasıl
        toplandığını, kullanıldığını ve korunduğunu açıklar.
      </p>

      <h2 className={h2}>Toplanan Bilgiler</h2>
      <ul className={ul}>
        <li>Üyelik ve sipariş sırasında girdiğiniz ad, soyad, e-posta, telefon ve teslimat/fatura adresi bilgileri.</li>
        <li>Kurumsal üyelik başvurularında firma ünvanı, vergi dairesi ve vergi kimlik numarası.</li>
        <li>Sipariş geçmişi ve tercih ettiğiniz ödeme yöntemi.</li>
        <li>Sitenin çalışması için gerekli oturum ve sepet bilgileri (bkz. Çerez Politikası).</li>
      </ul>

      <h2 className={h2}>Bilgilerin Kullanımı</h2>
      <ul className={ul}>
        <li>Siparişlerinizin alınması, hazırlanması, faturalandırılması ve teslim edilmesi.</li>
        <li>Üyelik hesabınızın oluşturulması ve yönetilmesi.</li>
        <li>Sipariş durumu, kargo bilgisi ve hesabınızla ilgili bilgilendirmelerin iletilmesi.</li>
        <li>Yasal yükümlülüklerin (fatura, vergi mevzuatı vb.) yerine getirilmesi.</li>
      </ul>
      <p>Bilgileriniz yukarıdaki amaçlar dışında kullanılmaz, satılmaz ve kiralanmaz.</p>

      <h2 className={h2}>Ödeme Güvenliği</h2>
      <p>
        Kredi/banka kartı ile yapılan ödemeler, lisanslı ödeme kuruluşu <strong>iyzico</strong> altyapısı üzerinden
        alınır. Kart bilgileriniz doğrudan ödeme kuruluşuna iletilir; {SIRKET.marka} kart numaranızı, son kullanma
        tarihini veya güvenlik kodunu (CVV) görmez ve saklamaz. Sitemizdeki tüm veri iletişimi SSL sertifikası ile
        şifrelenir.
      </p>

      <h2 className={h2}>Bilgilerin Paylaşılması</h2>
      <p>
        Bilgileriniz yalnızca hizmetin yerine getirilmesi için gerekli olduğu ölçüde; kargo firması ({SIRKET.kargoFirmasi}),
        ödeme kuruluşu, e-fatura/e-arşiv hizmet sağlayıcısı ve yasal olarak yetkili kamu kurumlarıyla paylaşılır.
      </p>

      <h2 className={h2}>Bilgilerin Korunması</h2>
      <p>
        Hesap şifreleri geri döndürülemez şekilde şifrelenmiş (hash) olarak saklanır. Kişisel verilere erişim, yalnızca
        işi gereği yetkilendirilmiş personelle sınırlıdır.
      </p>

      <h2 className={h2}>Haklarınız</h2>
      <p>
        Kişisel verilerinizle ilgili haklarınız ve başvuru yöntemi için{" "}
        <a href="/hukuki/kvkk" className="underline">
          KVKK Aydınlatma Metni
        </a>
        &apos;ni inceleyebilirsiniz.
      </p>

      <h2 className={h2}>İletişim</h2>
      <p>
        Gizlilik politikamızla ilgili sorularınız için{" "}
        <a href={`mailto:${SIRKET.email}`} className="underline">
          {SIRKET.email}
        </a>{" "}
        adresinden veya {SIRKET.telefonGorunen} numaralı telefondan bize ulaşabilirsiniz.
      </p>
    </LegalPage>
  );
}
