# Tedarikhane — Tasarım Dili

Bu dosya tedarikhane.com vitrininin görsel kurallarını tek yerde toplar. Değerler mevcut koddan çıkarıldı (`app/globals.css`, `app/layout.tsx`, `components/*`). Kodla bu dosya çelişirse önce bu dosyayı güncelle, sonra kodu.

Yeni bir bileşen yazmadan ya da bir ekranı değiştirmeden önce **7. Yapılacaklar / Yapılmayacaklar** bölümünü oku.

---

## 1. Genel Hava

**Kurumsal ama e-ticaret sıcaklığında.** Ziyaretçinin çoğu bir firmanın satın almacısı: aradığını hızlı bulmak, fiyatı ve satış birimini net görmek, siparişi az adımda vermek ister. Site ona "düzenli, ciddi bir tedarikçi" izlenimi verir; ama soğuk bir kurumsal portal da değildir. Ürün görselleri, sıcak bir vurgu rengi ve rahat okunan bir yazı tipi bu dengeyi kurar.

**Yoğun ama düzenli.** Bir ekranda çok ürün ve çok bilgi olabilir; bu bir kusur değil, B2B alıcının beklentisi. Düzen, süslemeyle değil hizayla, sabit satır yükseklikleriyle ve tutarlı boşluklarla sağlanır.

**Güven bilgiyle kurulur.** Güven veren şey somut bilgidir: fiyat KDV dahil mi, en az kaç adet satılıyor, bugün kargoya çıkıyor mu, stokta var mı? Genel vaat cümleleri ("kaliteli hizmet", "müşteri memnuniyeti") güven vermez, yer kaplar.

Üç anahtar kelime: **net · düzenli · sıcak**.

---

## 2. Renk Paleti ve Görevleri

Kaynak: logo paketindeki `renk-kodlari.txt` ve `app/globals.css`. **Yeni renk eklenmez**; gerekirse mevcut skaladan ton seçilir.

### Ana renkler (logodan)

| Ad | Hex | Değişken | Görevi |
|---|---|---|---|
| Petrol (marka) | `#0E6B6B` | `--color-brand` / `brand-600` | Logo, birincil düğme, bağlantı, fiyat, ikon, seçili durum |
| Amber (vurgu) | `#F2A33A` | `--color-accent` / `accent-500` | Yalnız kampanya / fırsat. Logodaki ikinci renk |
| Antrasit (metin) | `#1F2328` | `--foreground` | Gövde metni, başlıklar |
| Gece | `#16181D` | `--color-night` | Üst duyuru çubuğu zemini |

### Petrol skalası (`--color-brand-*`)

| Ton | Hex | Kullanım |
|---|---|---|
| 50 | `#EEFBFA` | Bilgilendirme alanı zemini, "KDV Dahil" etiketi zemini |
| 100 | `#D4F3F1` | Bilgilendirme alanı kenarı |
| 200 | `#A8E6E2` | Bilgi kutusu kenarı (sepet, ürün sayfası) |
| 300 | `#71D1CB` | Kartın üzerine gelindiğinde kenar |
| 400 | `#3FB3AC` | Koyu zemin üstünde petrol (duyuru çubuğu ikonları, hover) |
| 500 | `#189089` | Ara ton; tek başına metin rengi olarak kullanılmaz |
| 600 | `#0E6B6B` | **Ana ton** |
| 700 | `#0B5555` | Düğme hover, açık zemin üstünde küçük petrol metin |
| 800–900 | `#0A4444` – `#093838` | Koyu yüzeyler, nadiren |

### Amber skalası (`--color-accent-*`)

| Ton | Hex | Kullanım |
|---|---|---|
| 50 | `#FFF8EC` | Kampanya bilgi kutusu zemini |
| 500 | `#F2A33A` | Kampanya rozeti / şeridi zemini — **üstüne koyu metin** |
| 600 | `#DB8620` | Kampanya alanı zemini — **üstüne koyu metin** |
| 700 | `#B56818` | Açık zemin üstünde amber metin |

### Nötrler (Tailwind `neutral`)

