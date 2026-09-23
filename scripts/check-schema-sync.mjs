#!/usr/bin/env node
// Bu proje (magaza-online), veritabanı şemasını KENDİ tanımlamıyor — şema tek
// gerçek kaynağı olarak magaza-crm'de tutuluyor (migration'lar sadece orada
// uygulanıyor), buradaki prisma/schema.prisma elle senkronize edilen bir
// kopya. O senkronizasyon disipline dayanıyordu, otomatik bir koruması yoktu
// — bu script, build'i CRM'in GitHub'daki güncel şemasıyla karşılaştırıp
// aradaki farkı build hatasına çeviriyor (bkz. docs/proje-kararlari.md ->
// "CRM Entegrasyonu" -> Adım 0).
//
// netapazar/crm ÖZEL (private) bir repo olduğu için anonim bir raw-content
// isteği çalışmıyor — GitHub Contents API'ye salt-okunur bir Personal
// Access Token ile kimlik doğrulaması gerekiyor:
//   1. GitHub'da netapazar/crm'e en az "Read" erişimi olan bir hesapla
//      Settings -> Developer settings -> Fine-grained tokens -> yeni token:
//      Repository access: "Only select repositories" -> netapazar/crm
//      Permissions: Contents -> Read-only (başka izin gerekmiyor)
//   2. Bu token'ı Vercel'de magaza-online projesinin ortam değişkenlerine
//      SCHEMA_SYNC_GITHUB_TOKEN adıyla ekleyin (Production + Preview + hepsi
//      için — sadece Production'a eklerseniz preview build'ler bu kontrolü
//      atlar/başarısız olur).
// Token tanımlı değilse ya da GitHub'a erişilemiyorsa build BİLEREK
// başarısız oluyor (fail-closed) — "doğrulayamadım" ile "eminim ki aynı"
// aynı şey değil, bu script ikisini birbirinden ayırmıyor: emin
// olamıyorsa build'i geçirmiyor.
//
// Değerlendirilen ama seçilmeyen alternatifler (bkz. proje-kararlari.md için
// gerekçe): (a) git submodule — Vercel'de private submodule için de ayrı bir
// kimlik doğrulama (deploy key) kurulumu gerekiyor, üstüne bu script'ten
// daha fazla hareketli parça (commit pointer güncel tutma) ekliyor, net bir
// kazanç yok. (b) paylaşılan npm paketi — doğru uzun vadeli mimari ama özel
// bir npm registry/paket yayınlama iş akışı gerektiriyor, "basit ve bakımı
// kolay" hedefiyle şu an orantısız. (c) CRM tarafında bir GitHub Action'ın
// şemayı otomatik senkronize etmesi — asıl kopyalama adımını da otomatikleş-
// tirdiği için en iyi nihai çözüm, ama CRM reposunda yazma yetkili bir bot
// token'ı + Action kurulumu gerektiriyor; bu script sadece DOĞRULUYOR,
// kopyalamıyor, kurulumu en az bu üçü arasında.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_SCHEMA_PATH = path.join(__dirname, "..", "prisma", "schema.prisma");
const CRM_REPO = "netapazar/crm";
const CRM_SCHEMA_PATH = "prisma/schema.prisma";
const CRM_REF = "main";

// --local: GitHub/token gerektirmez, iki repo aynı makinede yan yana checkout
// edilmişse (bu projenin geliştirme kurulumu tam olarak bu) kardeş dizindeki
// magaza-crm'in O ANKİ ÇALIŞMA KOPYASIYLA (commit edilmemiş/henüz main'e
// alınmamış değişiklikler DAHİL) karşılaştırır. 2026-09-23'te yakalanan gerçek
// boşluk buydu: --local YOKTU, tek kontrol CRM main'e karşıydı — CRM ve online
// tarafları aynı anda, henüz birleştirilmemiş dallarda geliştirilirken (bu
// oturumdaki gibi) CRM main de değişikliği içermediğinden GitHub kontrolü “aynı”
// derdi (ikisi de eksik), asıl hata (online şeması CRM'in KENDİ dalındaki
// güncel hâlinden bile geri kalmış olması) hiç yakalanmazdı. Bunu commit/PR
// öncesi (`node scripts/check-schema-sync.mjs --local`) çalıştırmak, build-time
// GitHub kontrolünün YERİNE değil, EK bir erken uyarı katmanı olarak düşünülmeli
// — CI/Vercel build'i hâlâ (main'e karşı) GitHub moduyla çalışır.
const LOCAL_MODE = process.argv.includes("--local");
const SIBLING_CRM_SCHEMA_PATH = path.join(__dirname, "..", "..", "magaza-crm", "prisma", "schema.prisma");
// generator/datasource blokları iki projede KASITLI olarak farklı (output
// yolu, vb.) — karşılaştırma bu noktadan sonrasını (ilk gerçek model/enum
// tanımından itibaren) kapsıyor. İki dosyada da aynı isimle var olması
// gereken, en baştaki gerçek bildirim bu.
const COMPARISON_ANCHOR = "enum Role {";

