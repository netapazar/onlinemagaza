import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";

export const metadata = { title: "Sıkça Sorulan Sorular" };

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Nasıl sipariş verebilirim?",
    answer:
      "Ürünü sepete ekleyip 'Siparişi Tamamla' butonuna tıklayarak, üye olmadan da misafir olarak sipariş verebilirsiniz. Üye olursanız size özel indirimli fiyatlardan alışveriş yapabilirsiniz.",
  },
  {
    question: "Üye olmanın avantajı ne?",
    answer:
      "Üyelik başvurunuz onaylandığında size özel indirimli fiyatlardan alışveriş yapabilir, uygun olduğunuz durumlarda cari hesabınıza işleyerek ödemeyi sonraya bırakabilirsiniz.",
  },
  {
    question: "Cari hesapla ödeme nedir, kimler kullanabilir?",
    answer:
      "Onaylı kurumsal üyelerimiz, siparişlerini anında ödeme yapmadan cari hesaplarına işletebilir. Bu seçenek yalnızca üyelik başvurusu onaylanmış hesaplarda checkout ekranında görünür.",
  },
  {
    question: "Siparişim ne zaman kargoya verilir?",
    answer:
      "Saat 13:30'a kadar verilen ve onaylanan siparişler aynı gün kargoya teslim edilir. Bu saatten sonra alınan siparişler bir sonraki iş günü kargoya verilir.",
  },
  {
    question: "Kargo ücreti ne kadar?",
    answer:
      "Kargo ücretlendirmesi şu anda geçerli değildir, tüm siparişler ücretsiz kargo ile gönderilmektedir. [Kargo firması ve olası ücret politikası netleştiğinde bu bölüm güncellenecektir.]",
  },
  {
    question: "Siparişimi nasıl iade edebilirim?",
    answer:
      "Ürünü teslim aldıktan sonra 14 gün içinde, kullanılmamış ve orijinal ambalajında olmak koşuluyla iade edebilirsiniz. Detaylar için Cayma Hakkı ve İade Koşulları sayfamızı inceleyebilirsiniz.",
  },
  {
    question: "Hangi ödeme yöntemlerini kullanabilirim?",
    answer:
      "Kredi/banka kartı, havale/EFT ve (onaylı üyeler için) cari hesap seçenekleriyle ödeme yapabilirsiniz.",
  },
  {
    question: "Faturam ne zaman kesilir?",
    answer:
      "Kurumsal (cari hesaplı) siparişlerde faturanız otomatik olarak e-Fatura sistemi üzerinden kesilir. Diğer siparişlerde faturanız ekibimiz tarafından düzenlenip tarafınıza iletilir.",
  },
  {
    question: "Sipariş verdiğim ürün stokta görünmüyor, ne zaman gelir?",
    answer:
      "Stokta olmayan ürünler için sipariş alınamaz. Ürün tekrar stoğa girdiğinde ürün sayfası güncellenir.",
  },
];

export default function SssPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Sıkça Sorulan Sorular</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Aradığınız cevabı bulamazsanız bizimle iletişime geçebilirsiniz.
      </p>
      <FaqAccordion items={FAQ_ITEMS} />
    </div>
  );
}
