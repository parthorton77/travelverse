"use client";

import { useTrip } from "@/components/providers/TripProvider";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatINR } from "@/lib/format";
import type { GeneratedTrip, SceneConfig } from "@/lib/types";
import { JourneyTimeline } from "./JourneyTimeline";

interface JourneySectionProps {
  sampleTrip: GeneratedTrip;
  scenes: Record<string, SceneConfig>;
  index?: string;
}

/**
 * Plays the traveller's own composed trip when there is one, otherwise the
 * sample "5 days · Goa" journey. The planner above feeds this directly.
 */
export function JourneySection({ sampleTrip, scenes, index = "04" }: JourneySectionProps) {
  const { trip } = useTrip();
  const active = trip ?? sampleTrip;
  const scene = scenes[active.destinationId] ?? Object.values(scenes)[0];
  const isSample = !trip;

  return (
    <section id="journey" aria-label="Interactive journey" className="scroll-mt-20 py-28 md:py-40">
      <div className="mx-auto max-w-[1680px] px-5 md:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            index={index}
            eyebrow="Interactive journey"
            title="Move through your trip like a world."
            lede="Every stop is a place you can step into — the flight, the check-in, the first sunset. Play it, scrub it, feel the pacing before you commit."
          />
          <div className="shrink-0 border-l border-line pl-6 lg:mb-2">
            <p className="hud text-mist">{isSample ? "Sample journey" : "Your journey"}</p>
            <p className="mt-2 text-2xl font-semibold uppercase tracking-[-0.02em]">
              {active.days} days · {active.title}
            </p>
            <p className="mt-1 text-sm text-bone-dim">
              {active.transport.from.name} → {active.title} · {formatINR(active.budget.total)} <span className="text-mist">estimated</span>
            </p>
          </div>
        </div>
        <div className="mt-14 md:mt-20">
          <JourneyTimeline trip={active} scene={scene} />
        </div>
      </div>
    </section>
  );
}
