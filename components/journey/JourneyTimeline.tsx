"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useInViewport } from "@/hooks/useInViewport";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { formatINR, pad2 } from "@/lib/format";
import type { GeneratedTrip, SceneConfig } from "@/lib/types";
import { JourneyStage } from "./JourneyStage";
import { STOP_ICON } from "./stopMeta";

const AUTOPLAY_MS = 3800;

interface JourneyTimelineProps {
  trip: GeneratedTrip;
  scene: SceneConfig;
  /** Start playing automatically when the timeline scrolls into view. */
  autoplay?: boolean;
}

/**
 * Interactive Journey Simulator: navigate a trip like a game world. Desktop is
 * a horizontal track under a cinematic stage; mobile is a vertical timeline
 * with expandable stops.
 */
export function JourneyTimeline({ trip, scene, autoplay = true }: JourneyTimelineProps) {
  const isMobile = useIsMobile();
  const reduce = usePrefersReducedMotion();
  const stops = trip.journey;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [playing, setPlaying] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInViewport(container, { rootMargin: "-20% 0px" });
  const startedFor = useRef<string | null>(null);

  // New trip → rewind to the start.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIndex(0);
      setDirection(1);
    });
    return () => cancelAnimationFrame(id);
  }, [trip.id]);

  // Autoplay once per trip when first seen (never with reduced motion).
  useEffect(() => {
    if (!autoplay || reduce || isMobile || !inView || startedFor.current === trip.id) return;
    startedFor.current = trip.id;
    const id = requestAnimationFrame(() => setPlaying(true));
    return () => cancelAnimationFrame(id);
  }, [autoplay, reduce, isMobile, inView, trip.id]);

  const go = useCallback(
    (next: number, fromUser = true) => {
      const clamped = Math.max(0, Math.min(stops.length - 1, next));
      setDirection(clamped >= index ? 1 : -1);
      setIndex(clamped);
      if (fromUser) setPlaying(false);
    },
    [index, stops.length],
  );

  useEffect(() => {
    if (!playing || !inView) return;
    const id = window.setTimeout(() => {
      if (index >= stops.length - 1) setPlaying(false);
      else go(index + 1, false);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [playing, inView, index, stops.length, go]);

  // Keep the active node in view on the horizontal track.
  useEffect(() => {
    const node = nodes.current[index];
    const t = track.current;
    if (!node || !t) return;
    const left = node.offsetLeft - t.clientWidth / 2 + node.clientWidth / 2;
    t.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, [index, reduce]);

  const onTrackKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: stops.length - 1 };
    if (e.key in map) {
      e.preventDefault();
      go(map[e.key]);
      requestAnimationFrame(() => nodes.current[Math.max(0, Math.min(stops.length - 1, map[e.key]))]?.focus());
    }
  };

  if (!stops.length) {
    return <p className="border border-line p-10 text-center text-bone-dim">This journey has no stops yet. Compose one above.</p>;
  }

  const stop = stops[index];
  const progress = stops.length > 1 ? index / (stops.length - 1) : 1;

  if (isMobile) {
    return <MobileJourney trip={trip} scene={scene} />;
  }

  return (
    <div ref={container} className="relative">
      <div role="tabpanel" id="journey-stage" aria-live="polite" aria-label={`Stop ${index + 1} of ${stops.length}: ${stop.title}`}>
        <JourneyStage stop={stop} index={index} total={stops.length} direction={direction} scene={scene} className="h-[68vh] min-h-[480px] border border-line" />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex shrink-0 gap-1.5">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous stop" className="grid size-11 place-items-center rounded-full border border-line-strong text-bone-dim transition-colors hover:text-bone disabled:opacity-30">
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (index >= stops.length - 1) go(0, false);
              setPlaying((p) => !p);
            }}
            aria-label={playing ? "Pause journey" : "Play journey"}
            className="grid size-11 place-items-center rounded-full bg-bone text-ink-950 transition-transform hover:scale-105"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
          </button>
          <button type="button" onClick={() => go(index + 1)} disabled={index === stops.length - 1} aria-label="Next stop" className="grid size-11 place-items-center rounded-full border border-line-strong text-bone-dim transition-colors hover:text-bone disabled:opacity-30">
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div ref={track} className="scrollbar-none relative min-w-0 flex-1 overflow-x-auto">
          <div role="tablist" aria-label="Journey stops" className="relative flex min-w-max items-start px-4 pb-2 pt-9" onKeyDown={onTrackKey}>
            {/* rail + progress */}
            <div aria-hidden className="absolute left-4 right-4 top-[2.95rem] h-px bg-line-strong" />
            <motion.div
              aria-hidden
              className="absolute left-4 top-[2.95rem] h-px origin-left bg-sand"
              style={{ right: "1rem" }}
              animate={{ scaleX: progress }}
              transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
            {stops.map((s, i) => {
              const Icon = STOP_ICON[s.kind];
              const active = i === index;
              const passed = i < index;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    nodes.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="journey-stage"
                  tabIndex={active ? 0 : -1}
                  onClick={() => go(i)}
                  className="group relative flex w-[7.5rem] shrink-0 flex-col items-center gap-3 rounded-sm text-center outline-none focus-visible:ring-1 focus-visible:ring-sand/60"
                >
                  <span className={cn("hud absolute -top-7 whitespace-nowrap transition-colors", active ? "text-sand" : "text-mist")}>Day {pad2(s.day)}</span>
                  <span
                    className={cn(
                      "relative z-10 grid size-7 place-items-center rounded-full border transition-all duration-500",
                      active ? "scale-110 border-sand bg-sand text-ink-950" : passed ? "border-sand/60 bg-ink-950 text-sand" : "border-line-strong bg-ink-950 text-mist group-hover:border-bone/50 group-hover:text-bone",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {active && !reduce && <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full border border-sand" />}
                  </span>
                  <span className={cn("font-mono text-[0.68rem] tracking-[0.18em] transition-colors", active ? "text-bone" : "text-bone-dim group-hover:text-bone")}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="hud mt-3 text-mist">Select a stop, or use ← → to travel</p>
    </div>
  );
}

function MobileJourney({ trip, scene }: { trip: GeneratedTrip; scene: SceneConfig }) {
  const [open, setOpen] = useState<string | null>(trip.journey[0]?.id ?? null);
  return (
    <ol className="relative" aria-label="Journey stops">
      <span aria-hidden className="absolute bottom-6 left-[15px] top-6 w-px bg-line-strong" />
      {trip.journey.map((s, i) => {
        const Icon = STOP_ICON[s.kind];
        const expanded = open === s.id;
        return (
          <li key={s.id} className="relative pl-12">
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-4 grid size-[31px] place-items-center rounded-full border bg-ink-950",
                expanded ? "border-sand text-sand" : "border-line-strong text-mist",
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : s.id)}
              className="flex w-full items-start justify-between gap-3 py-4 text-left"
            >
              <span>
                <span className="hud block text-mist">
                  {pad2(i + 1)} · Day {pad2(s.day)}
                </span>
                <span className="mt-1 block font-mono text-[0.72rem] tracking-[0.2em] text-sand">{s.label}</span>
                <span className="mt-1 block font-medium">{s.title}</span>
              </span>
              {s.cost ? <span className="mt-6 shrink-0 font-mono text-xs text-mist">{formatINR(s.cost)}</span> : null}
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <JourneyStage stop={s} index={i} total={trip.journey.length} direction={1} scene={scene} compact className="aspect-[16/10] w-full" />
                  <p className="pb-6 pt-4 text-sm leading-relaxed text-bone-dim">{s.description}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
