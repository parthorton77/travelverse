import type { Metadata } from "next";
import { TripPlanner } from "@/components/ai/TripPlanner";
import { TravelDNA } from "@/components/dna/TravelDNA";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { departureCities } from "@/data/cities";
import { destinationService } from "@/lib/services/destinationService";
import { toSummary } from "@/lib/summaries";

export const metadata: Metadata = {
  title: "Plan",
  description: "Tell the TravelVerse journey engine what kind of trip you want. It composes the route, stay, budget and day-by-day plan.",
};

export default async function PlanPage(props: PageProps<"/plan">) {
  const params = await props.searchParams;
  const destinations = (await destinationService.list()).map(toSummary);
  const requested = typeof params.destination === "string" ? params.destination : undefined;
  const initialDestinationId = destinations.find((d) => d.slug === requested)?.id;
  const initialPrompt = typeof params.q === "string" ? params.q.slice(0, 600) : undefined;

  return (
    <>
      <section className="pb-24 pt-28 md:pb-32 md:pt-36" aria-label="AI trip builder">
        <div className="mx-auto max-w-[1680px] px-5 md:px-10">
          <p className="eyebrow">AI trip builder</p>
          <AnimatedText as="h1" text="Tell us what you want to feel." immediate className="mt-5 max-w-5xl text-headline font-semibold" />
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone-dim">
            {initialDestinationId
              ? `Starting from ${destinations.find((d) => d.id === initialDestinationId)?.name}. Describe the trip — or just press compose.`
              : "Budget, days, who's coming, what you're craving. Say it naturally — the engine does the rest."}
          </p>
          <div className="mt-14">
            <TripPlanner
              key={initialDestinationId ?? "any"}
              destinations={destinations}
              cities={departureCities}
              initialDestinationId={initialDestinationId}
              initialPrompt={initialPrompt}
              journeyHref="/journey"
            />
          </div>
        </div>
      </section>
      <TravelDNA destinations={destinations} index="→" />
    </>
  );
}
