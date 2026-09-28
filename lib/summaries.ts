import { DEFAULT_DEPARTURE_ID, departureCities } from "@/data/cities";
import { estimateTransport } from "@/lib/ai/tripEngine";
import { estimateBudgetRange, type BudgetRange } from "@/lib/services/destinationService";
import type { Destination, DestinationCategory, SceneConfig, TransportMode, TravelDNA } from "@/lib/types";

/**
 * The slice of a destination that interactive client components need.
 * Computed on the server so cost models stay out of the browser bundle.
 */
export interface DestinationSummary {
  id: string;
  slug: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  tagline: string;
  description: string;
  categories: DestinationCategory[];
  idealDays: [number, number];
  bestTime: string;
  scene: SceneConfig;
  dna: TravelDNA;
  budget: BudgetRange;
  transport: { mode: TransportMode; durationHours: number; fromName: string; fromCode: string; toCode: string };
}

export function toSummary(d: Destination): DestinationSummary {
  const from = departureCities.find((c) => c.id === DEFAULT_DEPARTURE_ID) ?? departureCities[0];
  const t = estimateTransport(from, d);
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    country: d.country,
    lat: d.coordinates.lat,
    lng: d.coordinates.lng,
    timezone: d.timezone,
    tagline: d.tagline,
    description: d.description,
    categories: d.categories,
    idealDays: d.idealDays,
    bestTime: d.bestTime,
    scene: d.scene,
    dna: d.dna,
    budget: estimateBudgetRange(d),
    transport: { mode: t.mode, durationHours: t.durationHours, fromName: from.name, fromCode: from.airportCode, toCode: d.airportCode },
  };
}

export const CATEGORY_LABEL: Record<DestinationCategory, string> = {
  beach: "Beach",
  mountains: "Mountains",
  city: "City",
  adventure: "Adventure",
  culture: "Culture",
  luxury: "Luxury",
  food: "Food",
  "hidden-gems": "Hidden gems",
};
