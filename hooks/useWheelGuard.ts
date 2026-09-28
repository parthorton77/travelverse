"use client";

import { useEffect, type RefObject } from "react";

/**
 * Stops plain mouse-wheel events from reaching a 3D canvas so the page keeps
 * scrolling. Pinch-to-zoom on trackpads (ctrl+wheel) and ⌘/Ctrl+scroll still
 * reach the camera controls. Runs in the capture phase, before the canvas.
 */
export function useWheelGuard<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.stopPropagation();
    };
    el.addEventListener("wheel", onWheel, { capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, [ref]);
}
