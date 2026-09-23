"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createWebSession, getWebSession, requireWebSession } from "@/lib/webSession";
import { notifyEmailChanged, notifyEmailChangeRequest, notifyPasswordChanged, runAfterResponse } from "@/lib/email/notifications";
import { generateResetToken, hashResetToken, isResetTokenUsable } from "@/lib/passwordReset";
import { VERIFY_TOKEN_TTL_HOURS } from "@/lib/passwordPolicy";
import { consumeIpRateLimit, consumeRateLimit, RATE_LIMIT_MESSAGE, RULES } from "@/lib/rateLimit";
import { normalizeName, normalizePhone, validateNewPassword } from "@/lib/profileValidation";

export type FormState = { error: string | null; done: boolean };

// Şifre değiştirme — şifre sıfırlamadaki desenin aynısı: passwordChangedAt güncellenince bundan ÖNCE açılmış
// TÜM oturumlar geçersiz olur (bkz. webSession.ts); bilgilendirme e-postası yanıttan sonra gönderilir.
// Değişikliği yapan bu oturum kapanmasın diye hemen yeni bir oturum açılır.
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireWebSession();
  const checked = validateNewPassword({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!checked.ok) return { error: checked.error, done: false };

  if (!(await consumeRateLimit(RULES.PASSWORD_CHANGE_ACCOUNT, session.webCustomerId))) {
    return { error: RATE_LIMIT_MESSAGE, done: false };
  }

  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
  if (!customer) return { error: "Hesap bulunamadı.", done: false };

  if (!(await compare(String(formData.get("current") ?? ""), customer.passwordHash))) {
    return { error: "Mevcut şifreniz hatalı.", done: false };
  }

  const passwordHash = await hash(checked.value, 10);
  await prisma.$transaction([
    prisma.webCustomer.update({
      where: { id: customer.id },
      data: { passwordHash, passwordChangedAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    }),
    // Bekleyen sıfırlama bağlantıları artık anlamsız (eski şifreye göre istenmişti) — kullanılamasın.
    prisma.passwordResetToken.deleteMany({ where: { webCustomerId: customer.id } }),
  ]);
  await createWebSession({ webCustomerId: customer.id, name: customer.name, email: customer.email });

  runAfterResponse("PASSWORD_CHANGED", () => notifyPasswordChanged(customer.id));
  return { error: null, done: true };
}

// Ad soyad ve telefon. E-posta burada değişmez (doğrulamalı ayrı akış — şema kararı bekliyor).
export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireWebSession();
  const name = normalizeName(formData.get("name"));
  if (!name.ok) return { error: name.error, done: false };
  const phone = normalizePhone(formData.get("phone"));
  if (!phone.ok) return { error: phone.error, done: false };

  const customer = await prisma.webCustomer.update({
    where: { id: session.webCustomerId },
    data: { name: name.value, phone: phone.value },
    select: { id: true, name: true, email: true },
  });
  // Başlıktaki ad oturum içinden okunuyor — yeni adla oturum yenilenir.
  if (customer.name !== session.name) {
    await createWebSession({ webCustomerId: customer.id, name: customer.name, email: customer.email });
  }
  revalidatePath("/hesabim");
  return { error: null, done: true };
}

// ---------------------------------------------------------------------------
// E-posta değişikliği (2026-09-23 kararı): mevcut şifre + YENİ adrese doğrulama bağlantısı; bağlantıdaki düğmeye
// basılınca değişir, eski adrese bilgilendirme gider. Site genelindeki e-posta doğrulama bayrağından bağımsızdır.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_UNAVAILABLE = "Bu e-posta adresi kullanılamıyor.";
const CHANGE_LINK_INVALID =
  "Bu onay bağlantısının süresi dolmuş, kullanılmış ya da geçersiz. Hesabım › Profil Bilgilerim'den yeniden deneyebilirsiniz.";

