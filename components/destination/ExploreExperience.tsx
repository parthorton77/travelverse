"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Globe } from "@/components/3d/Globe";
import type { GlobeCommand } from "@/components/3d/globeTypes";
import { useJourneyTransition } from "@/components/providers/TransitionProvider";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { DEFAULT_DEPARTURE_ID, departureCities } from "@/data/cities";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { formatCoordinates, formatDuration, formatINRCompact, pad2 } from "@/lib/format";
import { CATEGORY_LABEL, type DestinationSummary } from "@/lib/summaries";
import { DESTINATION_CATEGORIES, type DestinationCategory } from "@/lib/types";
import { DestinationPreview } from "./DestinationPreview";
import { DestinationScene } from "./DestinationScene";

type Filter = DestinationCategory | "all";

function Panel({ d, index, onEnter, onHover, registerRef }: { d: DestinationSummary; index: number; onEnter: () => void; onHover: (on: boolean) => void; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <motion.article
      ref={registerRef}
      data-id={d.id}
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="group min-h-[82vh] py-10"
      aria-labelledby={`explore-${d.id}`}
    >
      <p className="hud flex items-center justify-between text-mist">
        <span>{pad2(index + 1)}</span>
        <span>{formatCoordinates(d.lat, d.lng)}</span>
      </p>
      <DestinationScene scene={d.scene} parallax className="mt-4 aspect-[16/11] w-full border border-line">
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
        <div className="absolute left-5 top-5 flex flex-wrap gap-1.5">
          {d.categories.map((c) => (
            <span key={c} className="hud rounded-full bg-ink-950/45 px-2.5 py-1 backdrop-blur-sm">
              {CATEGORY_LABEL[c]}
            </span>
          ))}
        </div>
      </DestinationScene>
      <h2 id={`explore-${d.id}`} className="-mt-12 px-5 text-[clamp(3rem,6vw,6rem)] font-semibold uppercase leading-[0.86] tracking-[-0.045em] drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        {d.name}
      </h2>
      <div className="mt-5 grid gap-6 px-5 sm:grid-cols-[1.4fr_1fr]">
        <p className="leading-relaxed text-bone-dim">{d.description}</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3 border-b border-line pb-2">
            <dt className="text-mist">Ideal</dt>
            <dd>
              {d.idealDays[0]}–{d.idealDays[1]} days
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-line pb-2">
            <dt className="text-mist">Best time</dt>
            <dd>{d.bestTime}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-line pb-2">
            <dt className="text-mist">From {d.transport.fromName}</dt>
            <dd>{formatDuration(d.transport.durationHours)} est.</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-mist">Per person</dt>
            <dd className="whitespace-nowrap">
              {formatINRCompact(d.budget.min)}–{formatINRCompact(d.budget.max)}
            </dd>
          </div>
          <div className="flex justify-end pt-1">
            <EstimateTag />
          </div>
        </dl>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 px-5">
        <Button onClick={onEnter} arrow>
          Enter {d.name}
        </Button>
        <ButtonLink href={`/plan?destination=${d.slug}`} variant="ghost">
          Build a trip
        </ButtonLink>
      </div>
    </motion.article>
  );
}

/**
 * Immersive Destination Explorer. The globe is the map of the list: scrolling
 * a destination into view turns the planet toward it; categories dim what
 * doesn't match. Mobile swaps the scroll list for swipeable cards and a sheet.
 */
