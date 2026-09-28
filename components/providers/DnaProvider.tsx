"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_DNA, sanitizeDNA } from "@/lib/dna";
import { personalizationService } from "@/lib/services/personalizationService";
import type { DnaDimension, TravelDNA, TravelPersona } from "@/lib/types";

interface DnaContextValue {
  dna: TravelDNA;
  persona: TravelPersona;
  setDimension: (dimension: DnaDimension, value: number) => void;
  setDna: (dna: TravelDNA) => void;
  reset: () => void;
}

const DnaContext = createContext<DnaContextValue | null>(null);

export function DnaProvider({ children }: { children: ReactNode }) {
  const [dna, setDnaState] = useState<TravelDNA>(DEFAULT_DNA);

  // Hydrate from storage after mount so SSR and the first client render match.
  useEffect(() => {
    const stored = personalizationService.load();
    const id = requestAnimationFrame(() => setDnaState(stored));
    return () => cancelAnimationFrame(id);
  }, []);

  const commit = useCallback((next: TravelDNA) => {
    const clean = sanitizeDNA(next);
    setDnaState(clean);
    personalizationService.save(clean);
  }, []);

  const setDimension = useCallback(
    (dimension: DnaDimension, value: number) => {
      setDnaState((prev) => {
        const next = sanitizeDNA({ ...prev, [dimension]: value });
        personalizationService.save(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo<DnaContextValue>(
    () => ({
      dna,
      persona: personalizationService.persona(dna),
      setDimension,
      setDna: commit,
      reset: () => commit(DEFAULT_DNA),
    }),
    [dna, setDimension, commit],
  );

  return <DnaContext.Provider value={value}>{children}</DnaContext.Provider>;
}

export function useTravelDna(): DnaContextValue {
  const ctx = useContext(DnaContext);
  if (!ctx) throw new Error("useTravelDna must be used inside <DnaProvider>");
  return ctx;
}
