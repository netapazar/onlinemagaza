import {
  FileText,
  PenLine,
  Folder,
  Paperclip,
  Droplets,
  Coffee,
  Printer,
  Scissors,
  Package,
  Tag,
  type LucideIcon,
} from "lucide-react";

// İsimden ikon eşleştirme — kategori sayısı arttıkça yeni satırlar eklenir.
// Eşleşme bulunamazsa DEFAULT_ICON'a düşülür, harf-avatarı yerine bu
// kullanılır (bkz. proje kısıtı: "kategori kartları isme uygun bir ikon
// kullanmalı, eşleşme yoksa varsayılan ikona düşmeli").
const ICON_RULES: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ["kağıt", "kagit", "fotokopi", " a4", "a4 "], icon: FileText },
  { keywords: ["kalem", "pen", "tükenmez", "tukenmez"], icon: PenLine },
  { keywords: ["dosya", "klasör", "klasor", "arşiv", "arsiv", "defter"], icon: Folder },
  { keywords: ["kırtasiye", "kirtasiye", "ofis", "büro", "buro"], icon: Paperclip },
  { keywords: ["temizlik", "hijyen", "deterjan"], icon: Droplets },
  { keywords: ["mutfak", "gıda", "gida", "çay", "kahve"], icon: Coffee },
  { keywords: ["yazıcı", "yazici", "toner", "kartuş", "kartus", "termal", "rulo"], icon: Printer },
  { keywords: ["makas", "kesici", "maket"], icon: Scissors },
  { keywords: ["ambalaj", "paketleme", "koli"], icon: Package },
];

const DEFAULT_ICON: LucideIcon = Tag;

export function getCategoryIcon(name: string): LucideIcon {
  const normalized = name.toLocaleLowerCase("tr-TR");
  const match = ICON_RULES.find((rule) => rule.keywords.some((kw) => normalized.includes(kw)));
  return match?.icon ?? DEFAULT_ICON;
}
