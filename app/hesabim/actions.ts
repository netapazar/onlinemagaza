"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWebSession } from "@/lib/webSession";

export type ApplicationState = {
  error: string | null;
};

export async function submitMembershipApplication(
  _prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const session = await requireWebSession();

  const unvan = String(formData.get("unvan") ?? "").trim();
  const vkn = String(formData.get("vkn") ?? "").trim();
  const telefon = String(formData.get("telefon") ?? "").trim();
  const adres = String(formData.get("adres") ?? "").trim();
  const aciklama = String(formData.get("aciklama") ?? "").trim();

  if (!unvan) {
    return { error: "Firma/işletme adı gerekli." };
  }

  // Aynı anda birden çok bekleyen başvuru olmasın — zaten bekleyen varsa
  // yenisini oluşturmak yerine kullanıcıyı olduğu gibi bırak.
  const existingPending = await prisma.membershipApplication.findFirst({
    where: { webCustomerId: session.webCustomerId, status: "BEKLIYOR" },
  });
  if (existingPending) {
    redirect("/hesabim");
  }

  await prisma.membershipApplication.create({
    data: {
      webCustomerId: session.webCustomerId,
      unvan,
      vkn: vkn || null,
      telefon: telefon || null,
      adres: adres || null,
      aciklama: aciklama || null,
    },
  });

  redirect("/hesabim");
}
