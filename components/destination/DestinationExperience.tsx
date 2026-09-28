"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { ArrowUpRight, BedDouble, CalendarRange, Clock, Plane, TrainFront, Wallet } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { STOP_ICON } from "@/components/journey/stopMeta";
import { ButtonLink } from "@/components/ui/Button";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { useLocalTime } from "@/hooks/useLocalTime";
import { cn } from "@/lib/cn";
import { formatCoordinates, formatDuration, formatINR, formatINRCompact, pad2 } from "@/lib/format";
import { stageFor } from "@/lib/scene/compose";
import { CATEGORY_LABEL, type DestinationSummary } from "@/lib/summaries";
import type { DaySlot, Dining, Experience, PointOfInterest, Stay, TimeOfDay } from "@/lib/types";
import { DestinationScene } from "./DestinationScene";
import { PointsOfInterest } from "./PointsOfInterest";

const SLOT_TIME: Record<DaySlot, TimeOfDay> = { morning: "dawn", afternoon: "day", evening: "golden", "full-day": "day" };
const TIER_LABEL = { comfort: "Comfort", premium: "Premium", luxury: "Luxury" } as const;

interface DestinationExperienceProps {
  destination: DestinationSummary;
  points: PointOfInterest[];
  experiences: Experience[];
  dining: Dining[];
  stays: Stay[];
  next: DestinationSummary;
}

