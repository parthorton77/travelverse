import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DestinationExperience } from "@/components/destination/DestinationExperience";
import { destinationService } from "@/lib/services/destinationService";
import { experienceService } from "@/lib/services/experienceService";
import { hotelService } from "@/lib/services/hotelService";
import { toSummary } from "@/lib/summaries";

// The catalogue is known at build time; anything else is a genuine 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await destinationService.slugs()).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const d = await destinationService.getBySlug(slug);
  return d ? { title: `${d.name}, ${d.country}`, description: `${d.tagline} ${d.description}` } : { title: "Destination not found" };
}

export default async function DestinationPage(props: PageProps<"/destinations/[slug]">) {
  const { slug } = await props.params;
  const destination = await destinationService.getBySlug(slug);
  if (!destination) notFound();

  const [experiences, dining, stays, next] = await Promise.all([
    experienceService.listForDestination(destination.id),
    experienceService.diningForDestination(destination.id),
    hotelService.listForDestination(destination.id),
    destinationService.next(slug),
  ]);

  return (
    <DestinationExperience
      destination={toSummary(destination)}
      points={destination.pointsOfInterest}
      experiences={experiences}
      dining={dining}
      stays={stays}
      next={toSummary(next)}
    />
  );
}
