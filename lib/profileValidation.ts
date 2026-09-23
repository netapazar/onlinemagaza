// Hesabım › Profil ve Şifre formlarının saf doğrulama kuralları (DB'ye dokunmaz, test edilebilir).
import { MIN_PASSWORD_LENGTH } from "./passwordPolicy";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const NAME_MAX_LENGTH = 100;

export function normalizeName(raw: unknown): Result<string> {
  const value = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (value.length < 2) return { ok: false, error: "Ad soyad en az 2 karakter olmalı." };
  if (value.length > NAME_MAX_LENGTH) return { ok: false, error: `Ad soyad en çok ${NAME_MAX_LENGTH} karakter olabilir.` };
  return { ok: true, value };
}

// Telefon isteğe bağlı. Boşluk, tire, parantez ve baştaki +90 / 0 temizlenir; Türkiye numarası 10 hane olmalı
// (5xx xxx xx xx veya sabit hat 2xx/3xx/4xx). Saklanan biçim: "0" + 10 hane (ör. 05321234567).
export function normalizePhone(raw: unknown): Result<string | null> {
  const text = String(raw ?? "").trim();
  if (!text) return { ok: true, value: null };
  let digits = text.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return { ok: false, error: "Telefon yalnız rakamlardan oluşmalı." };
  digits = digits.replace(/^\+/, "");
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!/^[2-5]\d{9}$/.test(digits)) return { ok: false, error: "Geçerli bir telefon numarası girin (ör. 0532 123 45 67)." };
  return { ok: true, value: `0${digits}` };
}

export function validateNewPassword(input: { current: string; next: string; confirm: string }): Result<string> {
  if (!input.current) return { ok: false, error: "Mevcut şifrenizi girin." };
  if (input.next.length < MIN_PASSWORD_LENGTH) return { ok: false, error: `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.` };
  if (input.next !== input.confirm) return { ok: false, error: "Yeni şifreler eşleşmiyor." };
  if (input.next === input.current) return { ok: false, error: "Yeni şifre mevcut şifreyle aynı olamaz." };
  return { ok: true, value: input.next };
}
