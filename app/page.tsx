import { EngineShowcase } from "@/components/b2b/EngineShowcase";
import { DestinationRail } from "@/components/destination/DestinationRail";
import { TravelDNA } from "@/components/dna/TravelDNA";
import { ExperienceIndex } from "@/components/experience/ExperienceIndex";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { PlannerSection } from "@/components/home/PlannerSection";
import { StaySection } from "@/components/hotel/StaySection";
import { JourneySection } from "@/components/journey/JourneySection";
import { sampleTripRequest } from "@/data/trips";
import { generateTrip } from "@/lib/ai/tripEngine";
import { destinationService } from "@/lib/services/destinationService";
import { experienceService } from "@/lib/services/experienceService";
import { hotelService } from "@/lib/services/hotelService";
import { toSummary } from "@/lib/summaries";

export default async function HomePage() {
  const catalogue = await destinationService.list();
  const destinations = catalogue.map(toSummary);
  const scenes = Object.fromEntries(catalogue.map((d) => [d.id, d.scene]));
  const sampleTrip = generateTrip(sampleTripRequest);
  const stay = hotelService.getFlagshipSync();
  const signature = (await experienceService.signature(8)).map(({ experience, destination }) => ({ experience, destination: toSummary(destination) }));

  return (
    <>
      <Hero destinations={destinations} />
      <Manifesto />
      <DestinationRail destinations={destinations} />
      <PlannerSection destinations={destinations} />
      <JourneySection sampleTrip={sampleTrip} scenes={scenes} />
      <TravelDNA destinations={destinations} />
      <StaySection stay={stay} scene={scenes[stay.destinationId]} />
      <ExperienceIndex items={signature} />
      <EngineShowcase />
      <FinalCta />
    </>
  );
}
