import { destinations } from "@/data/destinations";
import { estimateTransport } from "@/lib/ai/tripEngine";
import { departureCities, DEFAULT_DEPARTURE_ID } from "@/data/cities";
import { stays } from "@/data/hotels";
import type { Destination, DestinationCategory } from "@/lib/types";

/**
 * Destination data access. Backed by local sample data today; the async
 * signatures match what a CMS or destination API would need tomorrow.
 */
export const destinationService = {
  async list(filter?: { category?: DestinationCategory }): Promise<Destination[]> {
    if (!filter?.category) return destinations;
    return destinations.filter((d) => d.categories.includes(filter.category!));
  },

  async getBySlug(slug: string): Promise<Destination | null> {
    return destinations.find((d) => d.slug === slug) ?? null;
  },

  async getById(id: string): Promise<Destination | null> {
    return destinations.find((d) => d.id === id) ?? null;
  },

  async slugs(): Promise<string[]> {
    return destinations.map((d) => d.slug);
  },

  /** Next destination in the catalogue — used for "continue exploring". */
  async next(slug: string): Promise<Destination> {
    const i = destinations.findIndex((d) => d.slug === slug);
    return destinations[(i + 1) % destinations.length];
  },
};

export interface BudgetRange {
  min: number;
  max: number;
  days: number;
  fromCity: string;
}

/**
 * Per-person estimate for a destination's ideal trip length from the default
 * departure city, spanning comfort → luxury. Uses the same cost model as the
 * trip engine so the numbers agree across the product.
 */
export function estimateBudgetRange(dest: Destination, departureId = DEFAULT_DEPARTURE_ID): BudgetRange {
  const from = departureCities.find((c) => c.id === departureId) ?? departureCities[0];
  const days = Math.round((dest.idealDays[0] + dest.idealDays[1]) / 2);
  const nights = days - 1;
  const fare = estimateTransport(from, dest).farePerPerson;
  const tierStay = (tier: "comfort" | "luxury") => stays.find((s) => s.destinationId === dest.id && s.tier === tier)?.nightlyEstimate ?? 0;
  const perPerson = (tier: "comfort" | "luxury") =>
    fare + (tierStay(tier) * nights) / 2 + dest.costs.food[tier] * days + (dest.costs.localTransport * days) / 2;
  const round = (n: number) => Math.round(n / 1000) * 1000;
  return { min: round(perPerson("comfort")), max: round(perPerson("luxury") * 1.15), days, fromCity: from.name };
}
