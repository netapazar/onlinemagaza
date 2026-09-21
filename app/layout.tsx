import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import CartDrawer from "@/components/CartDrawer";
import CartToast from "@/components/CartToast";
import { CartProvider } from "@/components/CartProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import { getWebSession } from "@/lib/webSession";
import { getMembershipStatus } from "@/lib/membershipStatus";
import { MemberHintProvider } from "@/components/MemberHint";
import { getStorefrontCategoriesWithCounts } from "@/lib/search";
import "./globals.css";

// Logo harfleri zaten vektöre çevrilmiş olduğundan font kurulumu logonun
// kendisi için şart değil; site genelinde daha modern/kurumsal bir görünüm
// için Plus Jakarta Sans kullanılıyor. latin-ext alt kümesi Türkçe karakterler
// (ş, ğ, ı, ö, ü, ç) için gerekli.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tedarikhane.com"),
  title: "Tedarikhane",
  description: "Tedarikhane — Online Mağaza",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // getMembershipStatus React cache() içinde — Header/sayfalardaki çağrılarla aynı istekte tek sorgu.
  const [session, categories, membershipStatus] = await Promise.all([
    getWebSession(),
    getStorefrontCategoriesWithCounts(),
    getMembershipStatus(),
  ]);

  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        <CartProvider>
          <FavoritesProvider>
            <MemberHintProvider kind={membershipStatus.kind}>
              <Header />
              <main className="flex flex-1 flex-col pb-16 sm:pb-0">{children}</main>
              <Footer />
              <WhatsAppButton />
              <MobileBottomNav loggedIn={Boolean(session)} categories={categories} />
              <CartDrawer />
              <CartToast />
            </MemberHintProvider>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
