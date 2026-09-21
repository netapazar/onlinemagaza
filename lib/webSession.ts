import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Entirely separate from magaza-crm's staff session (COOKIE_NAME
// "magaza_session", SESSION_SECRET) — different cookie name, different
// secret, different payload shape. A WebCustomer and a staff User are
// unrelated identities even though they share one database.
const COOKIE_NAME = "magaza_web_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 gün — bir e-ticaret müşterisinin oturumu, personelinkinden çok daha uzun kalmalı

function getSecretKey() {
  const secret = process.env.WEB_SESSION_SECRET;
  if (!secret) {
    throw new Error("WEB_SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

// Oturum (JWT iat, saniye) şifre değişiminden ÖNCE mi açılmış? Şifre hiç değişmediyse (null) hep false.
// iat yoksa (beklenmez) güvenli tarafta: geçersiz say.
export function sessionPredatesPasswordChange(issuedAtSeconds: number | undefined, passwordChangedAt: Date | null): boolean {
  if (!passwordChangedAt) return false;
  if (issuedAtSeconds === undefined) return true;
  return issuedAtSeconds < Math.floor(passwordChangedAt.getTime() / 1000);
}

export type WebSessionPayload = {
  webCustomerId: string;
  name: string;
  email: string;
};

export async function createWebSession(payload: WebSessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroyWebSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// cache() — aynı istek içinde birden çok yerde (layout + sayfa) çağrılırsa
// tekrar DB'ye gitmesin diye, magaza-crm'in kendi getSession()'ıyla aynı
// gerekçe.
export const getWebSession = cache(async (): Promise<WebSessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload: WebSessionPayload;
  let issuedAt: number | undefined;
  try {
    const verified = await jwtVerify(token, getSecretKey());
    payload = verified.payload as unknown as WebSessionPayload;
    issuedAt = verified.payload.iat;
  } catch {
    return null;
  }

  // Token geçerli olsa bile hesap silinmiş olabilir — her istekte tek
  // indexed lookup, magaza-crm'in active kontrolüyle aynı gerekçe.
  const customer = await prisma.webCustomer.findUnique({
    where: { id: payload.webCustomerId },
    select: { id: true, passwordChangedAt: true },
  });
  if (!customer) return null;

  // Şifre sıfırlandıktan sonra, ÖNCEDEN açılmış oturumlar (ör. kaybolmuş/çalınmış bir cihaz) geçersiz olur.
  // JWT iat saniye cinsinden; karşılaştırma saniyeye yuvarlanmış değerle yapılır.
  if (sessionPredatesPasswordChange(issuedAt, customer.passwordChangedAt)) return null;

  return payload;
});

export async function requireWebSession(): Promise<WebSessionPayload> {
  const session = await getWebSession();
  if (!session) throw new Error("Giriş yapmanız gerekiyor.");
  return session;
}

export { COOKIE_NAME };
