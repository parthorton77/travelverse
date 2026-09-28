import { getTripProvider, TripGenerationError } from "@/lib/ai/provider";
import { normalizeRequest } from "@/lib/ai/tripEngine";
import type { TripRequest } from "@/lib/types";

/**
 * POST /api/v1/trips — TravelVerse AI Journey Engine.
 *
 * Accepts a (partial) TripRequest and returns a GeneratedTrip. The provider is
 * chosen server-side, so a production LLM key would live only in server env.
 */
export async function POST(request: Request) {
  let body: Partial<TripRequest>;
  try {
    body = (await request.json()) as Partial<TripRequest>;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Request body must be a TripRequest object." }, { status: 400 });
  }

  const provider = getTripProvider();
  const started = Date.now();
  try {
    const trip = await provider.generate(normalizeRequest(body));
    return Response.json(
      { trip, meta: { provider: provider.id, engine: trip.engine, latencyMs: Date.now() - started, sample: true } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof TripGenerationError ? error.message : "The journey engine couldn't compose this trip.";
    return Response.json({ error: message }, { status: 502 });
  }
}
