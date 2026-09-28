import type { Metadata } from "next";
import { ExploreExperience } from "@/components/destination/ExploreExperience";
import { destinationService } from "@/lib/services/destinationService";
import { toSummary } from "@/lib/summaries";

export const metadata: Metadata = {
  title: "Explore",
  description: "Move through the world by feeling — beach, mountains, city, adventure, culture, luxury, food and hidden gems — on a living 3D globe.",
};

export default async function ExplorePage() {
  const destinations = (await destinationService.list()).map(toSummary);
  return <ExploreExperience destinations={destinations} />;
}
