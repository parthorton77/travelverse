import { DEFAULT_DNA, dnaSimilarity, getPersona, matchPercent, sanitizeDNA } from "@/lib/dna";
import type { Destination, TravelDNA, TravelPersona } from "@/lib/types";

const STORAGE_KEY = "travelverse.dna.v1";

export interface RankedDestination<T extends Pick<Destination, "dna"> = Destination> {
  destination: T;
  match: number;
}

/**
 * Travel DNA persistence and ranking. Uses localStorage for now; a signed-in
 * profile API would replace load/save without touching the UI.
 */
export const personalizationService = {
  load(): TravelDNA {
    if (typeof window === "undefined") return DEFAULT_DNA;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? sanitizeDNA(JSON.parse(raw)) : DEFAULT_DNA;
    } catch {
      return DEFAULT_DNA;
    }
  },

  save(dna: TravelDNA): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dna));
    } catch {
      // Storage can be unavailable (private mode, quota). Preferences simply won't persist.
    }
  },

  rank<T extends Pick<Destination, "dna">>(dna: TravelDNA, list: T[]): RankedDestination<T>[] {
    return list
      .map((destination) => ({ destination, match: matchPercent(dnaSimilarity(dna, destination.dna)) }))
      .sort((a, b) => b.match - a.match);
  },

  persona(dna: TravelDNA): TravelPersona {
    return getPersona(dna);
  },
};
