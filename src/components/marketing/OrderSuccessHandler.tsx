"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/store/cart";

export default function OrderSuccessHandler() {
  const searchParams = useSearchParams();
  const clearCart = useCart((s) => s.clearCart);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      clearCart();
    }
  }, [searchParams, clearCart]);

  return null;
}
