import Link from "next/link";
import { getWebSession } from "@/lib/webSession";
import SearchBox from "@/components/SearchBox";
import CartButton from "@/components/CartButton";

export default async function Header() {
  const session = await getWebSession();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-neutral-900">
          Online Mağaza
        </Link>

        <div className="order-3 w-full sm:order-2 sm:flex-1">
          <SearchBox />
        </div>

        <div className="order-2 ml-auto flex items-center gap-4 text-sm sm:order-3">
          <CartButton />
          {session ? (
            <Link href="/hesabim" className="font-medium text-neutral-700 hover:text-neutral-900">
              Hesabım
            </Link>
          ) : (
            <>
              <Link href="/uyelik/giris" className="font-medium text-neutral-700 hover:text-neutral-900">
                Giriş Yap
              </Link>
              <Link
                href="/uyelik/kayit"
                className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
              >
                Üye Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
