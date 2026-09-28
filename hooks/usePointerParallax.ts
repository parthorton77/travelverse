"use client";

import { useEffect, type RefObject } from "react";

/**
 * Writes normalised pointer position (-1…1) to `--px` / `--py` CSS variables
 * on the element. Layers read them in CSS, so parallax never re-renders React.
 */
export function usePointerParallax<T extends HTMLElement>(ref: RefObject<T | null>, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia?.("(hover: hover)").matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 2 - 1;
        const y = ((e.clientY - r.top) / r.height) * 2 - 1;
        el.style.setProperty("--px", (-x).toFixed(3));
        el.style.setProperty("--py", (-y).toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, enabled]);
}