export async function requestEmailChange(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireWebSession();
  const newEmail = String(formData.get("newEmail") ?? "").trim().toLowerCase();
  const password = String(formData.get("current") ?? "");
  if (!EMAIL_RE.test(newEmail) || newEmail.length > 200) return { error: "Geçerli bir e-posta adresi girin.", done: false };
  if (!password) return { error: "Mevcut şifrenizi girin.", done: false };

  const [accountOk, ipOk] = await Promise.all([
    consumeRateLimit(RULES.VERIFY_RESEND_EMAIL, `email-change:${session.webCustomerId}`),
    consumeIpRateLimit(RULES.VERIFY_RESEND_IP),
  ]);
  if (!accountOk || !ipOk) return { error: RATE_LIMIT_MESSAGE, done: false };

  const customer = await prisma.webCustomer.findUnique({
    where: { id: session.webCustomerId },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!customer) return { error: "Hesap bulunamadı.", done: false };
  if (newEmail === customer.email) return { error: "Bu zaten mevcut e-posta adresiniz.", done: false };
  if (!(await compare(password, customer.passwordHash))) return { error: "Mevcut şifreniz hatalı.", done: false };
  if (await prisma.webCustomer.findUnique({ where: { email: newEmail }, select: { id: true } })) {
    return { error: EMAIL_UNAVAILABLE, done: false };
  }

  const { token, tokenHash } = generateResetToken();
  await prisma.$transaction([
    // Bekleyen önceki değişiklik bağlantıları geçersiz olur (yalnız son istek geçerli).
    prisma.emailVerificationToken.deleteMany({ where: { webCustomerId: customer.id, usedAt: null, newEmail: { not: null } } }),
    prisma.emailVerificationToken.create({
      data: { webCustomerId: customer.id, tokenHash, newEmail, expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 3_600_000) },
    }),
  ]);
  runAfterResponse("EMAIL_CHANGE_REQUEST", () => notifyEmailChangeRequest(customer.id, newEmail, token));
  return { error: null, done: true };
}

// Yeni adresteki bağlantının sayfasındaki düğmeyle çağrılır (giriş gerekmez — bağlantı yeni adresin sahibi olduğunu
// kanıtlar; talep zaten şifreyle açılmıştı).
export async function confirmEmailChange(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: CHANGE_LINK_INVALID, done: false };
  if (!(await consumeIpRateLimit(RULES.VERIFY_CONFIRM_IP))) return { error: RATE_LIMIT_MESSAGE, done: false };

  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, usedAt: true, expiresAt: true, webCustomerId: true, newEmail: true },
  });
  if (!row || !row.newEmail || !isResetTokenUsable(row)) return { error: CHANGE_LINK_INVALID, done: false };
  const newEmail = row.newEmail;

  const now = new Date();
  let outcome: { oldEmail: string; name: string } | "invalid" | "taken";
  try {
    outcome = await prisma.$transaction(async (tx) => {
      const claimed = await tx.emailVerificationToken.updateMany({
        where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) return "invalid" as const;
      const other = await tx.webCustomer.findUnique({ where: { email: newEmail }, select: { id: true } });
      if (other && other.id !== row.webCustomerId) return "taken" as const;
      const before = await tx.webCustomer.findUniqueOrThrow({ where: { id: row.webCustomerId }, select: { email: true, name: true } });
      await tx.webCustomer.update({ where: { id: row.webCustomerId }, data: { email: newEmail, emailVerifiedAt: now } });
      await tx.emailVerificationToken.deleteMany({ where: { webCustomerId: row.webCustomerId, id: { not: row.id } } });
      return { oldEmail: before.email, name: before.name };
    });
  } catch {
    // Eşzamanlı başka bir hesap aynı adresi aldıysa benzersizlik kısıtı yakalar.
    outcome = "taken";
  }
  if (outcome === "invalid") return { error: CHANGE_LINK_INVALID, done: false };
  if (outcome === "taken") return { error: EMAIL_UNAVAILABLE, done: false };

  const { oldEmail, name } = outcome;
  runAfterResponse("EMAIL_CHANGED", () => notifyEmailChanged(oldEmail, name, newEmail));
  // Bu tarayıcıda aynı hesapla oturum açıksa oturumdaki e-posta yenilenir.
  const session = await getWebSession();
  if (session?.webCustomerId === row.webCustomerId) {
    await createWebSession({ webCustomerId: row.webCustomerId, name: session.name, email: newEmail });
  }
  revalidatePath("/hesabim");
  return { error: null, done: true };
}
