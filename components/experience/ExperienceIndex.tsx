"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { DestinationScene } from "@/components/destination/DestinationScene";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { formatDuration, formatINR, pad2 } from "@/lib/format";
import { stageFor } from "@/lib/scene/compose";
import type { DestinationSummary } from "@/lib/summaries";
import type { DaySlot, Experience, TimeOfDay } from "@/lib/types";

export interface ExperienceItem {
  experience: Experience;
  destination: DestinationSummary;
}

const SLOT_TIME: Record<DaySlot, TimeOfDay> = { morning: "dawn", afternoon: "day", evening: "golden", "full-day": "day" };

function ExperienceCard({ item, className }: { item: ExperienceItem; className?: string }) {
  const { experience: e, destination: d } = item;
  return (
    <DestinationScene scene={d.scene} sceneId={stageFor(e.kind, d.scene.kind)} time={SLOT_TIME[e.slot]} className={className}>
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="hud text-sand">
          {d.name} · {formatDuration(e.durationHours)}
        </p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-bone-dim">{e.description}</p>
        <p className="mt-3 flex items-center gap-2 text-sm">
          {e.costPerPerson ? <span className="tabular-nums">From {formatINR(e.costPerPerson)} pp</span> : <span>Free to experience</span>}
          <EstimateTag />
        </p>
      </div>
    </DestinationScene>
  );
}

/** "Travel isn't a destination. It's an experience." — an index of moments, each previewed as it would feel. */
export function ExperienceIndex({ items, index = "07" }: { items: ExperienceItem[]; index?: string }) {
  const [active, setActive] = useState(0);
  const current = items[active];
  if (!items.length) return null;

  return (
    <section aria-label="Immersive experiences" className="py-28 md:py-40">
      <div className="mx-auto max-w-[1680px] px-5 md:px-10">
        <SectionHeading index={index} eyebrow="Immersive experiences" title="Travel isn't a destination. It's an experience." />

        {/* Mobile: swipe through moments. */}
        <div className="scrollbar-none -mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:hidden">
          {items.map((item) => (
            <Link key={item.experience.id} href={`/destinations/${item.destination.slug}`} className="w-[84vw] shrink-0 snap-center">
              <ExperienceCard item={item} className="aspect-[4/5]" />
              <p className="mt-4 text-xl font-semibold tracking-[-0.02em]">{item.experience.title}</p>
            </Link>
          ))}
        </div>

        <div className="mt-20 hidden gap-14 md:grid md:grid-cols-[1.15fr_1fr] lg:gap-24">
          <ol>
            {items.map((item, i) => (
              <li key={item.experience.id} className="border-b border-line first:border-t">
                <Link
                  href={`/destinations/${item.destination.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-6"
                >
                  <span className={cn("hud transition-colors", i === active ? "text-sand" : "text-mist")}>{pad2(i + 1)}</span>
                  <span
                    className={cn(
                      "text-[clamp(1.4rem,2.3vw,2.4rem)] font-semibold leading-tight tracking-[-0.03em] transition-[color,transform] duration-500",
                      i === active ? "translate-x-2 text-bone" : "text-bone/45 group-hover:text-bone/80",
                    )}
                  >
                    {item.experience.title}
                  </span>
                  <span className="hud text-mist">{item.destination.name}</span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="relative">
            <div className="sticky top-28">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={current.experience.id}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ExperienceCard item={current} className="aspect-[4/5] max-h-[72vh] w-full border border-line" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
