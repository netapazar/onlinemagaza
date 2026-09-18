"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";

const VISIBLE_MS = 2500;

export default function CartToast() {
  const { toast } = useCart();
  const [dismissedId, setDismissedId] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setDismissedId(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast || toast.id === dismissedId) return null;

  return (
    <div className="fixed top-20 left-1/2 z-[60] -translate-x-1/2 sm:top-24">
      <div className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        {toast.message}
      </div>
    </div>
  );
}
