"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { STOP_ICON } from "@/components/journey/stopMeta";
import { cn } from "@/lib/cn";
import type { PointOfInterest, SceneConfig } from "@/lib/types";
import { DestinationScene } from "./DestinationScene";

/** Hotspots placed over the destination panorama; the list beside it is the accessible equivalent. */
export function PointsOfInterest({ points, scene, name }: { points: PointOfInterest[]; scene: SceneConfig; name: string }) {
  const [active, setActive] = useState(points[0]?.id ?? null);
  const current = points.find((p) => p.id === active);
  if (!points.length) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-stretch">
      <DestinationScene scene={scene} parallax label={`${name} panorama with points of interest`} className="aspect-[16/10] w-full border border-line lg:aspect-auto lg:min-h-[520px]">
        <div className="absolute inset-0 bg-ink-950/15" />
        {points.map((p) => {
          const on = p.id === active;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              onMouseEnter={() => setActive(p.id)}
              aria-label={p.name}
              aria-pressed={on}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className={cn("absolute inset-0 -m-2 rounded-full border border-bone/60", on ? "animate-pulse-ring" : "opacity-0")} aria-hidden />
              <span className={cn("relative grid size-4 place-items-center rounded-full border-2 transition-all", on ? "scale-125 border-bone bg-sand" : "border-bone/80 bg-ink-950/60")} />
              <span
                className={cn(
                  "hud absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 backdrop-blur-md transition-all",
                  on ? "bg-bone text-ink-950" : "bg-ink-950/50 text-bone opacity-0 group-hover:opacity-100 md:opacity-100",
                )}
              >
                {p.name}
              </span>
            </button>
          );
        })}
      </DestinationScene>

      <div className="flex flex-col">
        <ul className="divide-y divide-line border-y border-line">
          {points.map((p) => {
            const Icon = STOP_ICON[p.kind];
            const on = p.id === active;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => setActive(p.id)} aria-pressed={on} className="flex w-full items-center gap-4 py-4 text-left">
                  <Icon className={cn("size-4 shrink-0", on ? "text-sand" : "text-mist")} aria-hidden />
                  <span className={cn("text-lg transition-colors", on ? "text-bone" : "text-bone-dim")}>{p.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 min-h-28" aria-live="polite">
          <AnimatePresence mode="wait">
            {current && (
              <motion.p key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-serif text-2xl italic leading-snug text-bone">
                {current.description}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
