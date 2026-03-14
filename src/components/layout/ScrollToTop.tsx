"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function scrollToTop() {
  window.scrollTo(0, 0);
}

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    scrollToTop();
    const raf = requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
    });
    const t = setTimeout(scrollToTop, 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
