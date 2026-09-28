"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { Globe } from "@/components/3d/Globe";
import type { GlobeCommand } from "@/components/3d/globeTypes";
import { DestinationPreview } from "@/components/destination/DestinationPreview";
import { useJourneyTransition } from "@/components/providers/TransitionProvider";
import { useTrip } from "@/components/providers/TripProvider";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ButtonLink } from "@/components/ui/Button";
import { DEFAULT_DEPARTURE_ID, departureCities } from "@/data/cities";
import { useCanHover, useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { formatCoordinates } from "@/lib/format";
import type { DestinationSummary } from "@/lib/summaries";

export function Hero({ destinations }: { destinations: DestinationSummary[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [command, setCommand] = useState<GlobeCommand | null>(null);
  const nonce = useRef(0);
  const focusTimer = useRef<number | null>(null);
  const canHover = useCanHover();
  const isXl = useMediaQuery("(min-width: 1280px)");
  const reduced = usePrefersReducedMotion();
  const { enter, active: transitioning } = useJourneyTransition();
  const { lastRequest } = useTrip();

  const origin = useMemo(() => {
    const city = departureCities.find((c) => c.id === (lastRequest?.departureCityId ?? DEFAULT_DEPARTURE_ID)) ?? departureCities[0];
    return { name: city.name, lat: city.coordinates.lat, lng: city.coordinates.lng };
  }, [lastRequest?.departureCityId]);

  const markers = useMemo(() => destinations.map((d) => ({ id: d.id, name: d.name, subtitle: d.country, lat: d.lat, lng: d.lng })), [destinations]);
  const byId = (id: string | null) => destinations.find((d) => d.id === id) ?? null;
  const preview = byId(hovered);
  const sheetDestination = byId(selected);

  const focus = (id: string) => setCommand({ type: "focus", id, nonce: ++nonce.current });

  const enterDestination = (id: string) => {
    const d = byId(id);
    if (!d || transitioning) return;
    setSelected(null);
    setCommand({ type: "enter", id, nonce: ++nonce.current });
    enter({
      href: `/destinations/${d.slug}`,
      label: d.name,
      eyebrow: "Entering",
      detail: formatCoordinates(d.lat, d.lng),
      accent: d.scene.palette.accent,
      delay: reduced ? 0 : 950,
    });
  };

  const onGlobeSelect = (id: string) => {
    if (canHover) enterDestination(id);
    else {
      setSelected(id);
      focus(id);
    }
  };

  // Hovering the list turns the globe toward that place (debounced so skimming is calm).
  const onListHover = (id: string | null) => {
    setHovered(id);
    if (focusTimer.current) window.clearTimeout(focusTimer.current);
    if (id) focusTimer.current = window.setTimeout(() => focus(id), 180);
  };

  return (
    <section aria-label="Explore the world" className="relative h-[100svh] min-h-[660px] overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(55%_60%_at_68%_48%,rgba(38,78,120,0.35),transparent_70%),radial-gradient(40%_40%_at_20%_100%,rgba(217,186,140,0.08),transparent_70%)]"
      />

      <Globe
        className="absolute inset-x-0 top-[7svh] h-[56svh] md:inset-0 md:h-full"
        markers={markers}
        hoveredId={hovered}
        activeId={selected}
        onHover={setHovered}
        onSelect={onGlobeSelect}
        command={command}
        origin={origin}
        initialView={{ lat: 16, lng: 68 }}
        offsetX={0.1}
        labelInsetRight={isXl ? 270 : 0}
        label="Interactive 3D globe with destination hotspots"
      />

      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-ink-950/85 via-ink-950/30 to-transparent md:block" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent md:h-1/3" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[24%] bg-gradient-to-l from-ink-950/80 via-ink-950/40 to-transparent xl:block" />

      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1680px] flex-col justify-end px-5 pb-8 md:px-10 md:pb-14">
        <div className="pointer-events-auto max-w-[64rem]">
          <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}>
            Explore before you book
          </motion.p>
          <h1 className="mt-5 text-display font-semibold uppercase">
            <AnimatedText as="span" text="The world" immediate delay={0.25} className="block" />
            <AnimatedText as="span" text="is waiting." immediate delay={0.4} className="block" />
          </h1>
          <motion.p
            className="mt-6 max-w-md text-base leading-relaxed text-bone-dim md:text-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            Explore destinations. Build journeys. Experience your trip before you book it.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <ButtonLink href="/explore" size="lg" arrow magnetic>
              Start Exploring
            </ButtonLink>
            <ButtonLink href="/plan" size="lg" variant="ghost">
              Build My Trip
            </ButtonLink>
          </motion.div>
        </div>

        {/* Mobile: swipe through destinations. */}
        <div className="pointer-events-auto -mx-5 mt-7 md:hidden">
          <ul className="scrollbar-none mask-fade-x flex snap-x gap-2 overflow-x-auto px-5 pb-1" aria-label="Destinations">
            {destinations.map((d) => (
              <li key={d.id} className="snap-start">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(d.id);
                    focus(d.id);
                  }}
                  className={cn(
                    "hud whitespace-nowrap rounded-full border px-3.5 py-2.5 transition-colors",
                    selected === d.id ? "border-bone bg-bone text-ink-950" : "border-line-strong text-bone-dim",
                  )}
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Desktop: destination index doubles as the accessible alternative to the 3D hotspots. */}
      <nav aria-label="Destinations on the globe" className="absolute right-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span className="text-sand">{String(destinations.length).padStart(2, "0")}</span> Destinations
        </p>
        <ul className="space-y-0.5" onMouseLeave={() => onListHover(null)}>
          {destinations.map((d, i) => (
            <li key={d.id}>
              <button
                type="button"
                onMouseEnter={() => onListHover(d.id)}
                onFocus={() => onListHover(d.id)}
                onBlur={() => setHovered(null)}
                onClick={() => enterDestination(d.id)}
                className={cn(
                  "group flex w-48 items-baseline gap-3 rounded-sm py-1 text-left transition-colors",
                  hovered === d.id ? "text-bone" : "text-bone-dim hover:text-bone",
                )}
              >
                <span className="hud w-5 text-mist">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm">{d.name}</span>
                <span
                  aria-hidden
                  className={cn("ml-auto h-px bg-sand transition-all duration-500", hovered === d.id ? "w-8 opacity-100" : "w-0 opacity-0")}
                />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop hover preview. */}
      <AnimatePresence>
        {preview && canHover && (
          <motion.aside
            key={preview.id}
            aria-live="polite"
            className="glass absolute bottom-14 right-10 z-20 hidden w-[22rem] overflow-hidden rounded-[2px] p-5 md:block xl:right-72"
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHovered(preview.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <DestinationPreview destination={preview} onEnter={() => enterDestination(preview.id)} />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
        <p className="hud text-mist">Drag to rotate · Pinch or ⌘/Ctrl + scroll to zoom</p>
        <span aria-hidden className="relative h-10 w-px overflow-hidden bg-line">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_2.2s_ease-in-out_infinite] bg-sand" />
        </span>
      </div>

      <BottomSheet open={!!sheetDestination} onClose={() => setSelected(null)} label={sheetDestination ? `${sheetDestination.name} details` : "Destination"}>
        {sheetDestination && <DestinationPreview destination={sheetDestination} onEnter={() => enterDestination(sheetDestination.id)} />}
      </BottomSheet>
    </section>
  );
}