export function ExploreExperience({ destinations }: { destinations: DestinationSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [activeId, setActiveId] = useState<string | null>(destinations[0]?.id ?? null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [command, setCommand] = useState<GlobeCommand | null>(null);
  const nonce = useRef(0);
  const panels = useRef(new Map<string, HTMLElement>());
  const cards = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const { enter } = useJourneyTransition();

  const visible = useMemo(() => (filter === "all" ? destinations : destinations.filter((d) => d.categories.includes(filter))), [destinations, filter]);
  const visibleIds = useMemo(() => new Set(visible.map((d) => d.id)), [visible]);
  const markers = useMemo(
    () => destinations.map((d) => ({ id: d.id, name: d.name, subtitle: d.country, lat: d.lat, lng: d.lng, dimmed: !visibleIds.has(d.id) })),
    [destinations, visibleIds],
  );
  const origin = useMemo(() => {
    const c = departureCities.find((x) => x.id === DEFAULT_DEPARTURE_ID)!;
    return { name: c.name, lat: c.coordinates.lat, lng: c.coordinates.lng };
  }, []);

  const focus = (id: string) => setCommand({ type: "focus", id, nonce: ++nonce.current });

  // Desktop: the panel nearest the viewport centre drives the globe.
  useEffect(() => {
    if (isMobile) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = hit?.target.getAttribute("data-id");
        if (id) setActiveId((prev) => (prev === id ? prev : id));
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5] },
    );
    panels.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isMobile, visible]);

  // Mobile: the card nearest the centre of the swipe rail drives the globe.
  useEffect(() => {
    if (!isMobile) return;
    const el = cards.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const centre = el.scrollLeft + el.clientWidth / 2;
        let best: { id: string; d: number } | null = null;
        el.querySelectorAll<HTMLElement>("[data-card]").forEach((c) => {
          const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - centre);
          if (!best || d < best.d) best = { id: c.dataset.card!, d };
        });
        if (best) setActiveId((best as { id: string }).id);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [isMobile, visible]);

  useEffect(() => {
    if (!activeId) return;
    const id = requestAnimationFrame(() => setCommand({ type: "focus", id: activeId, nonce: ++nonce.current }));
    return () => cancelAnimationFrame(id);
  }, [activeId]);

  // Keep the active destination inside the current filter.
  useEffect(() => {
    if (activeId && visibleIds.has(activeId)) return;
    const first = visible[0]?.id ?? null;
    const id = requestAnimationFrame(() => setActiveId(first));
    return () => cancelAnimationFrame(id);
  }, [visible, visibleIds, activeId]);

  const enterDestination = (id: string) => {
    const d = destinations.find((x) => x.id === id);
    if (!d) return;
    setSheetId(null);
    setCommand({ type: "enter", id, nonce: ++nonce.current });
    enter({ href: `/destinations/${d.slug}`, label: d.name, detail: formatCoordinates(d.lat, d.lng), accent: d.scene.palette.accent, delay: reduced ? 0 : 900 });
  };

  const onGlobeSelect = (id: string) => {
    if (isMobile) {
      setSheetId(id);
      focus(id);
      return;
    }
    if (!visibleIds.has(id)) setFilter("all");
    requestAnimationFrame(() => panels.current.get(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }));
  };

  const filters = (
    <div role="radiogroup" aria-label="Filter destinations by category" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
      {(["all", ...DESTINATION_CATEGORIES] as Filter[]).map((f) => {
        const count = f === "all" ? destinations.length : destinations.filter((d) => d.categories.includes(f)).length;
        return (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "hud flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 transition-colors",
              filter === f ? "border-bone bg-bone text-ink-950" : "border-line-strong text-bone-dim hover:text-bone",
            )}
          >
            {f === "all" ? "All" : CATEGORY_LABEL[f]}
            <span className={filter === f ? "text-ink-950/50" : "text-mist"}>{count}</span>
          </button>
        );
      })}
    </div>
  );

  const sheetDest = destinations.find((d) => d.id === sheetId);

  return (
    <div className="pt-24 md:pt-28">
      <header className="mx-auto max-w-[1680px] px-5 md:px-10">
        <p className="eyebrow">Explore</p>
        <AnimatedText as="h1" text="Move through the world." immediate className="mt-5 text-headline font-semibold" />
        <p className="mt-5 max-w-lg text-bone-dim">Filter by what you want to feel. The globe turns to follow you — select any hotspot to jump to it.</p>
        <div className="mt-8">{filters}</div>
      </header>

      {isMobile ? (
        <div className="mt-6">
          <Globe
            className="relative h-[46svh]"
            markers={markers}
            activeId={activeId}
            hoveredId={hovered}
            onHover={setHovered}
            onSelect={onGlobeSelect}
            command={command}
            origin={origin}
            initialView={{ lat: 18, lng: 72 }}
            showControls={false}
          />
          <div ref={cards} className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-8 pt-2">
            {visible.map((d) => (
              <button key={d.id} type="button" data-card={d.id} onClick={() => setSheetId(d.id)} className="w-[78vw] shrink-0 snap-center text-left">
                <DestinationScene scene={d.scene} className={cn("aspect-[4/3] w-full border transition-colors", activeId === d.id ? "border-sand/60" : "border-line")} />
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{d.name}</p>
                <p className="text-sm text-bone-dim">{d.tagline}</p>
              </button>
            ))}
            {visible.length === 0 && <p className="py-10 text-bone-dim">Nothing here yet — try another category.</p>}
          </div>
          <BottomSheet open={!!sheetDest} onClose={() => setSheetId(null)} label={sheetDest ? `${sheetDest.name} details` : "Destination"}>
            {sheetDest && <DestinationPreview destination={sheetDest} onEnter={() => enterDestination(sheetDest.id)} />}
          </BottomSheet>
        </div>
      ) : (
        <div className="mx-auto mt-10 grid max-w-[1680px] grid-cols-[1.05fr_1fr] gap-10 px-10">
          <div className="sticky top-[4.5rem] h-[calc(100svh-4.5rem)]">
            <Globe
              className="absolute inset-0"
              markers={markers}
              activeId={activeId}
              hoveredId={hovered}
              onHover={setHovered}
              onSelect={onGlobeSelect}
              command={command}
              origin={origin}
              initialView={{ lat: 18, lng: 72 }}
            />
            <p className="hud pointer-events-none absolute bottom-6 left-0 text-mist" aria-live="polite">
              {activeId ? `Now viewing · ${destinations.find((d) => d.id === activeId)?.name}` : ""}
            </p>
          </div>
          <div>
            <AnimatePresence mode="popLayout">
              {visible.map((d, i) => (
                <Panel
                  key={d.id}
                  d={d}
                  index={i}
                  onEnter={() => enterDestination(d.id)}
                  onHover={(on) => setHovered(on ? d.id : null)}
                  registerRef={(el) => {
                    if (el) panels.current.set(d.id, el);
                    else panels.current.delete(d.id);
                  }}
                />
              ))}
            </AnimatePresence>
            {visible.length === 0 && <p className="py-20 text-bone-dim">Nothing here yet — try another category.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
