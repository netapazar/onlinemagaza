"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createWebSession, requireWebSession } from "@/lib/webSession";
import { notifyPasswordChanged, runAfterResponse } from "@/lib/email/notifications";
import { consumeRateLimit, RATE_LIMIT_MESSAGE, RULES } from "@/lib/rateLimit";
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