| Ton | Hex | Kullanım |
|---|---|---|
| Sayfa zemini | `#F4F6F8` | `--background`; bölümler bu zeminde beyaz blok olarak durur |
| Beyaz | `#FFFFFF` | Bölüm blokları, ürün kartları, giriş alanları |
| neutral-100 | `#F5F5F5` | Görsel yer tutucu zemini, nötr etiket zemini |
| neutral-200 | `#E5E5E5` | Kart ve bölüm kenarı, ayraç |
| neutral-300 | `#D4D4D4` | Adet seçici ve form kenarı |
| neutral-500 | `#737373` | İkincil metin (açıklama, birim, "/ adet") — **okunur metin için en açık ton** |
| neutral-600 | `#525252` | Etiket metni, menü bağlantısı |
| neutral-900 | `#171717` | Başlık, ürün adı |

### Durum renkleri

| Durum | Renk | Not |
|---|---|---|
| Başarı ("Eklendi", "Stokta var") | emerald-600 / emerald-700 | Yalnız geçici geri bildirim ve stok metni |
| Hata / uyarı ("Stokta yok", "Kaldır") | red-600 `#DC2626` | red-500 beyaz zeminde 3,8:1 — küçük metinde kullanma |

### Renk görev kuralları

- **Petrol** marka, gezinme, fiyat, birincil eylem ve ikon içindir. Bir ekranda "tıklanabilir ya da önemli" olanı petrol söyler.
- **Amber yalnız kampanya ve fırsat içindir**; bir sayfada en fazla **2** yerde görünür. Normal düğme, başlık ya da süs için kullanılmaz.
- **Açık petrol zemin** (`brand-50` + `brand-100` kenar) bilgilendirme alanıdır: güven şeridi, üyelik bilgisi. Ürün kartları her zaman **beyaz**dır.
- **Kontrast:** Okunur metin en az **4,5:1**. Ölçülmüş oranlar:
  - petrol / beyaz **6,3** ✓
  - neutral-500 / beyaz **4,7** ✓
  - neutral-400 / beyaz **2,5** ✗ — metinde kullanma
  - beyaz / amber-500 **2,1** ✗ — amber üstünde beyaz yazı yok
  - antrasit / amber-500 **7,6** ✓

---

## 3. Yazı

### Yazı tipi

**Plus Jakarta Sans**, `next/font/google` ile, `latin` + `latin-ext` alt kümeleri ve 400 / 500 / 600 / 700 / 800 ağırlıklarıyla yüklenir (`app/layout.tsx`). Logo harfleri vektör olduğu için logo yazı tipinden (Poppins SemiBold) bağımsızdır.

**Türkçe karakter kuralı:** `latin-ext` alt kümesi **kaldırılmaz**. ğ, ş, İ ve ₺ bu alt kümede, ı ise `latin`'de. 2026-10-13'te canlıda doğrulandı: "İĞŞÇÖÜ ığşçöü ₺" Plus Jakarta Sans ile çiziliyor, yedek fonta düşmüyor. Yazı tipi değişirse aynı kontrol yeniden yapılır.

- Büyük harf dönüşümünde Türkçe kural geçerli: `i → İ`, `ı → I`. CSS `uppercase` kullanılan yerde sayfanın `lang="tr"` olması şarttır.
- Ürün ve marka adları veriden geldiği gibi gösterilir; büyük/küçük harf CSS ile zorlanmaz.

Eş aralıklı yazı yalnız kargo takip numarasında kullanılır (Geist Mono, önden yüklenmez).

### Hiyerarşi

| Rol | Boyut | Ağırlık | Satır yüksekliği | Örnek |
|---|---|---|---|---|
| Sayfa başlığı (H1, ürün adı) | 24 px (`text-2xl`) | 700 | 1.25 | Ürün sayfası başlığı |
| Bölüm başlığı (H2) | 22 px mobil / 24 px geniş | 800, `tracking-tight` | 1.25 | "Çok Satanlar" |
| Liste sayfası başlığı | 20–24 px | 600–700 | 1.25 | "Sepetim", "Defter - Ajanda" |
| Kart / kutu başlığı | 16 px | 600 | 1.4 | "Sipariş Özeti" |
| Gövde | 14 px (`text-sm`) | 400–500 | 20 px | Açıklama, menü |
| Ürün adı (kart) | 14 px | 500 | 20 px, en fazla 2 satır | |
| Fiyat (kart) | 16 px | 800, petrol | 1.2 | `12,00 ₺` |
| Fiyat (ürün sayfası) | 24 px | 600 | 1.2 | |
| İkincil / yardımcı | 12 px (`text-xs`) | 400–500 | 16 px | Marka, birim, "KDV Dahil" |
| Etiket | 10–11 px | 500–600 | 14 px | Kart etiketleri — **10 px altına inilmez** |

