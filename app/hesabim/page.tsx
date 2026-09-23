import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Heart, KeyRound, MapPin, Package, RotateCcw, UserRound } from "lucide-react";
import type { ComponentType } from "react";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";
import { getMembershipStatus } from "@/lib/membershipStatus";
import { logout } from "@/app/uyelik/actions";
import ResendVerification from "./ResendVerification";
import { emailVerificationEnabled } from "@/lib/featureFlags";
import { centsToTl } from "@/lib/pricing";
import { formatOrderDate, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/orderStatus";
import { orderNo } from "@/lib/email/render";

export const metadata = { title: "Hesabım", robots: { index: false } };

type Shortcut = { href: string; label: string; hint: string; icon: ComponentType<{ className?: string }> };

export default async function HesabimPage() {
  const session = await getWebSession();
  if (!session) redirect("/uyelik/giris");

  const [customer, status, recentOrders, orderCount] = await Promise.all([
    prisma.webCustomer.findUnique({
      where: { id: session.webCustomerId },
      select: { name: true, email: true, phone: true, emailVerifiedAt: true },
    }),
    getMembershipStatus(),
    prisma.webOrder.findMany({
      where: { webCustomerId: session.webCustomerId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, createdAt: true, status: true, totalCents: true, _count: { select: { items: true } } },
    }),
    prisma.webOrder.count({ where: { webCustomerId: session.webCustomerId } }),
  ]);
  if (!customer) redirect("/uyelik/giris");

  const approved = status.kind === "approved";
  const shortcuts: Shortcut[] = [
    { href: "/hesabim/siparisler", label: "Siparişlerim", hint: orderCount ? `${orderCount} sipariş` : "Henüz sipariş yok", icon: Package },
    { href: "/hesabim/adresler", label: "Adreslerim", hint: "Teslimat ve fatura adresleri", icon: MapPin },
    { href: "/favoriler", label: "Favoriler", hint: "Beğendiğiniz ürünler", icon: Heart },
    { href: "/hesabim/sik-aldiklarim", label: "Sık Aldıklarım", hint: "Tekrar sipariş", icon: RotateCcw },
    { href: "/hesabim/profil", label: "Profil Bilgilerim", hint: "Ad soyad, telefon", icon: UserRound },
    { href: "/hesabim/sifre", label: "Şifre Değiştir", hint: "Hesap güvenliği", icon: KeyRound },
    ...(approved ? [{ href: "/hesabim/firma", label: "Firma Bilgilerim", hint: "Fatura bilgileri", icon: Building2 }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Hesabım</h1>
          <p className="text-sm text-neutral-500">
            {customer.name} · {customer.email}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-neutral-500 underline hover:text-neutral-800">
            Çıkış Yap
          </button>
        </form>
      </div>

      {emailVerificationEnabled() && !customer.emailVerifiedAt && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-1 text-sm font-medium text-amber-900">E-posta adresiniz doğrulanmadı</h2>
          <p className="mb-3 text-sm text-amber-800">
            {customer.email} adresine gönderdiğimiz bağlantıyla doğrulayabilirsiniz. Doğrulama yapmadan da alışveriş
            yapabilirsiniz; ancak firma üyeliği başvurunuzun değerlendirilmesinde doğrulanmış adres bize yardımcı olur.
          </p>
          <ResendVerification />
        </div>
      )}

      {/* Kısayollar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shortcuts.map(({ href, label, hint, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]"
          >
            <Icon className="h-5 w-5 text-[var(--color-brand)]" />
            <span className="text-sm font-medium text-neutral-900">{label}</span>
            <span className="text-xs text-neutral-500">{hint}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Son siparişler */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Son Siparişlerim</h2>
            {orderCount > 0 && (
              <Link href="/hesabim/siparisler" className="text-xs font-medium text-[var(--color-brand)] hover:underline">
                Tümü
              </Link>
            )}
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Henüz siparişiniz yok.{" "}
              <Link href="/urunler" className="font-medium text-[var(--color-brand)] hover:underline">
                Alışverişe başlayın
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/hesabim/siparisler/${order.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-neutral-50">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Sipariş #{orderNo(order.id)}</p>
                      <p className="text-xs text-neutral-500">
                        {formatOrderDate(order.createdAt)} · {order._count.items} kalem
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_TONE[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">{centsToTl(order.totalCents)} ₺</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Kurumsal üyelik + cari hesap */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Kurumsal Üyelik</h2>
          {status.kind === "approved" ? (
            <div className="space-y-3 text-sm">
              <p className="text-green-700">
                Onaylı kurumsal üyesiniz — <span className="font-medium">{status.firmaUnvan}</span>
              </p>
              {status.discountPercent ? (
                <p className="text-neutral-700">Size özel %{status.discountPercent} indirim uygulanıyor.</p>
              ) : null}
              <p className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                <span className="text-neutral-600">Cari hesapla ödeme</span>
                {status.cariHesap ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Açık</span>
                ) : (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">Kapalı</span>
                )}
              </p>
              <Link href="/hesabim/firma" className="inline-block text-xs font-medium text-[var(--color-brand)] hover:underline">
                Firma bilgilerimi görüntüle
              </Link>
            </div>
          ) : status.kind === "pending" ? (
            <p className="text-sm text-amber-700">Üyelik başvurunuz inceleniyor.</p>
          ) : status.kind === "rejected" ? (
            <div className="space-y-2">
              <p className="text-sm text-red-700">Üyelik başvurunuz onaylanmadı.</p>
              <Link href="/hesabim/uyelik-basvurusu" className="text-sm font-medium underline">
                Tekrar başvur
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Firma/işletme üyeliği başvurusu yaparsanız size özel fiyatlardan alışveriş yapabilirsiniz.
              </p>
              <Link
                href="/hesabim/uyelik-basvurusu"
                className="inline-block rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
              >
                Üyelik Başvurusu Yap
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