function stripFromAnchor(content, label) {
  const idx = content.indexOf(COMPARISON_ANCHOR);
  if (idx === -1) {
    throw new Error(
      `${label} içinde "${COMPARISON_ANCHOR}" bulunamadı — karşılaştırma noktası değişmiş olabilir, script güncellenmeli.`
    );
  }
  // Satır sonu farklarına (CRLF/LF) karşı normalize ediliyor — iki repo da
  // Windows'ta geliştiriliyor ama git'in autocrlf ayarı repo'dan repo'ya
  // farklı olabilir, bu yüzden dolaylı bir "fark" yanlış alarm vermesin.
  return content.slice(idx).replace(/\r\n/g, "\n").trimEnd();
}

async function fetchCrmSchema() {
  const token = process.env.SCHEMA_SYNC_GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "SCHEMA_SYNC_GITHUB_TOKEN ortam değişkeni tanımlı değil — CRM şema senkron kontrolü " +
        "çalıştırılamıyor. Kurulum adımları için bu dosyanın başındaki yorum veya " +
        "docs/proje-kararlari.md (magaza-crm reposunda) dosyasına bakın."
    );
  }

  const url = `https://api.github.com/repos/${CRM_REPO}/contents/${CRM_SCHEMA_PATH}?ref=${CRM_REF}`;
  // Standart (base64) JSON yanıtı kullanılıyor — "raw" Accept media type'ının
  // (application/vnd.github.raw+json) bazı ortamlarda/GitHub API sürümlerinde
  // beklenmedik şekilde reddedilmesi riskine karşı en garantili yol bu; içerik
  // manuel base64 çözülüyor.
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "magaza-online-schema-sync-check",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `GitHub'dan ${CRM_REPO}/${CRM_SCHEMA_PATH} çekilemedi (HTTP ${res.status}). ` +
        `Token'ın netapazar/crm'e "Contents: Read" erişimi olduğundan emin olun. Yanıt: ${body.slice(0, 500)}`
    );
  }

  const json = await res.json();
  if (typeof json.content !== "string" || json.encoding !== "base64") {
    throw new Error(
      `GitHub Contents API beklenmedik bir yanıt döndürdü (content/encoding alanları yok). ` +
        `Ham yanıt: ${JSON.stringify(json).slice(0, 500)}`
    );
  }
  // GitHub base64 içeriği 60 karakterde bir satır sonu ekliyor.
  return Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8");
}

async function main() {
  const local = readFileSync(LOCAL_SCHEMA_PATH, "utf8");
  const localTail = stripFromAnchor(local, "yerel schema.prisma");

  if (LOCAL_MODE) {
    if (!existsSync(SIBLING_CRM_SCHEMA_PATH)) {
      console.error(
        `\n❌ --local: kardeş dizinde magaza-crm bulunamadı (${SIBLING_CRM_SCHEMA_PATH}). ` +
          "Bu kontrol yalnız iki repo yan yana checkout edilmişse çalışır.\n"
      );
      process.exit(1);
    }
    const crmLocal = readFileSync(SIBLING_CRM_SCHEMA_PATH, "utf8");
    const crmLocalTail = stripFromAnchor(crmLocal, "kardeş magaza-crm/prisma/schema.prisma");
    if (localTail !== crmLocalTail) {
      console.error(
        "\n❌ ŞEMA SENKRON HATASI (--local): magaza-online/prisma/schema.prisma, kardeş " +
          "magaza-crm'in O ANKİ ÇALIŞMA KOPYASIYLA (commit edilmemiş değişiklikler dahil, dal " +
          "adı önemli değil) aynı değil.\n" +
          "Düzeltmek için: magaza-crm/prisma/schema.prisma'yı buraya (generator/datasource " +
          "blokları hariç) kopyalayın, `npx prisma generate` çalıştırın.\n"
      );
      process.exit(1);
    }
    console.log("✓ (--local) Şema kardeş magaza-crm çalışma kopyasıyla senkron.");
    return;
  }

  const crm = await fetchCrmSchema();
  const crmTail = stripFromAnchor(crm, "CRM'in schema.prisma'sı");

  if (localTail !== crmTail) {
    console.error(
      "\n❌ ŞEMA SENKRON HATASI: magaza-online/prisma/schema.prisma, " +
        `magaza-crm'in (${CRM_REF} dalı) güncel şemasıyla aynı değil.\n` +
        "CRM'de bir migration eklenmiş ama bu proje güncellenmemiş olabilir.\n" +
        "Düzeltmek için: magaza-crm/prisma/schema.prisma'yı buraya (generator/datasource " +
        "blokları hariç) kopyalayın, `npx prisma generate` çalıştırın, tekrar deploy edin.\n"
    );
    process.exit(1);
  }

  console.log("✓ Şema CRM ile senkron (enum Role'den itibaren birebir aynı).");
}

main().catch((err) => {
  console.error(`\n❌ ŞEMA SENKRON KONTROLÜ BAŞARISIZ: ${err.message}\n`);
  process.exit(1);
});
