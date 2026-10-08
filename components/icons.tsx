import type { ReactNode, SVGProps } from "react";

// Sitenin tek ikon ailesi (2026-10, hazır ikon setinin yerine). Hepsi aynı kurallarla elle çizildi:
// 24x24 kafes, kenarlarda ~2 px boşluk, çizgi 1,75, yuvarlak uç/birleşim, köşe yuvarlaklığı 1–2,5, düz önden bakış
// (istisna: kalem 45° eğik, kağıt topu hafif açılı), dolgu yok, tek renk (currentColor). Nokta = sıfır uzunluklu çizgi.
// Yeni ikon eklerken bu kurallara uy; metin (harf/rakam) koyma — küçük boyutta okunmuyor.
export type IconProps = SVGProps<SVGSVGElement>;
export type Icon = ((props: IconProps) => ReactNode) & { displayName?: string };

function icon(name: string, body: ReactNode): Icon {
  const C = (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {body}
    </svg>
  );
  C.displayName = name;
  return C;
}

/* ───────── Kategori ürünleri ───────── */

export const PenIcon = icon(
  "PenIcon",
  <g transform="rotate(45 12 12)">
    <rect x="10" y="0.5" width="4" height="6.5" rx="1.25" />
    <path d="M14 1.75h1.5a.5.5 0 0 1 .5.5v7.5" />
    <path d="M10.25 7v10h3.5V7" />
    <path d="M10.25 17l1.25 3.5h1l1.25-3.5" />
  </g>,
);

// Fotokopi kağıdı topu: hafif açılı kutu; yan yüzde açılmış ambalajdan görünen yaprak kenarları, önde ambalaj etiketi.
export const PaperReamIcon = icon(
  "PaperReamIcon",
  <>
    <path d="M2.5 11.5H16v7.5H4A1.5 1.5 0 0 1 2.5 17.5z" />
    <path d="M2.5 11.5 7 7h14.5L16 11.5" />
    <path d="M16 11.5 21.5 7v7.5L16 19" />
    <path d="M16 15.25l5.5-4.5" />
    <path d="M5.5 15.25h7.5" />
  </>,
);

export const CalculatorIcon = icon(
  "CalculatorIcon",
  <>
    <rect x="4.5" y="2" width="15" height="20" rx="2.5" />
    <rect x="7.5" y="5" width="9" height="4" rx="1" />
    <path d="M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01M8.5 15.5h.01M12 15.5h.01M8.5 18.5h.01M12 18.5h.01" />
    <path d="M15.5 15.5v3" />
  </>,
);

// Spiralli defter: solda spiral halkalar, kapakta etiket.
export const SpiralNotebookIcon = icon(
  "SpiralNotebookIcon",
  <>
    <rect x="6.5" y="2.5" width="13" height="19" rx="2" />
    <path d="M4 6.5h4.5M4 10h4.5M4 13.5h4.5M4 17h4.5" />
    <rect x="11" y="6.5" width="5.5" height="3.5" rx="0.75" />
  </>,
);

// Boya paleti (başparmak deliği + boya lekeleri) ve çapraz fırça.
export const PaletteBrushIcon = icon(
  "PaletteBrushIcon",
  <>
    <path d="M10.5 8C6 8 2.75 10.6 2.75 14.25S5.9 20.5 9.5 20.5c1.4 0 2.1-.7 2.1-1.6 0-1.1-1.1-1.3-1.1-2.4 0-.8.6-1.3 1.4-1.3h1.6c1.9 0 3.25-1.2 3.25-2.8C16.75 10.1 14.4 8 10.5 8z" />
    <path d="M6 14.25h.01M7.5 11h.01M10.75 10.75h.01" />
    <path d="M15.5 9.5 21 4" />
    <path d="M13.25 11.75c.6-.6 1.65-.6 2.25 0s.6 1.65 0 2.25c-.9.9-2.6 1-3.5 1 0-.9.1-2.6 1.25-3.25z" />
  </>,
);

export const BackpackIcon = icon(
  "BackpackIcon",
  <>
    <path d="M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5z" />
    <path d="M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6" />
    <path d="M8 21v-4.5A1.5 1.5 0 0 1 9.5 15h5a1.5 1.5 0 0 1 1.5 1.5V21" />
    <path d="M8 11h8" />
  </>,
);

