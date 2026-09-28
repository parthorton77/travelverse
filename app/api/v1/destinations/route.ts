import type { NextRequest } from "next/server";
import { destinationService, estimateBudgetRange } from "@/lib/services/destinationService";
import { DESTINATION_CATEGORIES, type DestinationCategory } from "@/lib/types";

/** GET /api/v1/destinations?category=beach — 3D Destination Engine catalogue. */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("category");
  const category = DESTINATION_CATEGORIES.includes(raw as DestinationCategory) ? (raw as DestinationCategory) : undefined;
  const list = await destinationService.list(category ? { category } : undefined);
  return Response.json({
    data: list.map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      coordinates: d.coordinates,
      categories: d.categories,
      tagline: d.tagline,
      idealDays: d.idealDays,
      bestTime: d.bestTime,
      estimatedBudgetPerPerson: estimateBudgetRange(d),
      dna: d.dna,
    })),
    meta: { count: list.length, sample: true },
  });
}
