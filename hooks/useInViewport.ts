"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Tracks whether an element is within (or near) the viewport. Used to pause
 * WebGL render loops off-screen and to lazily mount heavy scenes.
 */
export function useInViewport<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = "0px", once = false }: { rootMargin?: string; once?: boolean } = {},
): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);
  return inView;
}
