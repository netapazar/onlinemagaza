import { prisma } from "@/lib/prisma";
import { getWebSession } from "@/lib/webSession";

export async function getMemberDiscountPercent(): Promise<number | null> {
  const session = await getWebSession();
  if (!session) return null;

  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    select: { firma: { select: { onlineErisimAktif: true, onlineIskontoOrani: true } } },
  });
  if (!customer?.firma?.onlineErisimAktif) return null;
  return customer.firma.onlineIskontoOrani ?? null;
}

// Firma kartında "Kargo ücretsiz" işaretli onaylı üye firma (2026-10-13; yalnız CRM yöneticisi işaretler) — bkz. lib/shipping.ts.
export async function getFirmaKargoUcretsiz(): Promise<boolean> {
  const session = await getWebSession();
  if (!session) return false;
  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    select: { firma: { select: { onlineErisimAktif: true, kargoUcretsiz: true } } },
  });
  return Boolean(customer?.firma?.onlineErisimAktif && customer.firma.kargoUcretsiz);
}
