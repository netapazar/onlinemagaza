import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Çerez Politikası" };

const h2 = "mt-6 mb-2 text-base font-semibold text-neutral-900";
const table = "w-full border-collapse text-left text-sm";
const th = "border-b border-neutral-200 py-2 pr-4 font-medium text-neutral-500";
const td = "border-b border-neutral-100 py-2 pr-4";

export default function CerezPolitikasiPage() {
  return (
    <LegalPage title="Çerez Politikası">
      <p>
        Bu politika, internet sitemizi ziyaret ettiğinizde tarayıcınızda kullanılan çerezler (cookie) ve
        benzeri teknolojiler (ör. tarayıcı yerel depolama/localStorage) hakkında sizi bilgilendirmek amacıyla
        hazırlanmıştır.
      </p>

      <h2 className={h2}>Kullandığımız Çerez ve Depolama Türleri</h2>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Tür</th>
              <th className={th}>Amaç</th>
              <th className={th}>Zorunlu mu?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>Oturum çerezi (giriş)</td>
              <td className={td}>Üye girişinizin hatırlanması, hesabınıza güvenli erişim</td>
              <td className={td}>Evet</td>
            </tr>
            <tr>
              <td className={td}>Sepet (tarayıcı yerel depolama)</td>
              <td className={td}>Sepetinize eklediğiniz ürünlerin hatırlanması</td>
              <td className={td}>Evet</td>
            </tr>
            <tr>
              <td className={td}>Analitik çerezler</td>
              <td className={td}>Site kullanımının ölçülmesi, iyileştirilmesi (Google Analytics vb.)</td>
              <td className={td}>Hayır</td>
            </tr>
            <tr>
              <td className={td}>Pazarlama/reklam çerezleri</td>
              <td className={td}>Reklam performansının ölçülmesi (Google Ads vb.)</td>
              <td className={td}>Hayır</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className={h2}>Çerezleri Nasıl Yönetebilirsiniz?</h2>
      <p>
        Tarayıcınızın ayarlarından çerezleri silebilir veya tarayıcınızı çerezlere izin vermeyecek şekilde
        yapılandırabilirsiniz. Zorunlu çerezleri engellemeniz halinde sitenin bazı bölümleri (üyelik girişi,
        sepet) düzgün çalışmayabilir.
      </p>

      <h2 className={h2}>İletişim</h2>
      <p>
        Çerez politikamız hakkında sorularınız için [e-posta] adresinden bize ulaşabilirsiniz.
      </p>
    </LegalPage>
  );
}
