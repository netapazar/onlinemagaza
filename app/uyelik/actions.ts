"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createWebSession, destroyWebSession } from "@/lib/webSession";

export type AuthState = {
  error: string | null;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Üyelik modeli Madde 2 — kayıt formu artık aynı zamanda kurumsal üyelik
// başvurusu: WebCustomer + MembershipApplication tek transaction'da birlikte
// oluşturuluyor, ayrı bir "sonra başvur" adımına gerek kalmıyor. Eski ayrı
// /hesabim/uyelik-basvurusu sayfası SİLİNMEDİ — kayıt sırasında bu adımı
// atlamış eski hesaplar için hâlâ orada (bkz. Madde 3, hatırlatma banner'ı).
export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const unvan = String(formData.get("unvan") ?? "").trim();
  const vkn = String(formData.get("vkn") ?? "").trim();
  const vergiDairesi = String(formData.get("vergiDairesi") ?? "").trim();
  const adres = String(formData.get("adres") ?? "").trim();
  const kvkkOnay = formData.get("kvkkOnay") === "on";

  if (!email || !password || !name) {
    return { error: "Ad, e-posta ve şifre gerekli." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }
  if (!unvan) {
    return { error: "Firma/işletme adı gerekli." };
  }
  // VKN (10 hane) veya TCKN (11 hane) — sadece rakam, başka format kabul edilmiyor.
  if (!/^\d{10}$|^\d{11}$/.test(vkn)) {
    return { error: "VKN 10 haneli veya TCKN 11 haneli, sadece rakamlardan oluşmalı." };
  }
  if (!vergiDairesi) {
    return { error: "Vergi dairesi gerekli." };
  }
  if (!kvkkOnay) {
    return { error: "Devam etmek için KVKK Aydınlatma Metni'ni onaylamalısınız." };
  }

  const existing = await prisma.webCustomer.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu e-posta ile zaten bir hesap var." };
  }

  const passwordHash = await hash(password, 10);
  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.webCustomer.create({
      data: { email, passwordHash, name, phone: phone || null },
    });
    await tx.membershipApplication.create({
      data: {
        webCustomerId: created.id,
        unvan,
        vkn,
        vergiDairesi,
        telefon: phone || null,
        adres: adres || null,
      },
    });
    return created;
  });

  await createWebSession({ webCustomerId: customer.id, name: customer.name, email: customer.email });
  redirect("/hesabim");
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const customer = await prisma.webCustomer.findUnique({ where: { email } });
  if (!customer) {
    return { error: "E-posta veya şifre hatalı." };
  }

  if (customer.lockedUntil && customer.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((customer.lockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Çok fazla hatalı deneme. ${minutesLeft} dakika sonra tekrar deneyin.` };
  }

  const passwordMatches = await compare(password, customer.passwordHash);
  if (!passwordMatches) {
    const attempts = customer.failedLoginAttempts + 1;
    const lockingOut = attempts >= MAX_FAILED_ATTEMPTS;
    await prisma.webCustomer.update({
      where: { id: customer.id },
      data: {
        failedLoginAttempts: lockingOut ? 0 : attempts,
        lockedUntil: lockingOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60000) : null,
      },
    });
    if (lockingOut) {
      return { error: `Çok fazla hatalı deneme. ${LOCKOUT_MINUTES} dakika sonra tekrar deneyin.` };
    }
    return { error: "E-posta veya şifre hatalı." };
  }

  if (customer.failedLoginAttempts > 0 || customer.lockedUntil) {
    await prisma.webCustomer.update({
      where: { id: customer.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  await createWebSession({ webCustomerId: customer.id, name: customer.name, email: customer.email });
  redirect("/hesabim");
}

export async function logout() {
  await destroyWebSession();
  redirect("/");
}