// Klasör: rafta yan yana iki kollu klasör (sırt etiketi + parmak deliği). Tek klasör küçük boyutta telefona benziyordu.
export const BindersIcon = icon(
  "BindersIcon",
  <>
    <rect x="3.5" y="3" width="7.5" height="18" rx="1.25" />
    <rect x="13" y="3" width="7.5" height="18" rx="1.25" />
    <path d="M5.75 6.5h3M15.25 6.5h3" />
    <circle cx="7.25" cy="16" r="1.25" />
    <circle cx="16.75" cy="16" r="1.25" />
  </>,
);

export const MugIcon = icon(
  "MugIcon",
  <>
    <path d="M4.5 9h11v6.5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5z" />
    <path d="M15.5 11h1.25a2.5 2.5 0 0 1 0 5H15.5" />
    <path d="M8 3c-.75.9-.75 1.85 0 2.75M12 3c-.75.9-.75 1.85 0 2.75" />
  </>,
);

export const OpenBookIcon = icon(
  "OpenBookIcon",
  <>
    <path d="M12 6.5C10.3 5 7.8 4.5 3.5 4.5v14c4.3 0 6.8.5 8.5 2 1.7-1.5 4.2-2 8.5-2v-14c-4.3 0-6.8.5-8.5 2z" />
    <path d="M12 6.5v14" />
  </>,
);

export const PuzzleIcon = icon(
  "PuzzleIcon",
  <path d="M4.5 7.5h3.7a2 2 0 1 1 3.6 0h3.7a1 1 0 0 1 1 1v3.7a2 2 0 1 1 0 3.6v3.7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z" />,
);

export const SprayBottleIcon = icon(
  "SprayBottleIcon",
  <>
    <path d="M6.5 12a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20z" />
    <path d="M8.5 10V7h4v3" />
    <path d="M8 7V4.5a1 1 0 0 1 1-1h5.5l1.5 2.5h-3.5" />
    <path d="M18.5 3.5h.01M20.5 6h.01M18.5 8.5h.01" />
  </>,
);

export const PrinterIcon = icon(
  "PrinterIcon",
  <>
    <path d="M7 8.5v-5h10v5" />
    <path d="M7 16.5H5A1.5 1.5 0 0 1 3.5 15v-5A1.5 1.5 0 0 1 5 8.5h14a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-2" />
    <rect x="7" y="13.5" width="10" height="7" rx="1" />
    <path d="M17 11.5h.01" />
  </>,
);

export const ScissorsIcon = icon(
  "ScissorsIcon",
  <>
    <circle cx="6.5" cy="7" r="2.75" />
    <circle cx="6.5" cy="17" r="2.75" />
    <path d="M8.8 8.6 20 18M8.8 15.4 20 6" />
  </>,
);

export const FolderIcon = icon(
  "FolderIcon",
  <path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5z" />,
);

export const PaperclipIcon = icon(
  "PaperclipIcon",
  <path d="M15.5 7.5v8a3.5 3.5 0 0 1-7 0V6a2.5 2.5 0 0 1 5 0v9a1 1 0 0 1-2 0V8" />,
);

// Koli: kapak + gövde + bant.
export const BoxIcon = icon(
  "BoxIcon",
  <>
    <rect x="2.5" y="4" width="19" height="4" rx="1" />
    <path d="M4 8v11a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V8" />
    <path d="M10 12h4" />
  </>,
);

export const TagIcon = icon(
  "TagIcon",
  <>
    <path d="M3 12.2V4a1 1 0 0 1 1-1h8.2a1 1 0 0 1 .7.3l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-7.4 7.4a1.5 1.5 0 0 1-2.1 0l-8.4-8.2a1 1 0 0 1-.3-.7z" />
    <path d="M7.5 7.5h.01" />
  </>,
);

/* ───────── Bölüm başlıkları ───────── */

export const GridIcon = icon(
  "GridIcon",
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </>,
);

export const TrendUpIcon = icon(
  "TrendUpIcon",
  <>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </>,
);

export const SparkleIcon = icon(
  "SparkleIcon",
  <>
    <path d="M10 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6z" />
    <path d="M18.5 14.5v5M16 17h5" />
  </>,
);

export const UsersIcon = icon(
  "UsersIcon",
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 19.5c.6-3 3.2-5 6.5-5s5.9 2 6.5 5" />
    <path d="M16 4.75a3.5 3.5 0 0 1 0 6.5" />
    <path d="M18 14.75c1.9.6 3.2 2.3 3.5 4.75" />
  </>,
);

