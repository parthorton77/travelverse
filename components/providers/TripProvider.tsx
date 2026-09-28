"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { tripService } from "@/lib/services/tripService";
import type { GeneratedTrip, TripRequest } from "@/lib/types";

export type TripStatus = "idle" | "generating" | "ready" | "error";

interface TripContextValue {
  trip: GeneratedTrip | null;
  status: TripStatus;
  error: string | null;
  lastRequest: TripRequest | null;
  generate: (request: TripRequest) => Promise<GeneratedTrip | null>;
  clear: () => void;
}

const TripContext = createContext<TripContextValue | null>(null);
const STORAGE_KEY = "travelverse.trip.v1";

/** Minimum time the "thinking" sequence stays on screen so it reads as intentional. */
const MIN_THINKING_MS = 2600;
const MIN_THINKING_REDUCED_MS = 700;

export function TripProvider({ children }: { children: ReactNode }) {
  const [trip, setTrip] = useState<GeneratedTrip | null>(null);
  const [status, setStatus] = useState<TripStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<TripRequest | null>(null);
  const requestId = useRef(0);

  // Restore the session's trip so /plan → /journey → /stays keeps context.
  useEffect(() => {
    let restored: GeneratedTrip | null = null;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      restored = raw ? (JSON.parse(raw) as GeneratedTrip) : null;
    } catch {
      restored = null;
    }
    if (!restored?.journey?.length) return;
    const id = requestAnimationFrame(() => {
      setTrip(restored);
      setLastRequest(restored.request);
      setStatus("ready");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const generate = useCallback(async (request: TripRequest) => {
    const id = ++requestId.current;
    setStatus("generating");
    setError(null);
    setLastRequest(request);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const minDelay = new Promise((r) => setTimeout(r, reduced ? MIN_THINKING_REDUCED_MS : MIN_THINKING_MS));
    try {
      const [result] = await Promise.all([tripService.generateTrip(request), minDelay]);
      if (id !== requestId.current) return null;
      setTrip(result);
      setStatus("ready");
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch {
        // Non-fatal: the trip just won't survive a reload.
      }
      return result;
    } catch (e) {
      await minDelay;
      if (id !== requestId.current) return null;
      setError(e instanceof Error ? e.message : "The journey engine couldn't compose this trip.");
      setStatus("error");
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    requestId.current++;
    setTrip(null);
    setStatus("idle");
    setError(null);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ trip, status, error, lastRequest, generate, clear }), [trip, status, error, lastRequest, generate, clear]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside <TripProvider>");
  return ctx;
}
