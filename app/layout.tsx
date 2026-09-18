import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/components/CartProvider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-[var(--foreground)]">
        <CartProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
