"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWebSession } from "@/lib/webSession";
import { parseAddress } from "@/lib/addressCore";

export type AddressFormState = { error: string | null; done: boolean };

const MAX_ADDRESSES = 20;

// Oluştur veya güncelle (formda "id" varsa güncelleme). Adres müşteriye ait değilse hiçbir şey yazılmaz.
// İlk adres otomatik olarak varsayılan teslimat + fatura adresi olur.
export async function saveAddress(_prev: AddressFormState, formData: FormData): Promise<AddressFormState> {
  const session = await requireWebSession();
  const parsed = parseAddress((k) => formData.get(k));
  if (!parsed.ok) return { error: parsed.error, done: false };
  const id = String(formData.get("id") ?? "");
  const makeDefaultShipping = formData.get("isDefaultShipping") === "on";
  const makeDefaultBilling = formData.get("isDefaultBilling") === "on";

  const result = await prisma.$transaction(async (tx) => {
    const count = await tx.webCustomerAddress.count({ where: { webCustomerId: session.webCustomerId } });
    let addressId: string;
    if (id) {
      const updated = await tx.webCustomerAddress.updateMany({
        where: { id, webCustomerId: session.webCustomerId },
        data: parsed.value,
      });
      if (updated.count !== 1) return "Adres bulunamadı.";
      addressId = id;
    } else {
      if (count >= MAX_ADDRESSES) return `En çok ${MAX_ADDRESSES} adres kaydedebilirsiniz.`;
      const created = await tx.webCustomerAddress.create({
        data: { ...parsed.value, webCustomerId: session.webCustomerId, isDefaultShipping: count === 0, isDefaultBilling: count === 0 },
      });
      addressId = created.id;
    }
    await applyDefaults(tx, session.webCustomerId, addressId, makeDefaultShipping, makeDefaultBilling);
    return null;
  });
  if (result) return { error: result, done: false };
  revalidatePath("/hesabim/adresler");
  return { error: null, done: true };
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Varsayılan tekilliği: bir adres varsayılan yapılınca diğerlerinin işareti kalkar.
async function applyDefaults(tx: Tx, webCustomerId: string, addressId: string, shipping: boolean, billing: boolean) {
  if (shipping) {
    await tx.webCustomerAddress.updateMany({ where: { webCustomerId, id: { not: addressId } }, data: { isDefaultShipping: false } });
    await tx.webCustomerAddress.updateMany({ where: { webCustomerId, id: addressId }, data: { isDefaultShipping: true } });
  }
  if (billing) {
    await tx.webCustomerAddress.updateMany({ where: { webCustomerId, id: { not: addressId } }, data: { isDefaultBilling: false } });
    await tx.webCustomerAddress.updateMany({ where: { webCustomerId, id: addressId }, data: { isDefaultBilling: true } });
  }
}

export async function setDefaultAddress(formData: FormData) {
  const session = await requireWebSession();
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const owned = await prisma.webCustomerAddress.findFirst({ where: { id, webCustomerId: session.webCustomerId }, select: { id: true } });
  if (!owned) return;
  await prisma.$transaction((tx) => applyDefaults(tx, session.webCustomerId, id, kind === "shipping", kind === "billing"));
  revalidatePath("/hesabim/adresler");
}

// Silinen adres varsayılansa, kalan en yeni adres varsayılan olur (varsayılansız liste kalmasın).
export async function deleteAddress(formData: FormData) {
  const session = await requireWebSession();
  const id = String(formData.get("id") ?? "");
  await prisma.$transaction(async (tx) => {
    const address = await tx.webCustomerAddress.findFirst({ where: { id, webCustomerId: session.webCustomerId } });
    if (!address) return;
    await tx.webCustomerAddress.delete({ where: { id } });
    const next = await tx.webCustomerAddress.findFirst({ where: { webCustomerId: session.webCustomerId }, orderBy: { updatedAt: "desc" } });
    if (next) await applyDefaults(tx, session.webCustomerId, next.id, address.isDefaultShipping, address.isDefaultBilling);
  });
  revalidatePath("/hesabim/adresler");
}