Para birimi her zaman sayıdan sonra boşlukla yazılır: `1.250,00 ₺`. Birimli fiyatta `/ adet` ikincil renkte ve küçük punto.

---

## 4. Bileşenler

### Düğmeler

Köşe yarıçapı her düğmede `rounded-lg` (8 px). Metin 14 px, 500–600 ağırlık.

| Tür | Görünüm | Ne zaman |
|---|---|---|
| **Birincil** | Petrol zemin, beyaz metin; hover `brand-700` | Sayfadaki asıl eylem: "Sepete Ekle" (kart), "Siparişi Tamamla", "Hemen Al" |
| **İkincil** | Beyaz zemin, petrol 1–2 px kenar, petrol metin; hover `brand-50` zemin | Asıl eylemin yanındaki eylem: ürün sayfasında "Sepete Ekle" ("Hemen Al" birincilken), "Tüm Ürünleri İncele" |
| **Metin bağlantısı** | Petrol metin, hover alt çizgi | "Tümünü Gör", "İncele" |
| **Tehlikeli** | Kırmızı metin bağlantısı | "Kaldır" |
| **Pasif** | `neutral-200` zemin, `neutral-400` metin, `cursor-not-allowed` | Satın alınamaz durumda |

Kurallar:

- Bir görünümde **tek birincil düğme** olur; ürün kartında kartın kendi birincili sayılır.
- Düğme yazısı **kesilmez ve kırılmaz**. Yer yetmiyorsa kart genişliği ya da satırdaki kart sayısı değişir (bkz. Benzer Ürünler'de 4 kart).
- Basınca kısa bir küçülme (`active:scale-95`) olur; tıklama geri bildirimi 1,2 sn "✓ Eklendi" (emerald-600).
- Ok ikonu (→) yalnız başka sayfaya götüren düğmede kullanılır.

### Ürün kartı

Sitenin en çok tekrar eden parçası. Amaç, yan yana kartlarda **her satırın aynı hizada** durması.

- **Kap:** beyaz, 1 px `neutral-200` kenar, `rounded-xl` (12 px), `shadow-sm`. Üzerine gelince 2 px yukarı kalkar, kenarı `brand-300` olur, gölgesi `shadow-md`'ye çıkar.
- **Görsel:** kare (1:1), `neutral-100` zemin, `object-cover`. Görsel yoksa sade yer tutucu (ürün adı + marka) gösterilir; süs ikonu ya da desen kullanılmaz.
- **İçerik sırası ve sabit yükseklikler:**
  1. Marka — 12 px, 16 px satır, tek satır
  2. Ürün adı — 14 px, en fazla 2 satır, 40 px sabit
  3. Kısa açıklama — 12 px, tek satır, 16 px sabit
  4. Etiket satırı — 18 px sabit
  5. Fiyat — petrol, 800 ağırlık
  6. Adet seçici + "Sepete Ekle"
- **İç boşluk:** 10 px (`p-2.5`).
- **Favori:** sağ üstte yuvarlak beyaz düğme; masaüstünde yalnız üzerine gelince, mobilde her zaman görünür.
- **Stok yoksa:** düğme yerine düz metin "Stokta yok". Rozet kullanılmaz.
- **Kurumsal fiyat bağlantısı (karar 2026-10-13):** Onaylı üye olmayan ziyaretçide fiyatın hemen altında **tek satırlık küçük bir bağlantı** durur: "Kurumsal fiyat için giriş yapın". 11 px, petrol metin, kilit ikonu; düğme değil, kenarlığı ya da zemini yok. Giriş yapmış ama onaysız kullanıcıda aynı yerde durumuna uygun tek satır yazılır ("Kurumsal fiyat için başvuru yapın", "Kurumsal başvurunuz inceleniyor"). Onaylı üyede hiç görünmez.
  - **Tek satır her genişlikte korunur:** Kart 205 px'ten darsa ikonsuz 10,5 px kısa metin ("Kurumsal fiyat: giriş yapın", "Kurumsal fiyat: başvurun", "Başvurunuz inceleniyor"); 145 px'ten darsa (320 px telefon) 10 px. Metin değişirse genişlik yeniden ölçülür (`app/globals.css` içindeki ölçüm notu).
- **Büyük üyelik mesajı** (başlıklı, açıklamalı, düğmeli üyelik çağrısı) kartta yer almaz; **bir sayfada yalnız bir kez** görünür (bkz. 4 / Üyelik mesajı).

### Bölüm başlığı

- **Düz metin başlık:** 22 / 24 px, 800 ağırlık, `neutral-900`. **Başına renkli çubuk ya da ikon konmaz.** (2026-10-13 kararı; 7 Ekim'de onaylanan çubuk + ikon kararı geçersizdir.)
- Sağda isteğe bağlı "Tümünü Gör →" metin bağlantısı.
- Başlık ile içerik arası 16 px (`mb-4`).
- Başlığın altında açıklama cümlesi yalnız bilgi taşıyorsa yazılır ("13:30'a kadar verilen siparişler bugün kargoda" gibi). "En iyi ürünleri sizin için seçtik" gibi cümleler yazılmaz.

### Rozetler ve etiketler

İki ayrı şeydir:

| | Rozet | Etiket |
|---|---|---|
| Amaç | Ürünü diğerlerinden **ayırır** | Ürün hakkında **bilgi** verir |
| Yer | Görselin sol alt köşesi | Kart gövdesi, etiket satırı |
| Biçim | `rounded-full`, petrol zemin, beyaz 11 px 600 metin, küçük ikon | `rounded` (4 px), `neutral-100` ya da `brand-50` zemin, 10 px 500 metin |
| Örnek | "Çok Satan" | "50'li paket", "KDV Dahil" |

Kurallar:

- Kartta **en fazla bir rozet** ve şu an tek rozet var: **"Çok Satan"** (yayındaki ilk 10). Çok Satanlar satırının içinde gösterilmez.
- Kampanya rozeti gelirse amber zemin + **koyu metin** olur ve sayfadaki 2 amber hakkından sayılır.
- Etiket **bilgi taşımıyorsa gösterilmez.** "En az Adet" gibi sayısı olmayan etiket yazılmaz; "En az 50 adet" yazılır ya da hiç yazılmaz.
- Her üründe aynı olan bilgi kartta etiket olmaz.
- **KDV kuralı (karar 2026-10-13):** "KDV Dahil" ürün kartlarında yazılmaz. Liste sayfalarında (kategori, arama, Çok Satanlar, Yeni Ürünler, Favoriler) başlığın yanında **bir kez** küçük metin olarak yazılır: "Tüm fiyatlara KDV dahildir." Ana sayfada fiyat gösteren **ilk** ürün satırının başlığı altında bir kez yazılır. Ürün sayfasında fiyatın altında yazmaya devam eder.
- Hap biçimi yalnız rozet ve filtre çipinde kullanılır. Başında nokta (•) olan hap etiket kullanılmaz.

### Form ve adet seçici

- Giriş alanı: beyaz, 1 px `neutral-300` kenar, `rounded-lg`, odakta petrol halka.
- Adet seçici: `− 1 +`, `neutral-300` kenar, `rounded-lg`. Üç boyutu var: `xs` kartta, `sm` sepette, `md` ürün sayfasında.
- Seçim kutusu ve radyo düğmesi `accent-color: petrol`. Satış birimi seçimi satır kartı biçiminde; seçili satır petrol kenar + `brand-50` zemin.

### Üyelik mesajı (karar 2026-10-13)

Kurumsal üyelik sitenin asıl dönüşüm hedefi; bu yüzden mesaj güçlü ama **tek** olmalı.

| Sayfa | Büyük mesajın tek yeri | Kartlarda |
|---|---|---|
| Ana sayfa | Hero (ilk slayt) | Fiyat altında tek satırlık bağlantı |
| Liste sayfaları | Yok (gerekirse sonuçların altında bir şerit) | Fiyat altında tek satırlık bağlantı |
| Ürün sayfası | Satın alma alanının altındaki üyelik kutusu | — |
| Sepet | "Siparişi Tamamla" üstündeki cari hesap kutusu | — |

- Duyuru çubuğundaki "Kurumsal Üyelik" bağlantısı ve menüdeki bağlantı **gezinme** öğesidir, mesaj sayılmaz.
- Onaylı üyeye hiçbir üyelik mesajı gösterilmez; başvurusu bekleyene yalnız durum bilgisi gösterilir.
- Başvurusu yarım kalan hesap (üye olmuş, kurumsal başvuruyu tamamlamamış) her sayfada üst bilginin altındaki hatırlatma bandını görür; bu yüzden ona hero'daki üyelik slaydı gösterilmez — bant o kullanıcı için sayfadaki tek büyük mesajdır.
- Metinler "siz" diliyle yazılır: "giriş yapın", "başvuru yapın".
- Aynı ekranda büyük mesaj varken ona benzeyen ikinci bir kutu, kart ya da şerit eklenmez.

### Gezinme

- **Duyuru çubuğu:** gece zemini, 12 px beyaz metin. Solda tek bir somut vaat ("Tüm siparişlerde ücretsiz kargo"), sağda telefon, Kurumsal Üyelik ve SSS.
- **Ana başlık:** logo, arama (geniş, petrol "Ara" düğmesi), Giriş / Favoriler / Sepet.
- **Kategori satırı:** `neutral-50` zemin, "Tüm Kategoriler" petrol düğme. Satır **1280, 1366, 1440 ve 1536 px'te taşmaz**. 1440'ın altında bağlantılar sıkı ölçüde (13 px, dar yan boşluk), 1440 ve üstünde 14 px. Daha dar ekranda (tablet) satır kaydırılır ve ok düğmesi çıkar. Kategori sayısı artıp 1280'de taşarsa önce bu kural yeniden ele alınır.
- **Mobil:** altta sabit 5 sekmeli çubuk (Ana Sayfa, Kategoriler, Sepet, Giriş, WhatsApp). Kategori satırı mobilde gizli.

---

## 5. Yerleşim

### Kap

- Sayfa içerik genişliği en fazla **1440 px** (`max-w-content`), yan boşluk 16 px (`px-4`).
- Ürün sayfası 1024 px (`max-w-5xl`), sepet 1152 px (`max-w-6xl`), ödeme 672 px (`max-w-2xl`).

### Boşluk ölçeği

Tailwind'in 4 px tabanlı ölçeği kullanılır. Sık kullanılan değerler:

| Değer | Nerede |
|---|---|
| 4–6 px | Etiketler arası, ikon–metin arası |
| 8–12 px | Kart içi öğeler arası, kartlar arası (`gap-3`) |
| 16 px | Başlık–içerik arası (`mb-4`), sayfa yan boşluğu |
| 20 / 24 px | Bölüm bloğu iç boşluğu (`p-5` mobil / `sm:p-6`) |
| 24 px | Bölüm blokları arası (`mb-6`), iki sütunlu düzende sütun arası |
| 32 px | Ürün sayfasında görsel ile bilgi sütunu arası (`gap-8`) |

### Bölüm düzeni

- Sayfa zemini `#F4F6F8`. Her bölüm bu zeminde **tek bir beyaz blok** (`rounded-2xl`, `shadow-sm`, `p-5 sm:p-6`) ya da **tek bir açık petrol blok** (bilgilendirme) olarak durur.
- Ana sayfada blok renkleri sırayla değişir (beyaz / açık petrol); art arda iki açık petrol blok olmaz.
- Ürün satırları geniş ekranda 6 kart (ana sayfa) ya da 4 kart (ürün sayfası, dar kap). Taşan satır kaydırılır, oklar görselin hizasında durur.

### Izgara

- Liste sayfası: geniş ekranda solda 240 px filtre sütunu, sağda kart ızgarası (mobil 2 · `sm` 3 · `xl` 4 · `2xl` 5 sütun).
- Ürün sayfası: iki sütun. Geniş ekranda görsel ve altında Açıklama/Özellikler solda, satın alma alanı sağda.
- Sepet: geniş ekranda solda satırlar, sağda yapışkan "Sipariş Özeti" (340 px).

---

## 6. Derinlik

Gölge azdır; ayrım çoğunlukla zemin rengi ve 1 px kenarla yapılır.

| Seviye | Değer | Nerede |
|---|---|---|
| 0 | Gölge yok, 1 px `neutral-200` kenar | Filtre paneli, form alanı |
| 1 | `shadow-sm` | Bölüm bloğu, ürün kartı, sepet satırları |
| 2 | `shadow-md` | Üzerine gelinen kart, kaydırma ok düğmesi |
| 3 | `shadow-lg` / `shadow-xl` | Açılır menü, sepet çekmecesi, WhatsApp düğmesi |

Köşe yarıçapları: etiket 4 px · düğme / giriş alanı 8 px · kart 12 px · bölüm bloğu 16 px · rozet / çip tam yuvarlak.

**Hareket:** 150–400 ms, yalnız `transform` ve `opacity`. Süs amaçlı sürekli hareket (yüzen, dönen öğe) kullanılmaz; sepet sayacı "zıplaması" gibi geri bildirim hareketleri kalır.

---

## 7. Yapılacaklar / Yapılmayacaklar

### Yap

- Her bilgiyi **somut** yaz: sayı, saat, birim. "Hızlı kargo" değil, "13:30'a kadar verilen siparişler bugün kargoda".
- Ürün kartlarında hizayı sabit satır yükseklikleriyle koru.
- Fotoğraf varsa fotoğraf kullan; ürün görseli her zaman süslemeden önce gelir.
- Mesajı **bir kez ve doğru yerde** söyle: büyük kurumsal üyelik mesajı her sayfada bir kez. Kartlarda yalnız fiyat altındaki tek satırlık bağlantı kalır.
- Petrolü eylem ve fiyat için, amberi yalnız kampanya için kullan.
- Her değişiklikte mobil (360 px) ve 1280 / 1440 px genişlikte bak.

### Yapma

1. **Başlıklarda renkli çubuk + ikon kalıbı.** Bölüm başlığının başına dikey renkli çubuk ve ikon koyma. Başlık düz metindir, ayrımı boşluk ve punto yapar.
2. **Noktalı hap etiketler.** Başında • olan yuvarlak "eyebrow" etiketi ("• B2B Tedarik Platformu") kullanma.
3. **Fotoğraf yerine süs daireleri.** Yarı saydam daireler, bulanık lekeler ya da genel ikonlarla (çanta, %, kutu) boş alan doldurma. Görsel yoksa alanı küçült ya da gerçek ürün görseli kullan.
4. **Kart içinde kart.** Beyaz blok içine kenarlı ve gölgeli ikinci bir beyaz kutu koyma. Gruplama için boşluk, ayraç çizgisi ya da zemin tonu yeterli. (Ürün kartının bölüm bloğu içinde durması bu kuralın istisnasıdır.)
5. **Aynı mesajın tekrarı.** Büyük üyelik mesajını bir sayfada birden çok kez gösterme. Karttaki tek satırlık "Kurumsal fiyat için giriş yap" bağlantısı bu kuralın tek istisnasıdır; düğmeye ya da kutuya dönüştürülmez.
6. **Bilgi vermeyen genel cümleler.** "Kaliteli ürünler", "Müşteri memnuniyeti önceliğimiz", "İşletmenizin tüm ihtiyaçları için" gibi, hangi firma yazsa doğru olacak cümleler yazma.
7. **Bilgi taşımayan etiket.** Sayısı olmayan "En az Adet" ya da her üründe aynı olan "KDV Dahil" gibi etiketleri karta koyma.
8. **Amber üstünde beyaz yazı.** Kontrast 2,1:1; okunmaz.
9. **Yeni renk, emoji ikon, ikinci ikon ailesi.** İkonlar yalnız `components/icons.tsx` ailesinden (24×24, 1,75 çizgi, `currentColor`).
10. **Kesilen metin.** Düğme, menü ya da fiyat yazısının yarım görünmesi hata sayılır.

---

## 8. Duyarlı Davranış

| Kesme noktası | Genişlik | Değişen |
|---|---|---|
| (taban) | < 640 px | Tek sütun; alt gezinme çubuğu; kategori satırı gizli; ürün ızgarası 2 sütun; filtreler "Filtrele" düğmesinin arkasında |
| `sm` | ≥ 640 px | Kategori satırı ve duyuru çubuğunun sağ tarafı görünür; ürün sayfası iki sütun |
| `lg` | ≥ 1024 px | Ürün satırında 6 / 4 kart; ürün sayfasında sekmeler görselin altında; sepette yan özet |

- **Dokunma hedefi** en az 40 × 40 px. Kart içindeki küçük adet düğmeleri bu kurala uymuyor (bkz. Mevcut Sapmalar).
- Mobilde hiçbir sayfa yatay kaydırma üretmez (`scrollWidth = innerWidth`).
- Mobilde uzun satırlar iki kata bölünür, metin kesilmez (bkz. sepet satırı).
- **Hız sınırı:** mobil tam yükleme 2,15 sn'yi geçmez. Yeni görsel ya da yazı tipi ağırlığı eklerken ölçülür.

---

## 9. Ajan / Geliştirici İçin Hızlı Başvuru

**Renk kısa listesi:** petrol `#0E6B6B` (eylem, fiyat) · petrol-700 `#0B5555` (hover) · petrol-50 `#EEFBFA` (bilgi zemini) · amber `#F2A33A` (yalnız kampanya, koyu metinle) · metin `#1F2328` · ikincil metin `#737373` · kenar `#E5E5E5` · zemin `#F4F6F8` · gece `#16181D`.

**Hazır yönlendirmeler:**

- "Ana sayfaya yeni bir ürün satırı ekle: düz metin başlık (22/24 px, 800), sağda 'Tümünü Gör →', altında 6 kartlık kaydırmalı satır; blok beyaz, `rounded-2xl`, `p-5 sm:p-6`; başlığa çubuk ya da ikon koyma."
- "Bir bilgilendirme kutusu yaz: `brand-50` zemin, `brand-100` kenar, `rounded-xl`, solda tek ikon, 14 px 600 başlık + 12 px açıklama; açıklama somut bir bilgi içersin; bulunduğu ekranda aynı mesaj başka yerde geçmesin."
- "Bir kampanya şeridi yap: amber-500 zemin, antrasit metin, sayfada başka amber alanı en fazla bir tane."

---

## Mevcut Sapmalar (bu dosyaya göre düzeltilecekler)

Kod bu dosyanın gerisinde kalan yerler. Tasarım turunda sırayla ele alınacak; bu liste o iş bitince silinir.

| # | Yer | Sapma | Kural |
|---|---|---|---|
| 1 | `SectionHeading.tsx` | Petrol çubuk + ikon (7 Ekim kararı 2026-10-13'te geçersiz sayıldı) — **düzeltildi** (dal `tasarim-sapmalari`) | 7.1 |
| 2 | `HeroSlider.tsx` | "• B2B Tedarik Platformu" noktalı hap | 7.2 |
| 3 | `HeroSlider.tsx`, `PromoBanner.tsx`, `ProductCollage.tsx` | Mobilde fotoğraf yerine yarı saydam daireler + genel ikonlar; sürekli yüzen `animate-float` | 7.3, 6 |
| 4 | `HeroSection.tsx` → `PromoBanner` | "Toplu Alım" kartı amber-600 zemin üstünde beyaz yazı (2,8:1) — **giderildi**: kart artık koyu petrol "Yeni Eklenenler" kısayolu (dal `tasarim-sapmalari`) | 2, 7.8 |
| 5 | `ProductCard.tsx`, liste sayfaları | "En az Adet" (sayısız) ve her kartta "KDV Dahil" etiketi; liste sayfasında tek KDV notu yok — **düzeltildi** (dal `tasarim-sapmalari`) | 4 / Rozetler, 7.7 |
| 6 | `ProductCard.tsx` + `MemberHint` | Her kartta kenarlıklı "Kurumsal fiyat için giriş yapın" düğmesi (tek satırlık bağlantı olmalı) — **düzeltildi** (dal `tasarim-sapmalari`) | 4 / Ürün kartı, 7.5 |
| 7 | Ana sayfa | Büyük üyelik mesajı hero + yan kart + avantaj şeridinde tekrar — **düzeltildi** (dal `tasarim-sapmalari`) | 4 / Üyelik mesajı, 7.5 |
| 8 | `AudienceSection.tsx` ("Kimlere Hizmet Veriyoruz") | Bilgi vermeyen ikon + tek satır kartlar — **bölüm kaldırıldı** (dört kartı da üyelik başvurusuna gidiyordu) | 7.6 |
| 9 | `ProductDetail.tsx`, ürün sayfası | Beyaz blok içinde kenarlı kargo kutusu ve üyelik kutusu (kart içinde kart) | 7.4 |
| 10 | Kart, marka adı | Marka adı `neutral-400` (2,5:1) | 2 / Kontrast |
| 11 | `QuantityStepper` `xs` | Kart içi adet düğmeleri 40 px'in altında | 8 |
| 12 | Kategori satırı | 1280 px'te yine taşıyor, "Kurumsal Üyelik" ok düğmesinin arkasında (1440'ta sığıyor) — **düzeltildi** (dal `tasarim-sapmalari`) | 4 / Gezinme, 7.10 |
