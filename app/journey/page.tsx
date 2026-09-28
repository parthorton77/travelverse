import type { Metadata } from "next";
import { JourneyPageView } from "@/components/journey/JourneyPageView";
import { sampleTripRequest } from "@/data/trips";
import { generateTrip } from "@/lib/ai/tripEngine";
import { destinationService } from "@/lib/services/destinationService";

export const metadata: Metadata = {
  title: "Journey",
  description: "Play your trip stop by stop — flight, check-in, sunsets and all — before you commit.",
};

export default async function JourneyPage() {
  const catalogue = await destinationService.list();
  const scenes = Object.fromEntries(catalogue.map((d) => [d.id, d.scene]));
  return <JourneyPageView sampleTrip={generateTrip(sampleTripRequest)} scenes={scenes} />;
}
