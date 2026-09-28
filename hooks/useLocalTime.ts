"use client";

import { useEffect, useState } from "react";
import { formatLocalTime } from "@/lib/format";

/** Live local time for an IANA timezone. Empty during SSR to avoid hydration drift. */
export function useLocalTime(timezone: string | undefined, intervalMs = 30_000): string {
  const [time, setTime] = useState("");
  useEffect(() => {
    if (!timezone) return;
    const tick = () => setTime(formatLocalTime(timezone));
    const first = requestAnimationFrame(tick);
    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelAnimationFrame(first);
      window.clearInterval(id);
    };
  }, [timezone, intervalMs]);
  return time;
}
