import { centsToTl } from "@/lib/pricing";
import { TruckIcon } from "@/components/icons";

// "Ücretsiz kargo için ___ daha ekleyin." (2026-10-13) — sepet, sepet çekmecesi ve ödeme sayfasında, ürün toplamı ücretsiz
// kargo eşiğinin altındaysa. Kural kapalıysa, eşik aşıldıysa ya da firma kargo muafsa kalanCents 0 gelir ve hiçbir şey çizilmez.
export default function UcretsizKargoNotu({ kalanCents, className = "" }: { kalanCents: number; className?: string }) {
  if (kalanCents <= 0) return null;
  return (
    <p className={`flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-800)] ${className}`}>
      <TruckIcon className="h-4 w-4 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
      Ücretsiz kargo için {centsToTl(kalanCents)} ₺ daha ekleyin.
    </p>
  );
}