// İki üst üste ürün kartı — "benzer" ürünler.
export const SimilarIcon = icon(
  "SimilarIcon",
  <>
    <rect x="3.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M8.5 8.5v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3" />
  </>,
);

/* ───────── Bilgi şeridi / kitle / kurumsal ───────── */

export const TruckIcon = icon(
  "TruckIcon",
  <>
    <path d="M5.5 17.5h-1a1.5 1.5 0 0 1-1.5-1.5V6.5A1.5 1.5 0 0 1 4.5 5h8.5a1.5 1.5 0 0 1 1.5 1.5v11" />
    <path d="M14.5 9h3.6l3.4 3.8v3.2a1.5 1.5 0 0 1-1.5 1.5h-1.5" />
    <path d="M9.5 17.5h5" />
    <circle cx="7.5" cy="17.5" r="2" />
    <circle cx="16.5" cy="17.5" r="2" />
  </>,
);

export const CreditCardIcon = icon(
  "CreditCardIcon",
  <>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M2.5 9.5h19M6 15h4" />
  </>,
);

export const ReturnIcon = icon(
  "ReturnIcon",
  <>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </>,
);

export const BuildingIcon = icon(
  "BuildingIcon",
  <>
    <path d="M4 21V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 16 5v16" />
    <path d="M16 9.5h2.5A1.5 1.5 0 0 1 20 11v10" />
    <path d="M2.5 21h19" />
    <path d="M8 7.5h.01M12 7.5h.01M8 11h.01M12 11h.01M8 14.5h.01M12 14.5h.01" />
    <path d="M9 21v-3h2v3" />
  </>,
);

export const FactoryIcon = icon(
  "FactoryIcon",
  <>
    <path d="M2.5 20.5v-10l5 3v-3l5 3v-3l5 3V4a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v16.5z" />
    <path d="M6.5 17.5h1M11 17.5h1M15.5 17.5h1" />
  </>,
);

export const GraduationCapIcon = icon(
  "GraduationCapIcon",
  <>
    <path d="M2 9.5 12 5l10 4.5-10 4.5z" />
    <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
    <path d="M22 9.5v5" />
  </>,
);

export const StoreIcon = icon(
  "StoreIcon",
  <>
    <path d="M3.5 8.5 5 4h14l1.5 4.5" />
    <path d="M3.5 8.5a2.125 2.125 0 0 0 4.25 0 2.125 2.125 0 0 0 4.25 0 2.125 2.125 0 0 0 4.25 0 2.125 2.125 0 0 0 4.25 0" />
    <path d="M5 11v9h14v-9" />
    <path d="M10 20v-4.5h4V20" />
  </>,
);

export const PercentIcon = icon(
  "PercentIcon",
  <>
    <path d="M19 5 5 19" />
    <circle cx="7" cy="7" r="2.25" />
    <circle cx="17" cy="17" r="2.25" />
  </>,
);

// Cari hesap / banka.
export const BankIcon = icon(
  "BankIcon",
  <>
    <path d="M3 9.5 12 4l9 5.5z" />
    <path d="M6 12v5.5M10 12v5.5M14 12v5.5M18 12v5.5" />
    <path d="M3 20.5h18" />
  </>,
);

export const BoxesIcon = icon(
  "BoxesIcon",
  <>
    <rect x="3" y="12.5" width="8" height="8" rx="1.25" />
    <rect x="13" y="12.5" width="8" height="8" rx="1.25" />
    <rect x="8" y="3.5" width="8" height="8" rx="1.25" />
    <path d="M7 12.5v2M17 12.5v2M12 3.5v2" />
  </>,
);

// Fatura: alt kenarı tırtıklı fiş.
export const InvoiceIcon = icon(
  "InvoiceIcon",
  <>
    <path d="M6 2.5h12a1 1 0 0 1 1 1V21l-2.33-1.5-2.34 1.5L12 19.5 9.67 21l-2.34-1.5L5 21V3.5a1 1 0 0 1 1-1z" />
    <path d="M8.5 7.5h7M8.5 11h7M8.5 14.5h4" />
  </>,
);

export const ShieldCheckIcon = icon(
  "ShieldCheckIcon",
  <>
    <path d="M12 2.5 19.5 5.5v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6z" />
    <path d="M8.75 12.25 11 14.5l4.5-4.75" />
  </>,
);

