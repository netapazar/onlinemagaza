// Özellik anahtarları (ortam değişkeni). Varsayılan KAPALI: değişken tanımlı değilse özellik çalışmaz.
//
// EMAIL_VERIFICATION_ENABLED=true  → yumuşak e-posta doğrulaması AÇIK (kayıtta doğrulama e-postası, Hesabım uyarısı ve
//                                    "Doğrulama e-postası gönder" düğmesi, doğrulama sayfası). CRM projesinde AYNI adla ayrı
//                                    tanımlanır (üyelik onay ekranındaki rozet için).
// Kapalıyken kod ve tablolar (EmailVerificationToken, WebCustomer.emailVerifiedAt) yerinde durur, hiçbir şey silinmez;
// yalnızca müşteriye/personele görünen davranış kapanır. Şifre sıfırlamanın adresi "doğrulanmış" sayması bundan bağımsızdır.
export function emailVerificationEnabled(): boolean {
  return process.env.EMAIL_VERIFICATION_ENABLED?.trim().toLowerCase() === "true";
}
