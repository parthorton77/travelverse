import { generateTrip } from "@/lib/ai/tripEngine";
import type { GeneratedTrip, TripRequest } from "@/lib/types";

/**
 * Pluggable trip-planning backend.
 *
 * `mock` runs the deterministic local engine. A real provider (e.g. an LLM
 * with tool calls into destination/hotel/flight services) implements the same
 * interface and is selected server-side via TRAVELVERSE_TRIP_PROVIDER, so API
 * keys never reach the browser.
 */
export interface TripPlannerProvider {
  id: string;
  generate(request: TripRequest): Promise<GeneratedTrip>;
}

export class TripGenerationError extends Error {
  constructor(message: string, readonly retryable = true) {
    super(message);
    this.name = "TripGenerationError";
  }
}

export const mockTripProvider: TripPlannerProvider = {
  id: "mock",
  async generate(request) {
    // Demo hook so reviewers can see the failure state: include "#fail" in the prompt.
    if (/#fail\b/i.test(request.prompt)) {
      throw new TripGenerationError("The journey engine lost the signal. Simulated failure.");
    }
    return generateTrip(request);
  },
};

const providers: Record<string, TripPlannerProvider> = {
  mock: mockTripProvider,
};

export function getTripProvider(id = process.env.TRAVELVERSE_TRIP_PROVIDER): TripPlannerProvider {
  return (id && providers[id]) || mockTripProvider;
}
