import LegalPage from "@/components/LegalPage";

export const metadata = { title: "KVKK Aydınlatma Metni" };

const h2 = "mt-6 mb-2 text-base font-semibold text-neutral-900";
const ul = "list-disc space-y-1 pl-5";

export default function KvkkPage() {
  return (
    <LegalPage title="Kişisel Verilerin Korunması Kanunu Aydınlatma Metni" updatedNote="6698 sayılı Kişisel Verilerin Korunması Kanunu'na uygun hazırlanmıştır.">
      <h2 className={h2}>Veri Sorumlusu</h2>
      <p>
        [Şirket Unvanı] (&quot;Şirket&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu
        (&quot;KVKK&quot;) uyarınca veri sorumlusu sıfatıyla, kişisel verilerinizi aşağıda açıklanan
        kapsamda işlemekteyiz.
      </p>

      <h2 className={h2}>İşlenen Kişisel Veriler</h2>
      <ul className={ul}>
        <li>Kimlik bilgileri (ad, soyad)</li>
        <li>İletişim bilgileri (e-posta, telefon, teslimat/fatura adresi)</li>
        <li>Müşteri işlem bilgileri (sipariş geçmişi, ödeme yöntemi tercihi)</li>
        <li>İşlem güvenliği bilgileri (şifre hash&apos;i, oturum kaydı)</li>
        <li>Üyelik başvurusu yapan kurumsal müşteriler için vergi kimlik bilgisi</li>
      </ul>

      <h2 className={h2}>Kişisel Verilerin İşlenme Amaçları</h2>
      <ul className={ul}>
        <li>Üyelik/hesap oluşturulması ve yönetilmesi</li>
        <li>Sipariş ve teslimat süreçlerinin yürütülmesi</li>
        <li>Faturalandırma ve yasal yükümlülüklerin yerine getirilmesi</li>
        <li>Müşteri ilişkileri yönetimi ve destek taleplerinin karşılanması</li>
        <li>Kurumsal üyelik/cari hesap değerlendirmesi</li>
        <li>Yasal düzenlemelerin gerektirdiği bilgi saklama, raporlama yükümlülüklerinin yerine getirilmesi</li>
      </ul>

      <h2 className={h2}>Kişisel Verilerin Aktarılması</h2>
      <p>
        Kişisel verileriniz; kargo/lojistik hizmet sağlayıcıları, ödeme kuruluşları, e-fatura/e-arşiv
        entegratörü ve yasal olarak yetkili kamu kurum ve kuruluşları ile, KVKK&apos;nın 8. ve 9. maddelerinde
        belirtilen şartlar çerçevesinde paylaşılabilir.
      </p>

      <h2 className={h2}>Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
      <p>
        Kişisel verileriniz, internet sitemiz üzerinden elektronik ortamda, üyelik/sipariş formları
        aracılığıyla; sözleşmenin kurulması ve ifası, kanunlarda açıkça öngörülmesi ve meşru menfaat hukuki
        sebeplerine dayanılarak toplanmaktadır.
      </p>

      <h2 className={h2}>KVKK Madde 11 Kapsamındaki Haklarınız</h2>
      <p>KVKK&apos;nın 11. maddesi uyarınca herkes, veri sorumlusuna başvurarak kendisiyle ilgili;</p>
      <ul className={ul}>
        <li>Kişisel veri işlenip işlenmediğini öğrenme,</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
        <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li>Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
        <li>Eksik/yanlış işlenmişse düzeltilmesini isteme,</li>
        <li>Silinmesini veya yok edilmesini isteme,</li>
        <li>Düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme,</li>
        <li>Otomatik sistemlerle analiz edilerek aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
        <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme,</li>
      </ul>
      <p>haklarına sahiptir. Bu haklarınızı kullanmak için [e-posta] adresine yazılı olarak başvurabilirsiniz.</p>
    </LegalPage>
  );
}
