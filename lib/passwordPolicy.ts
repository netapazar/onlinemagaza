// Şifre kuralları ve sıfırlama bağlantısı ömrü. Ayrı dosya: istemci bileşenleri de kullanıyor, bu yüzden
// Node'a özgü modül (crypto) içermemeli — token üretimi lib/passwordReset.ts'te (yalnız sunucu).
export const MIN_PASSWORD_LENGTH = 8;

// Kısa tutuldu: e-posta kutusuna erişen biri için pencere dar olsun.
export const RESET_TOKEN_TTL_MINUTES = 60;
