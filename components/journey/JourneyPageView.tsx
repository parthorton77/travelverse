"use client";

import { useTrip } from "@/components/providers/TripProvider";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { ButtonLink } from "@/components/ui/Button";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { formatDuration, formatINR } from "@/lib/format";
import type { GeneratedTrip, SceneConfig } from "@/lib/types";
import { ItineraryGrid } from "./ItineraryGrid";
import { JourneyTimeline } from "./JourneyTimeline";

/** Full-page Journey Simulator for the traveller's current trip (or the sample). */
export function JourneyPageView({ sampleTrip, scenes }: { sampleTrip: GeneratedTrip; scenes: Record<string, SceneConfig> }) {
  const { trip } = useTrip();
  const active = trip ?? sampleTrip;
  const scene = scenes[active.destinationId] ?? Object.values(scenes)[0];

  return (
    <div className="pb-28 pt-28 md:pt-36">
      <header className="mx-auto flex max-w-[1680px] flex-col gap-8 px-5 md:px-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{trip ? "Your journey" : "Sample journey"}</p>
          <AnimatedText as="h1" text={`${active.days} days · ${active.title}`} immediate className="mt-5 text-headline font-semibold uppercase text-balance-pretty" />
          <p className="mt-5 flex flex-wrap items-center gap-2 text-bone-dim">
            {active.transport.from.name} → {active.title} · {formatDuration(active.transport.durationHours)} {active.transport.mode} · {formatINR(active.budget.total)}
            <EstimateTag />
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/plan" variant={trip ? "ghost" : "primary"} arrow={!trip}>
            {trip ? "Edit this trip" : "Build your own"}
          </ButtonLink>
          <ButtonLink href="/stays" variant="ghost">
            Walk a stay
          </ButtonLink>
        </div>
      </header>

      <div className="mx-auto mt-14 max-w-[1680px] px-5 md:px-10">
        <JourneyTimeline trip={active} scene={scene} />
      </div>

      <section aria-label="Day by day" className="mx-auto mt-24 max-w-[1680px] px-5 md:px-10">
        <p className="eyebrow">Day by day</p>
        <div className="mt-6">
          <ItineraryGrid days={active.itinerary} />
        </div>
        <p className="mt-6 text-xs text-mist">{active.disclaimer}</p>
      </section>
    </div>
  );
}
