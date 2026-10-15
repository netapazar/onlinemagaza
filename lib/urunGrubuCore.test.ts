import { test } from "node:test";
import assert from "node:assert/strict";
import * as c from "./urunGrubuCore";

// Çalıştırma: npm test (node:test + tsx). eksenSlug örnekleri CRM'deki src/lib/urunGrubu.test.ts ile aynı — iki taraf aynı
// adresi üretmeli.

const g1 = { eksen1Ad: "Renk", eksen2Ad: null };
const g2 = { eksen1Ad: "Renk", eksen2Ad: "Ebat" };
test("eksenSlug — CRM ile aynı", () => {
  assert.equal(c.eksenSlug("Kırmızı"), "kirmizi");
  assert.equal(c.eksenSlug("Renk"), "renk");
  assert.equal(c.eksenSlug("İNCE ÇİZGİLİ"), "ince-cizgili");
  assert.equal(c.eksenSlug("Ağaç Yeşili"), "agac-yesili");
  assert.equal(c.eksenSlug("Şeker Pembe / Öz"), "seker-pembe-oz");
  assert.equal(c.eksenSlug("Gül Kurusu"), "gul-kurusu");
  assert.equal(c.eksenSlug("Lâcivert"), "lacivert");
  assert.equal(c.eksenSlug("Bej (Krém)"), "bej-krem");
  assert.equal(c.eksenSlug(" A4 "), "a4");
  assert.equal(c.eksenSlug("8 cm × 10 cm"), "8-cm-10-cm");
  assert.equal(c.degerSlug("Lâcivert"), "lacivert");
  assert.equal(c.secimSorgusu({ eksen1Ad: "Renk", eksen2Ad: null }, { eksen1Deger: "Lâcivert", eksen2Deger: null }), "renk=lacivert");
});
test("slug", () => {
  assert.equal(c.slugTr("Kırmızı"), "kirmizi");
  assert.equal(c.slugTr("Açık Yeşil"), "acik-yesil");
  assert.equal(c.slugTr("İNCE ŞÖĞÜÇ"), "ince-soguc");
  assert.equal(c.degerSlug("A4"), "a4");
  assert.equal(c.degerSlug("—"), "—");
  assert.deepEqual(c.grupParamAdlari(g2), { p1: "renk", p2: "ebat" });
  assert.deepEqual(c.grupParamAdlari({ eksen1Ad: "Renk", eksen2Ad: "renk" }), { p1: "renk", p2: "renk-2" });
  assert.equal(c.eksenParamAdi("Ebat/Boyut"), "ebat-boyut");
});
test("secimSorgusu + yol", () => {
  assert.equal(c.secimSorgusu(g2, { eksen1Deger: "Kırmızı", eksen2Deger: "A4" }), "renk=kirmizi&ebat=a4");
  assert.equal(c.secimSorgusu(g1, { eksen1Deger: "Mavi", eksen2Deger: null }), "renk=mavi");
  assert.equal(c.grupYolu("x", "renk=mavi"), "/urun/x?renk=mavi");
  assert.equal(c.grupYolu("x"), "/urun/x");
});
const u = (e1: string, e2: string | null, satilabilir: boolean, varsayilan = false) => ({ eksen1Deger: e1, eksen2Deger: e2, satilabilir, varsayilan });
test("varsayilan", () => {
  assert.equal(c.varsayilanIndeks([]), -1);
  assert.equal(c.varsayilanIndeks([u("a", null, true), u("b", null, true, true)]), 1);
  assert.equal(c.varsayilanIndeks([u("a", null, true), u("b", null, false, true), u("c", null, true)]), 2);
  assert.equal(c.varsayilanIndeks([u("a", null, true), u("b", null, false, true), u("c", null, false)]), 0);
  assert.equal(c.varsayilanIndeks([u("a", null, false), u("b", null, false)]), 0);
  assert.equal(c.varsayilanIndeks([u("a", null, false), u("b", null, true)]), 1);
});
test("secimiCoz", () => {
  const L = [u("Kırmızı", "A4", false), u("Kırmızı", "A5", true), u("Mavi", "A4", true, true)];
  assert.equal(c.secimiCoz(g2, L, {}), 2);
  assert.equal(c.secimiCoz(g2, L, { renk: "kirmizi", ebat: "a4" }), 0); // tam eşleşme stoksuz olsa da açılır
  assert.equal(c.secimiCoz(g2, L, { renk: "kirmizi" }), 1);
  assert.equal(c.secimiCoz(g2, L, { renk: "KIRMIZI", ebat: "a3" }), 1);
  assert.equal(c.secimiCoz(g2, L, { renk: "yok" }), 2);
  assert.equal(c.secimiCoz(g2, L, { renk: ["mavi", "x"] }), 2);
  assert.equal(c.secimiCoz(g2, L, { renk: "Kırmızı", ebat: "A5" }), 1);
});
test("etiket + schema", () => {
  const L = [u("K", "A4", true), u("K", "A5", true), u("M", "A4", true)];
  assert.equal(c.secenekEtiketi(g2, L), "2 renk · 2 ebat");
  assert.equal(c.secenekEtiketi(g1, [u("K", null, true)]), null);
  assert.deepEqual(c.tekilDegerler(L, 2), ["A4", "A5"]);
  assert.equal(c.eksenSchemaOzelligi("Renk"), "color");
  assert.equal(c.eksenSchemaOzelligi("Ebat"), "size");
  assert.equal(c.eksenSchemaOzelligi("Boyut"), "size");
  assert.equal(c.eksenSchemaOzelligi("Hacim"), null);
  assert.equal(c.secimMetni(g2, { eksen1Deger: "K", eksen2Deger: "A4" }), "Renk: K · Ebat: A4");
});
