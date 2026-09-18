"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, User } from "lucide-react";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import CartButton from "@/components/CartButton";
import { useFavorites } from "@/components/FavoritesProvider";

export default function HeaderMain({ loggedIn }: { loggedIn: boolean }) {
  const [shrunk, setShrunk] = useState(false);
  const { count: favoriteCount } = useFavorites();

  useEffect(() => {
    function onScroll() {
      setShrunk(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 transition-[padding] duration-150 sm:flex-nowrap sm:gap-5 ${shrunk ? "py-2" : "py-3.5"}`}
    >
      <Link href="/" className="shrink-0">
        <Image
          src="/logo-yatay.svg"
          alt="Tedarikhane"
          width={164}
          height={32}
          priority
          className={`w-auto transition-[height] duration-150 ${shrunk ? "h-6" : "h-8"}`}
        />
      </Link>

      <div className="hidden flex-1 sm:block">
        <SearchAutocomplete />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-4 text-sm sm:gap-5">
        <Link
          href="/hesabim"
          className="hidden items-center gap-1.5 font-medium text-neutral-700 hover:text-[var(--color-brand)] sm:flex"
        >
          <User className="h-[18px] w-[18px]" aria-hidden="true" />
          {loggedIn ? "Hesabım" : "Giriş Yap"}
        </Link>
        <Link
          href="/favoriler"
          className="relative hidden items-center gap-1.5 font-medium text-neutral-700 hover:text-[var(--color-brand)] sm:flex"
        >
          <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
          Favoriler
          {favoriteCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[10px] font-semibold text-white">
              {favoriteCount}
            </span>
          )}
        </Link>
        <CartButton />
      </div>

      <div className="order-3 w-full sm:hidden">
        <SearchAutocomplete />
      </div>
    </div>
  );
}
