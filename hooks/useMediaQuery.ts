"use client";

import { useSyncExternalStore } from "react";

/** SSR-safe media query subscription. Returns `serverValue` during SSR. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : serverValue),
    () => serverValue,
  );
}

/** True on devices with a precise pointer that can hover (mouse/trackpad). */
export function useCanHover(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)", true);
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)", false);
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false);
}
