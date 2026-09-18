"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";

// clear referansı CartProvider'da useCallback([]) ile sabitlendiği için bu
// effect gerçekten sadece mount'ta bir kez çalışır.
export default function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
