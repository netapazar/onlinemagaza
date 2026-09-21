"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createWebSession, destroyWebSession } from "@/lib/webSession";
import {
  notifyNewMembershipApplication,
  notifyPasswordChanged,
  notifyPasswordReset,
  runAfterResponse,
} from "@/lib/email/notifications";
import {
  generateResetToken,
  hashResetToken,
  isResetTokenUsable,
  resetTokenExpiry,
} from "@/lib/passwordReset";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { consumeIpRateLimit, consumeRateLimit, RATE_LIMIT_MESSAGE, RULES } from "@/lib/rateLimit";

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

  // Hız sınırı: doğrulama geçtikten sonra, veritabanına yazan adımdan önce (sahte toplu kayıt denemelerini yavaşlatır).
  if (!(await consumeIpRateLimit(RULES.REGISTER_IP))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const existing = await prisma.webCustomer.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu e-posta ile zaten bir hesap var." };
  }

  const passwordHash = await hash(password, 10);
  const { customer, applicationId } = await prisma.$transaction(async (tx) => {
    const created = await tx.webCustomer.create({
      data: { email, passwordHash, name, phone: phone || null },
    });
    const application = await tx.membershipApplication.create({
      data: {
        webCustomerId: created.id,
        unvan,
        vkn,
        vergiDairesi,
        telefon: phone || null,
        adres: adres || null,
      },
    });
    return { customer: created, applicationId: application.id };
  });

  runAfterResponse("ADMIN_NEW_APPLICATION", () => notifyNewMembershipApplication(applicationId));

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

  // IP başına hız sınırı: hesap bazlı kilitlemeye (5 hatalı deneme) EK — farklı hesaplara dağıtılmış şifre tahminini de yavaşlatır.
  if (!(await consumeIpRateLimit(RULES.LOGIN_IP))) {
    return { error: RATE_LIMIT_MESSAGE };
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

export type ResetRequestState = { error: string | null; sent: boolean };

// Şifre sıfırlama isteği. Hesap var mı yok mu ASLA belli edilmez (kullanıcı listesi sızmasın): her zaman aynı
// "gönderdik" yanıtı döner. Ham token yalnızca e-postaya gider, veritabanında özeti saklanır.
export async function requestPasswordReset(
  _prevState: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Geçerli bir e-posta adresi girin.", sent: false };
  }

  const [ipOk, emailOk] = await Promise.all([
    consumeIpRateLimit(RULES.RESET_REQUEST_IP),
    consumeRateLimit(RULES.RESET_REQUEST_EMAIL, email),
  ]);
  if (!ipOk || !emailOk) {
    return { error: RATE_LIMIT_MESSAGE, sent: false };
  }

  const customer = await prisma.webCustomer.findUnique({ where: { email }, select: { id: true } });
  if (customer) {
    const { token, tokenHash } = generateResetToken();
    // Önceki kullanılmamış bağlantılar iptal edilir — aynı anda yalnız en son istenen bağlantı geçerli.
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { webCustomerId: customer.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: { webCustomerId: customer.id, tokenHash, expiresAt: resetTokenExpiry() },
      }),
    ]);
    runAfterResponse("PASSWORD_RESET", () => notifyPasswordReset(customer.id, token));
  }

  return { error: null, sent: true };
}

export type ResetPasswordState = { error: string | null };

const RESET_LINK_INVALID =
  "Bu bağlantının süresi dolmuş ya da daha önce kullanılmış. Lütfen yeni bir şifre sıfırlama bağlantısı isteyin.";

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: RESET_LINK_INVALID };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.` };
  }
  if (password !== confirm) {
    return { error: "Şifreler eşleşmiyor." };
  }
  if (!(await consumeIpRateLimit(RULES.RESET_CONFIRM_IP))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, usedAt: true, expiresAt: true, webCustomerId: true },
  });
  if (!row || !isResetTokenUsable(row)) {
    return { error: RESET_LINK_INVALID };
  }

  const passwordHash = await hash(password, 10);
  const now = new Date();
  const changed = await prisma.$transaction(async (tx) => {
    // Tek kullanımlık: koşullu güncelleme — iki eşzamanlı istekten yalnız biri bağlantıyı tüketir.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.webCustomer.update({
      where: { id: row.webCustomerId },
      // passwordChangedAt: bundan ÖNCE açılmış tüm oturumlar geçersiz olur (bkz. webSession.ts). Kilit de sıfırlanır.
      data: { passwordHash, passwordChangedAt: now, failedLoginAttempts: 0, lockedUntil: null },
    });
    await tx.passwordResetToken.deleteMany({ where: { webCustomerId: row.webCustomerId, id: { not: row.id } } });
    return true;
  });
  if (!changed) return { error: RESET_LINK_INVALID };

  runAfterResponse("PASSWORD_CHANGED", () => notifyPasswordChanged(row.webCustomerId));
  redirect("/uyelik/giris?sifirlandi=1");
}