function Hero({ d }: { d: DestinationSummary }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();
  const localTime = useLocalTime(d.timezone);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const TransportIcon = d.transport.mode === "flight" ? Plane : TrainFront;
  const letters = d.name.split("");

  return (
    <section ref={ref} aria-label={`${d.name} — arrival`} className="relative h-[100svh] min-h-[640px] overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y }} initial={reduce ? false : { scale: 1.12, filter: "blur(10px)" }} animate={{ scale: 1, filter: "blur(0px)" }} transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}>
        <DestinationScene scene={d.scene} priority parallax drift={!reduce} label={`${d.name} at ${d.scene.palette.time}`} className="absolute inset-0" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-ink-950/50" />

      <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto flex h-full max-w-[1680px] flex-col justify-end px-5 pb-12 md:px-10 md:pb-16">
        <motion.p className="hud text-bone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}>
          {d.country} · {formatCoordinates(d.lat, d.lng)}
          {localTime && <> · {localTime} local</>}
        </motion.p>
        <h1 className="mt-4 text-[clamp(4rem,15vw,15rem)] font-semibold uppercase leading-[0.82] tracking-[-0.05em]" aria-label={d.name}>
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="inline-block"
              initial={reduce ? false : { opacity: 0, y: "40%", filter: "blur(12px)" }}
              animate={{ opacity: 1, y: "0%", filter: "blur(0px)" }}
              transition={{ delay: 0.35 + i * 0.05, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </h1>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <p className="mt-6 max-w-xl font-serif text-2xl italic leading-snug text-bone md:text-3xl">{d.tagline}</p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div className="flex items-center gap-2.5">
              <CalendarRange className="size-4 text-sand" aria-hidden />
              <dt className="sr-only">Ideal trip</dt>
              <dd>
                {d.idealDays[0]}–{d.idealDays[1]} days
              </dd>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 text-sand" aria-hidden />
              <dt className="sr-only">Best time</dt>
              <dd>Best {d.bestTime}</dd>
            </div>
            <div className="flex items-center gap-2.5">
              <TransportIcon className="size-4 text-sand" aria-hidden />
              <dt className="sr-only">Travel time</dt>
              <dd>
                {formatDuration(d.transport.durationHours)} from {d.transport.fromName} <span className="text-mist">est.</span>
              </dd>
            </div>
            <div className="flex items-center gap-2.5">
              <Wallet className="size-4 text-sand" aria-hidden />
              <dt className="sr-only">Budget per person</dt>
              <dd className="flex items-center gap-2">
                {formatINRCompact(d.budget.min)}–{formatINRCompact(d.budget.max)} pp <EstimateTag />
              </dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={`/plan?destination=${d.slug}`} size="lg" arrow magnetic>
              Build a Trip
            </ButtonLink>
            <ButtonLink href="#experiences" size="lg" variant="ghost">
              See the experiences
            </ButtonLink>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/** A destination as a place to step into: arrival, landmarks, moments, stays — and the next world. */
export function DestinationExperience({ destination: d, points, experiences, dining, stays, next }: DestinationExperienceProps) {
  return (
    <>
      <Hero d={d} />

      <section aria-label={`About ${d.name}`} className="py-28 md:py-36">
        <div className="mx-auto grid max-w-[1680px] gap-12 px-5 md:px-10 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="eyebrow">The place</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {d.categories.map((c) => (
                <span key={c} className="hud rounded-full border border-line-strong px-3 py-1.5 text-bone-dim">
                  {CATEGORY_LABEL[c]}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[clamp(1.5rem,2.6vw,2.4rem)] font-light leading-snug tracking-[-0.02em] text-bone">{d.description}</p>
          </Reveal>
        </div>
      </section>

      <section aria-label="Points of interest" className="pb-28 md:pb-40">
        <div className="mx-auto max-w-[1680px] px-5 md:px-10">
          <SectionHeading eyebrow="Points of interest" title={`Where ${d.name} lives.`} />
          <div className="mt-12">
            <PointsOfInterest points={points} scene={d.scene} name={d.name} />
          </div>
        </div>
      </section>

      <section id="experiences" aria-label="Best experiences" className="scroll-mt-20 pb-28 md:pb-40">
        <div className="mx-auto max-w-[1680px] px-5 md:px-10">
          <SectionHeading eyebrow="Best experiences" title="Moments worth the journey." />
        </div>
        {experiences.length ? (
          <div className="scrollbar-none mt-12 flex snap-x snap-mandatory scroll-pl-5 gap-6 overflow-x-auto px-5 pb-10 md:scroll-pl-10 md:px-10">
            {experiences.map((e, i) => {
              const Icon = STOP_ICON[e.kind];
              return (
                <Reveal key={e.id} delay={Math.min(i, 4) * 0.06} className={cn("w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[26vw]", i % 2 === 1 && "md:mt-16")}>
                  <DestinationScene scene={d.scene} sceneId={stageFor(e.kind, d.scene.kind)} time={SLOT_TIME[e.slot]} parallax className="aspect-[4/5] w-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent" />
                    <span className="hud absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-ink-950/50 px-2.5 py-1 backdrop-blur-sm">
                      <Icon className="size-3 text-sand" aria-hidden /> {e.slot === "full-day" ? "Full day" : e.slot}
                    </span>
                  </DestinationScene>
                  <p className="hud mt-5 text-mist">
                    {pad2(i + 1)} · {formatDuration(e.durationHours)} · {e.location}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.02em]">{e.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-bone-dim">{e.description}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    {e.costPerPerson ? <span className="tabular-nums">{formatINR(e.costPerPerson)} pp</span> : <span>Free</span>}
                    <EstimateTag />
                  </p>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <p className="mx-auto mt-10 max-w-[1680px] px-5 text-bone-dim md:px-10">Experiences for {d.name} are being mapped. Check back soon.</p>
        )}
      </section>

      <section aria-label="Stays" className="pb-28 md:pb-40">
        <div className="mx-auto max-w-[1680px] px-5 md:px-10">
          <SectionHeading eyebrow="Stays · concept properties" title="Where you'll wake up." />
          <ul className="mt-12 grid gap-px border border-line bg-line md:grid-cols-3">
            {stays.map((s) => (
              <li key={s.id} className="flex flex-col bg-ink-950 p-7">
                <p className="hud text-sand">{TIER_LABEL[s.tier]}</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.02em]">{s.name}</p>
                <p className="mt-1 text-sm text-mist">{s.area}</p>
                <p className="mt-4 text-sm leading-relaxed text-bone-dim">{s.description}</p>
                <ul className="mt-4 space-y-1 text-sm text-bone-dim">
                  {s.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2">
                      <span aria-hidden className="size-1 rounded-full bg-sand" /> {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                  <p className="flex items-center gap-2 text-sm">
                    <BedDouble className="size-4 text-mist" aria-hidden />
                    {formatINR(s.nightlyEstimate)} / night
                    <EstimateTag label="Example price" />
                  </p>
                  {s.explorable && (
                    <Link href="/stays" className="flex items-center gap-1 text-sm text-sand hover:underline">
                      Walk it <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {dining.length > 0 && (
            <div className="mt-16">
              <p className="eyebrow">Where to eat</p>
              <ul className="mt-6 grid gap-6 md:grid-cols-3">
                {dining.map((x) => (
                  <li key={x.id}>
                    <p className="font-medium">{x.name}</p>
                    <p className="text-sm text-mist">
                      {x.cuisine} · {x.location}
                    </p>
                    <p className="mt-2 text-sm text-bone-dim">{x.description}</p>
                    <p className="mt-2 text-sm tabular-nums text-bone-dim">~{formatINR(x.costPerPerson)} pp · estimated</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section aria-label={`Build a ${d.name} trip`} className="border-y border-line">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-5 py-20 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="eyebrow">Your journey starts here</p>
            <p className="mt-4 text-title font-semibold">Build a {d.name} trip in seconds.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/plan?destination=${d.slug}`} size="lg" arrow magnetic>
              Build a Trip
            </ButtonLink>
            <ButtonLink href="/explore" size="lg" variant="ghost">
              Keep exploring
            </ButtonLink>
          </div>
        </div>
      </section>

      <TransitionLink
        href={`/destinations/${next.slug}`}
        label={next.name}
        detail={formatCoordinates(next.lat, next.lng)}
        accent={next.scene.palette.accent}
        className="group block"
        aria-label={`Next destination: ${next.name}`}
      >
        <DestinationScene scene={next.scene} parallax className="h-[46vh] min-h-[320px]">
          <div className="absolute inset-0 bg-ink-950/45 transition-colors duration-700 group-hover:bg-ink-950/25" />
          <div className="absolute inset-0 mx-auto flex max-w-[1680px] items-end justify-between px-5 pb-10 md:px-10">
            <div>
              <p className="hud text-bone-dim">Next world</p>
              <p className="mt-2 text-[clamp(3rem,8vw,7rem)] font-semibold uppercase leading-[0.85] tracking-[-0.045em]">{next.name}</p>
            </div>
            <span className="glass grid size-14 place-items-center rounded-full transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1">
              <ArrowUpRight className="size-5" aria-hidden />
            </span>
          </div>
        </DestinationScene>
      </TransitionLink>
    </>
  );
}
