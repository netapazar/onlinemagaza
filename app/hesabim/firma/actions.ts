"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWebSession } from "@/lib/webSession";
import { notifyFirmaBilgiTalebi, runAfterResponse } from "@/lib/email/notifications";

export type TalepState = { error: string | null; done: boolean };

const FIELDS = ["unvan", "vkn", "vergiDairesi", "faturaAdresi"] as const;
type Field = (typeof FIELDS)[number];

const clean = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// Onaylı kurumsal üye firma bilgilerini DOĞRUDAN değiştiremez (faturalar bu bilgilerle kesilir); değişiklik
// talebi bırakır, CRM'de onaylanınca firma kartına işlenir. Aynı anda tek bekleyen talep olabilir.
export async function submitFirmaBilgiTalebi(_prev: TalepState, formData: FormData): Promise<TalepState> {
  const session = await requireWebSession();
  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    select: {
      id: true,
      firma: { select: { id: true, onlineErisimAktif: true, unvan: true, vkn: true, vergiDairesi: true, faturaAdresi: true } },
    },
  });
  const firma = customer?.firma;
  if (!customer || !firma?.onlineErisimAktif) return { error: "Bu işlem yalnız onaylı kurumsal üyeler içindir.", done: false };

  const pending = await prisma.firmaBilgiTalebi.findFirst({ where: { firmaId: firma.id, durum: "BEKLIYOR" }, select: { id: true } });
  if (pending) return { error: "İncelenmekte olan bir talebiniz var; sonuçlanınca yeni talep bırakabilirsiniz.", done: false };

  const next: Record<Field, string> = {
    unvan: clean(formData.get("unvan"), 250),
    vkn: clean(formData.get("vkn"), 11).replace(/\s/g, ""),
    vergiDairesi: clean(formData.get("vergiDairesi"), 100),
    faturaAdresi: clean(formData.get("faturaAdresi"), 500),
  };
  const musteriNotu = clean(formData.get("not"), 1000);

  if (next.unvan.length < 2) return { error: "Unvan girin.", done: false };
  if (!/^\d{10}$|^\d{11}$/.test(next.vkn)) return { error: "Vergi Kimlik No 10, TC Kimlik No 11 haneli olmalı.", done: false };

  const istenen: Partial<Record<Field, string>> = {};
  const mevcut: Partial<Record<Field, string | null>> = {};
  for (const f of FIELDS) {
    const current = (firma[f] ?? "").trim();
    if (next[f] !== current) {
      istenen[f] = next[f];
      mevcut[f] = firma[f] ?? null;
    }
  }
  if (Object.keys(istenen).length === 0) return { error: "Değişiklik yapmadınız.", done: false };

  const talep = await prisma.firmaBilgiTalebi.create({
    data: { firmaId: firma.id, webCustomerId: customer.id, istenen, mevcut, musteriNotu: musteriNotu || null },
    select: { id: true },
  });
  runAfterResponse("FIRMA_BILGI_TALEBI", () => notifyFirmaBilgiTalebi(talep.id));
  revalidatePath("/hesabim/firma");
  return { error: null, done: true };
}
