import type { TripRequest } from "@/lib/types";

/**
 * The sample journey shown before a visitor composes their own — the exact
 * brief from the product spec.
 */
export const sampleTripRequest: TripRequest = {
  prompt: "I have ₹75,000 for 5 days. I'm travelling as a couple from Ahmedabad. I want beaches, adventure and a little luxury.",
  budget: 75000,
  days: 5,
  travelers: { type: "couple", adults: 2, children: 0 },
  departureCityId: "ahmedabad",
  interests: ["beach", "adventure", "luxury"],
};