/* ───────── Üst menü / hesap / sepet ───────── */

export const SearchIcon = icon(
  "SearchIcon",
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 20.5 20.5" />
  </>,
);

export const UserIcon = icon(
  "UserIcon",
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c.8-3.6 3.8-6 7.5-6s6.7 2.4 7.5 6" />
  </>,
);

export const HeartIcon = icon(
  "HeartIcon",
  <path d="M12 20.5C6.5 17 3 13.6 3 9.4A4.9 4.9 0 0 1 7.9 4.5c1.7 0 3.2.9 4.1 2.3.9-1.4 2.4-2.3 4.1-2.3A4.9 4.9 0 0 1 21 9.4c0 4.2-3.5 7.6-9 11.1z" />,
);

export const CartIcon = icon(
  "CartIcon",
  <>
    <path d="M2.5 3.5h2.2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L20.5 8H5.6" />
    <circle cx="9.5" cy="20" r="1.25" />
    <circle cx="17" cy="20" r="1.25" />
  </>,
);

export const HomeIcon = icon(
  "HomeIcon",
  <>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9" />
  </>,
);

export const BriefcaseIcon = icon(
  "BriefcaseIcon",
  <>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8.5 7V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2" />
    <path d="M3 12.5h18" />
  </>,
);

export const HelpIcon = icon(
  "HelpIcon",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
    <path d="M12 17h.01" />
  </>,
);

/* ───────── İletişim ───────── */

export const PhoneIcon = icon(
  "PhoneIcon",
  <path d="M5 3.5h3.2l1.6 4.3-2.3 1.5a11 11 0 0 0 7.2 7.2l1.5-2.3 4.3 1.6V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.1A1.5 1.5 0 0 1 5 3.5z" />,
);

export const MailIcon = icon(
  "MailIcon",
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5 12 13l8.5-6.5" />
  </>,
);

export const MapPinIcon = icon(
  "MapPinIcon",
  <>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </>,
);

export const ChatIcon = icon(
  "ChatIcon",
  <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.3A8.5 8.5 0 1 1 20.5 11.5z" />,
);

/* ───────── Küçük yardımcılar ───────── */

export const ArrowRightIcon = icon(
  "ArrowRightIcon",
  <path d="M5 12h14M13 6l6 6-6 6" />,
);

export const ChevronRightIcon = icon("ChevronRightIcon", <path d="M9 6l6 6-6 6" />);
export const ChevronLeftIcon = icon("ChevronLeftIcon", <path d="M15 6l-6 6 6 6" />);
export const ChevronDownIcon = icon("ChevronDownIcon", <path d="M6 9l6 6 6-6" />);
export const CloseIcon = icon("CloseIcon", <path d="M6 6l12 12M18 6 6 18" />);
export const CheckIcon = icon("CheckIcon", <path d="M4.5 12.5l5 5 10-11" />);

export const CheckCircleIcon = icon(
  "CheckCircleIcon",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.25 10.75 15 16 9.5" />
  </>,
);

export const InfoIcon = icon(
  "InfoIcon",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.75h.01" />
  </>,
);

export const ClockIcon = icon(
  "ClockIcon",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </>,
);

export const SpinnerIcon = icon("SpinnerIcon", <path d="M12 3a9 9 0 1 0 9 9" />);

export const FiltersIcon = icon(
  "FiltersIcon",
  <>
    <path d="M3.5 6h9M16.5 6h4M3.5 12h3M10.5 12h10M3.5 18h11M18.5 18h2" />
    <circle cx="14.5" cy="6" r="2" />
    <circle cx="8.5" cy="12" r="2" />
    <circle cx="16.5" cy="18" r="2" />
  </>,
);

export const ListIcon = icon(
  "ListIcon",
  <path d="M9 6h11.5M9 12h11.5M9 18h11.5M4 6h.01M4 12h.01M4 18h.01" />,
);

export const KeyIcon = icon(
  "KeyIcon",
  <>
    <circle cx="8" cy="16" r="4" />
    <path d="M10.9 13.1 20 4M16.5 7.5 19 10M14 10l2 2" />
  </>,
);

export const ReorderIcon = icon(
  "ReorderIcon",
  <>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
    <path d="M3.5 3.5v5h5" />
  </>,
);
