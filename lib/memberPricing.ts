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
