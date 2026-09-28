"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DestinationScene } from "@/components/destination/DestinationScene";
import { useTravelDna } from "@/components/providers/DnaProvider";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DNA_META, DNA_PRESETS } from "@/lib/dna";
import { cn } from "@/lib/cn";
import { personalizationService } from "@/lib/services/personalizationService";
import type { DestinationSummary } from "@/lib/summaries";
import { DNA_DIMENSIONS } from "@/lib/types";
import { DnaSignature } from "./DnaSignature";

/**
 * Travel DNA: a personal travel identity the traveller can tune. The
 * signature, persona and recommendations all react live, and the planner uses
 * the same DNA when composing trips.
 */
export function TravelDNA({ destinations, index = "05" }: { destinations: DestinationSummary[]; index?: string }) {
  const { dna, persona, setDimension, setDna, reset } = useTravelDna();
  const ranked = useMemo(() => personalizationService.rank(dna, destinations).slice(0, 4), [dna, destinations]);
  const activePreset = DNA_PRESETS.find((p) => DNA_DIMENSIONS.every((d) => p.dna[d] === dna[d]))?.id;

  return (
    <section id="dna" aria-label="Your Travel DNA" className="relative scroll-mt-20 overflow-hidden py-28 md:py-40">
      <div aria-hidden className="pointer-events-none absolute left-[-10%] top-1/3 size-[40rem] rounded-full bg-ocean/[0.05] blur-3xl" />
      <div className="relative mx-auto max-w-[1680px] px-5 md:px-10">
        <SectionHeading
          index={index}
          eyebrow="Personalisation"
          title="Your Travel DNA"
          lede="Seven dimensions that describe how you like to travel. Tune them and watch your signature — and the world's recommendations — change shape."
        />

        <div className="mt-16 grid items-center gap-14 lg:mt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-[640px]">
            <DnaSignature dna={dna} className="w-full" />
            <div className="pointer-events-none absolute inset-x-0 bottom-[-1rem] text-center lg:bottom-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={persona.title}
                  className="font-serif text-3xl italic md:text-4xl"
                  initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.5 }}
                >
                  {persona.title}
                </motion.p>
              </AnimatePresence>
              <p className="hud mt-2 text-mist">{persona.code}</p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hud mr-2 text-mist">Start from</span>
              {DNA_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={activePreset === p.id}
                  onClick={() => setDna(p.dna)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs transition-colors",
                    activePreset === p.id ? "bg-bone text-ink-950" : "bg-white/[0.05] text-bone-dim hover:text-bone",
                  )}
                >
                  {p.label}
                </button>
              ))}
              <button type="button" onClick={reset} className="ml-1 grid size-8 place-items-center rounded-full text-mist hover:text-bone" aria-label="Reset Travel DNA">
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            <ul className="mt-8 space-y-5">
              {DNA_DIMENSIONS.map((dim) => {
                const meta = DNA_META[dim];
                const value = dna[dim];
                return (
                  <li key={dim}>
                    <div className="flex items-baseline justify-between gap-4">
                      <label htmlFor={`dna-${dim}`} className="flex items-baseline gap-3">
                        <span className="font-mono text-[0.65rem] tracking-[0.2em]" style={{ color: meta.color }}>
                          {meta.code}
                        </span>
                        <span className="font-medium">{meta.label}</span>
                        <span className="hidden text-sm text-mist sm:inline">{meta.descriptor}</span>
                      </label>
                      <span className="font-mono text-sm tabular-nums text-bone-dim">{Math.round(value)}</span>
                    </div>
                    <input
                      id={`dna-${dim}`}
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => setDimension(dim, Number(e.target.value))}
                      className="tv-range mt-1"
                      style={{ ["--fill" as string]: `${value}%`, ["--track" as string]: meta.color }}
                      aria-valuetext={`${meta.label} ${Math.round(value)} out of 100`}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <Reveal className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <p className="eyebrow">Tuned to you right now</p>
            <Link href="#plan" className="flex items-center gap-2 text-sm text-bone-dim hover:text-bone">
              Plan a trip with this DNA <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
          <LayoutGroup>
            <ol className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
              {ranked.map(({ destination: d, match }, i) => (
                <motion.li key={d.id} layout transition={{ type: "spring", stiffness: 260, damping: 30 }} className="bg-ink-950">
                  <Link href={`/destinations/${d.slug}`} className="group flex items-center gap-4 p-4 md:p-5">
                    <DestinationScene scene={d.scene} className="size-16 shrink-0 md:size-20" />
                    <div className="min-w-0 flex-1">
                      <p className="hud text-mist">{String(i + 1).padStart(2, "0")}</p>
                      <p className="truncate text-lg font-semibold">{d.name}</p>
                      <div className="mt-2 h-px w-full bg-line">
                        <motion.div className="h-px bg-sand" animate={{ width: `${match}%` }} transition={{ duration: 0.6 }} />
                      </div>
                    </div>
                    <span className="font-mono text-sm text-sand tabular-nums">{match}%</span>
                  </Link>
                </motion.li>
              ))}
            </ol>
          </LayoutGroup>
        </Reveal>
      </div>
    </section>
  );
}
