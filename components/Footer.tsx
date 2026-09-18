import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-neutral-500 sm:flex-row sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/sss" className="hover:text-neutral-900">
            Sıkça Sorulan Sorular
          </Link>
          <Link href="/hukuki/mesafeli-satis-sozlesmesi" className="hover:text-neutral-900">
            Mesafeli Satış Sözleşmesi
          </Link>
          <Link href="/hukuki/cayma-hakki" className="hover:text-neutral-900">
            Cayma Hakkı ve İade
          </Link>
          <Link href="/hukuki/kvkk" className="hover:text-neutral-900">
            KVKK Aydınlatma Metni
          </Link>
          <Link href="/hukuki/cerez-politikasi" className="hover:text-neutral-900">
            Çerez Politikası
          </Link>
        </div>
        <p>© {new Date().getFullYear()} Online Mağaza</p>
      </div>
    </footer>
  );
}
