import type { GeneratedTrip, TripRequest } from "@/lib/types";

/**
 * Client-side trip planning service.
 *
 * Calls the TravelVerse API (`POST /api/v1/trips`), which selects the planning
 * provider on the server. If the network is unavailable (offline demo, static
 * hosting) it falls back to running the same mock engine in the browser.
 */

const TIMEOUT_MS = 8000;

export class TripServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TripServiceError";
  }
}

async function generateLocally(request: TripRequest): Promise<GeneratedTrip> {
  const { mockTripProvider } = await import("@/lib/ai/provider");
  return mockTripProvider.generate(request);
}

export const tripService = {
  async generateTrip(request: TripRequest): Promise<GeneratedTrip> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch("/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    } catch {
      // Network-level failure — keep the demo alive with the local engine.
      clearTimeout(timer);
      return generateLocally(request);
    }
    clearTimeout(timer);

    if (response.status === 404) return generateLocally(request);

    const body = (await response.json().catch(() => null)) as { trip?: GeneratedTrip; error?: string } | null;
    if (!response.ok || !body?.trip) {
      throw new TripServiceError(body?.error ?? "The journey engine couldn't compose this trip.");
    }
    return body.trip;
  },
};
