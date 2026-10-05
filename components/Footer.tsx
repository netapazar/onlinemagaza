import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getStorefrontCategoriesWithCounts } from "@/lib/search";
import { getSiteInfo } from "@/lib/siteInfo";
import { SIRKET } from "@/lib/sirket";
import SocialIcon from "@/components/SocialIcons";

// WhatsApp hattı (bkz. AnnouncementBar/WhatsAppButton); işletme telefonu/e-posta/adres lib/sirket.ts'ten.
const WHATSAPP_DISPLAY = "0551 487 21 74";
const WHATSAPP_HREF = "https://wa.me/905514872174";

export default async function Footer() {
  const categories = await getStorefrontCategoriesWithCounts();
  // Adres / e-posta / çalışma saatleri / sosyal medya ortam değişkenlerinden gelir (bkz. lib/siteInfo.ts); tanımsızsa GİZLİ.
  const info = getSiteInfo();
  // Ortam değişkeni tanımlı değilse işletme bilgisine düşülür (iyzico başvurusu: iletişim bilgileri sitede görünmeli).
  const email = info.email ?? SIRKET.email;
  const address = info.address ?? [SIRKET.adres];

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-content gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Image src="/logo-yatay.svg" alt="Tedarikhane" width={148} height={29} className="mb-3 h-7 w-auto" />
          <p className="mb-3 text-sm text-neutral-500">
            İşletmenizin ve evinizin tüm ofis/kırtasiye tedarik ihtiyacı için tek adres.
          </p>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li>
              <a href={SIRKET.telefonHref} className="flex items-center gap-1.5 hover:text-[var(--color-brand)]">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {SIRKET.telefonGorunen}
              </a>
            </li>
            <li>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[var(--color-brand)]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                WhatsApp: {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`mailto:${email}`} className="flex items-center gap-1.5 break-all hover:text-[var(--color-brand)]">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {email}
              </a>
            </li>
            {address && (
              <li className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {address.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            )}
            {info.hours && (
              <li className="flex items-start gap-1.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {info.hours.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            )}
          </ul>
          {info.social.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              {info.social.map((s) => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                >
                  <SocialIcon name={s.key} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">Kurumsal</h3>
          <ul className="space-y-2 text-sm text-neutral-500">
            <li>
              <Link href="/hakkimizda" className="hover:text-[var(--color-brand)]">
                Hakkımızda
              </Link>
            </li>
            <li>
              <Link href="/hesabim/uyelik-basvurusu" className="hover:text-[var(--color-brand)]">
                Kurumsal Üyelik
              </Link>
            </li>
            <li>
              <Link href="/cok-satanlar" className="hover:text-[var(--color-brand)]">
                Çok Satanlar
              </Link>
            </li>
            <li>
              <Link href="/urunler?sirala=yeni" className="hover:text-[var(--color-brand)]">
                Yeni Ürünler
              </Link>
            </li>
            <li>
              <Link href="/sss" className="hover:text-[var(--color-brand)]">
                Sıkça Sorulan Sorular
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">Müşteri Hizmetleri</h3>
          <ul className="space-y-2 text-sm text-neutral-500">
            <li>
              <Link href="/hukuki/mesafeli-satis-sozlesmesi" className="hover:text-[var(--color-brand)]">
                Mesafeli Satış Sözleşmesi
              </Link>
            </li>
            <li>
              <Link href="/hukuki/teslimat-ve-iade" className="hover:text-[var(--color-brand)]">
                Teslimat ve İade Şartları
              </Link>
            </li>
            <li>
              <Link href="/hukuki/gizlilik-politikasi" className="hover:text-[var(--color-brand)]">
                Gizlilik Politikası
              </Link>
            </li>
            <li>
              <Link href="/hukuki/kvkk" className="hover:text-[var(--color-brand)]">
                KVKK Aydınlatma Metni
              </Link>
            </li>
            <li>
              <Link href="/hukuki/cerez-politikasi" className="hover:text-[var(--color-brand)]">
                Çerez Politikası
              </Link>
            </li>
          </ul>
        </div>

        {categories.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Kategoriler</h3>
            <ul className="space-y-2 text-sm text-neutral-500">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/urunler?kategori=${c.id}`} className="hover:text-[var(--color-brand)]">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-4 py-4 text-xs text-neutral-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Tedarikhane. Tüm hakları saklıdır.</p>
          {/* iyzico logo paketi (footer bandı): iyzico ile Öde, Mastercard, Visa, American Express, Troy */}
          <Image
            src="/odeme/iyzico-logo-bandi.svg"
            alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
            width={429}
            height={32}
            className="h-6 w-auto max-w-full sm:h-7"
          />
        </div>
      </div>
    </footer>
  );
}
