import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";

// Üyelik modeli Madde 3 — durum bilgisinin TEK kaynağı. /hesabim,
// /hesabim/uyelik-basvurusu, üstteki hatırlatma banner'ı ve header'daki
// hesap menüsü hepsi bunu kullanıyor, kendi ayrı sorgularını yazmıyor.
export type MembershipStatus =
  | { kind: "guest" }
  // cariHesap: firmanın "cari hesapla ödeme" yetkisi açık mı (Firma.onlineCariHesapAktif, Grup 3).
  | { kind: "approved"; firmaUnvan: string; discountPercent: number | null; cariHesap: boolean }
  | { kind: "pending" }
  | { kind: "rejected" }
  // Hesap var ama hiç MembershipApplication'ı yok — eski (Madde 2 öncesi)
  // kayıt akışından kalma "yetim" hesap. Bkz. Madde 3 hatırlatma banner'ı.
  | { kind: "no_application" };

// react cache(): Header ve anasayfa aynı istekte çağırdığında tek veritabanı sorgusu çalışır.
export const getMembershipStatus = cache(async (): Promise<MembershipStatus> => {
  const session = await getWebSession();
  if (!session) return { kind: "guest" };

  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    include: {
      firma: {
        select: { unvan: true, onlineErisimAktif: true, onlineIskontoOrani: true, onlineCariHesapAktif: true },
      },
      membershipApplications: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!customer) return { kind: "guest" };

  if (customer.firma?.onlineErisimAktif) {
    return {
      kind: "approved",
      firmaUnvan: customer.firma.unvan,
      discountPercent: customer.firma.onlineIskontoOrani,
      cariHesap: customer.firma.onlineCariHesapAktif,
    };
  }

  const latest = customer.membershipApplications[0];
  if (!latest) return { kind: "no_application" };
  if (latest.status === "BEKLIYOR") return { kind: "pending" };
  if (latest.status === "REDDEDILDI") return { kind: "rejected" };
  // ONAYLANDI ama firma.onlineErisimAktif false — normalde olmaz (onay akışı
  // ikisini birlikte set ediyor), tutarsız bir duruma düşülürse güvenli tarafta
  // kal (formu tekrar göster) yerine en azından "beklemede değil" fikrini ver.
  return { kind: "no_application" };
});
