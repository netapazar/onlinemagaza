import { createHash, randomBytes } from "node:crypto";

import { RESET_TOKEN_TTL_MINUTES } from "@/lib/passwordPolicy";

// Ham token yalnızca e-postadaki bağlantıda yaşar; veritabanında yalnız SHA-256 özeti saklanır (bkz. schema.prisma
// PasswordResetToken) — veritabanı sızsa bile geçerli bir sıfırlama bağlantısı üretilemez. 32 bayt rastgele =
// 256 bit: tahmin edilemez, bu yüzden yavaş (bcrypt) bir özet gerekmez.
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function resetTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60_000);
}

export type ResetTokenRow = { id: string; usedAt: Date | null; expiresAt: Date };

// Geçerli mi? (kullanılmamış ve süresi dolmamış)
export function isResetTokenUsable(row: ResetTokenRow | null, now: Date = new Date()): boolean {
  return !!row && row.usedAt === null && row.expiresAt.getTime() > now.getTime();
}
