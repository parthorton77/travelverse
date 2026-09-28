import { TripPlanner } from "@/components/ai/TripPlanner";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { departureCities } from "@/data/cities";
import type { DestinationSummary } from "@/lib/summaries";

export function PlannerSection({ destinations }: { destinations: DestinationSummary[] }) {
  return (
    <section id="plan" aria-label="AI trip builder" className="scroll-mt-20 py-28 md:py-40">
      <div className="mx-auto max-w-[1680px] px-5 md:px-10">
        <SectionHeading
          index="03"
          eyebrow="AI trip builder"
          title="Tell us what kind of journey you want."
          lede="Say it the way you'd say it to a friend. The engine understands budget, time, who's coming and what you want to feel — then composes the whole trip."
        />
        <div className="mt-14 md:mt-20">
          <TripPlanner destinations={destinations} cities={departureCities} journeyHref="#journey" />
        </div>
      </div>
    </section>
  );
}
