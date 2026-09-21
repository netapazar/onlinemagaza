// Footer'daki iletişim ve sosyal medya bilgileri — KODA GÖMÜLÜ DEĞİL, ortam değişkenlerinden gelir (Vercel → Project → Settings →
// Environment Variables, Production). Değişken tanımlı DEĞİLSE ya da boşsa ilgili alan footer'da gösterilmez.
//
//   SITE_ADDRESS       Adres (çok satırlı yazılabilir; satır sonu için "\n" ya da " | " kullanın)
//   SITE_EMAIL         İletişim e-posta adresi
//   SITE_HOURS         Çalışma saatleri, ör. "Hafta içi 09:00 - 18:00 | Cumartesi 09:00 - 14:00"
//   SOCIAL_INSTAGRAM   Tam adres, ör. https://instagram.com/tedarikhane
//   SOCIAL_FACEBOOK    Tam adres
//   SOCIAL_X           Tam adres (X / Twitter)
//   SOCIAL_LINKEDIN    Tam adres
//   SOCIAL_YOUTUBE     Tam adres
//
// Sosyal medya adresleri yalnız http(s) ile başlıyorsa kabul edilir (footer'a "javascript:" vb. girilemez).

function clean(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function cleanUrl(value: string | undefined): string | null {
  const v = clean(value);
  return v && /^https?:\/\//i.test(v) ? v : null;
}

export type SocialKey = "instagram" | "facebook" | "x" | "linkedin" | "youtube";

export type SiteInfo = {
  address: string[] | null;
  email: string | null;
  hours: string[] | null;
  social: Array<{ key: SocialKey; label: string; url: string }>;
};

function lines(value: string | undefined): string[] | null {
  const v = clean(value);
  if (!v) return null;
  const parts = v.split(/\\n|\n|\s\|\s/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

export function getSiteInfo(env: Record<string, string | undefined> = process.env): SiteInfo {
  const social = (
    [
      ["instagram", "Instagram", cleanUrl(env.SOCIAL_INSTAGRAM)],
      ["facebook", "Facebook", cleanUrl(env.SOCIAL_FACEBOOK)],
      ["x", "X", cleanUrl(env.SOCIAL_X)],
      ["linkedin", "LinkedIn", cleanUrl(env.SOCIAL_LINKEDIN)],
      ["youtube", "YouTube", cleanUrl(env.SOCIAL_YOUTUBE)],
    ] as Array<[SocialKey, string, string | null]>
  )
    .filter((s): s is [SocialKey, string, string] => s[2] !== null)
    .map(([key, label, url]) => ({ key, label, url }));

  return { address: lines(env.SITE_ADDRESS), email: clean(env.SITE_EMAIL), hours: lines(env.SITE_HOURS), social };
}
