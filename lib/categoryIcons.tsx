import { createElement } from "react";
import {
  PaperReamIcon,
  PenIcon,
  FolderIcon,
  PaperclipIcon,
  SprayBottleIcon,
  MugIcon,
  PrinterIcon,
  ScissorsIcon,
  BoxIcon,
  TagIcon,
  SpiralNotebookIcon,
  BackpackIcon,
  OpenBookIcon,
  PuzzleIcon,
  CalculatorIcon,
  PaletteBrushIcon,
  BindersIcon,
  type Icon,
} from "@/components/icons";

// İsimden ikon eşleştirme — kategori sayısı arttıkça yeni satırlar eklenir.
// Eşleşme bulunamazsa DEFAULT_ICON'a düşülür, harf-avatarı yerine bu
// kullanılır (bkz. proje kısıtı: "kategori kartları isme uygun bir ikon
// kullanmalı, eşleşme yoksa varsayılan ikona düşmeli").
const ICON_RULES: { keywords: string[]; icon: Icon }[] = [
  // sanaldepom ana kategorileri (2026-10-07) — genel kurallardan ÖNCE (ör. "Okul Kırtasiye" ataç değil çanta ikonu alsın)
  { keywords: ["defter", "ajanda"], icon: SpiralNotebookIcon },
  { keywords: ["okul"], icon: BackpackIcon },
  { keywords: ["ofis kırtasiye", "ofis kirtasiye"], icon: BindersIcon },
  { keywords: ["kitap"], icon: OpenBookIcon },
  { keywords: ["oyuncak"], icon: PuzzleIcon },
  { keywords: ["elektronik", "hesap makine"], icon: CalculatorIcon },
  { keywords: ["sanatsal", "boya"], icon: PaletteBrushIcon },
  { keywords: ["yaşam", "yasam"], icon: MugIcon },
  { keywords: ["kağıt", "kagit", "fotokopi", " a4", "a4 "], icon: PaperReamIcon },
  { keywords: ["kalem", "pen", "tükenmez", "tukenmez"], icon: PenIcon },
  { keywords: ["klasör", "klasor"], icon: BindersIcon },
  { keywords: ["dosya", "arşiv", "arsiv", "defter"], icon: FolderIcon },
  { keywords: ["kırtasiye", "kirtasiye", "ofis", "büro", "buro"], icon: PaperclipIcon },
  { keywords: ["temizlik", "hijyen", "deterjan"], icon: SprayBottleIcon },
  { keywords: ["mutfak", "gıda", "gida", "çay", "kahve"], icon: MugIcon },
  { keywords: ["yazıcı", "yazici", "toner", "kartuş", "kartus", "termal", "rulo"], icon: PrinterIcon },
  { keywords: ["makas", "kesici", "maket"], icon: ScissorsIcon },
  { keywords: ["ambalaj", "paketleme", "koli"], icon: BoxIcon },
];

const DEFAULT_ICON: Icon = TagIcon;

export function getCategoryIcon(name: string): Icon {
  const normalized = name.toLocaleLowerCase("tr-TR");
  const match = ICON_RULES.find((rule) => rule.keywords.some((kw) => normalized.includes(kw)));
  return match?.icon ?? DEFAULT_ICON;
}

// Bileşen gövdesinde `const Icon = getCategoryIcon(...)` + `<Icon />` her çizimde yeni bileşen sayılır (lint: static-components);
// map dışında ikon gerektiğinde bu sarmalayıcı kullanılır.
export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  return createElement(getCategoryIcon(name), { className, "aria-hidden": true });
}
