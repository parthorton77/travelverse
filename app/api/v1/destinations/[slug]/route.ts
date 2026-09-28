import type { NextRequest } from "next/server";
import { destinationService, estimateBudgetRange } from "@/lib/services/destinationService";
import { experienceService } from "@/lib/services/experienceService";
import { hotelService } from "@/lib/services/hotelService";

/** GET /api/v1/destinations/:slug — full destination record with experiences and stays. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/v1/destinations/[slug]">) {
  const { slug } = await ctx.params;
  const destination = await destinationService.getBySlug(slug);
  if (!destination) return Response.json({ error: `Unknown destination "${slug}".` }, { status: 404 });
  const [experiences, dining, stays] = await Promise.all([
    experienceService.listForDestination(destination.id),
    experienceService.diningForDestination(destination.id),
    hotelService.listForDestination(destination.id),
  ]);
  return Response.json({
    data: { ...destination, estimatedBudgetPerPerson: estimateBudgetRange(destination), experiences, dining, stays },
    meta: { sample: true },
  });
}
