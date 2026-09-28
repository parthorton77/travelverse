"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Footprints, Moon, Pause, Sun, Sunset } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { WebGLErrorBoundary } from "@/components/3d/WebGLErrorBoundary";
import { Button } from "@/components/ui/Button";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { OrbitLoader } from "@/components/ui/Loader";
import { useInViewport } from "@/hooks/useInViewport";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useWheelGuard } from "@/hooks/useWheelGuard";
import { cn } from "@/lib/cn";
import { formatINR, pad2 } from "@/lib/format";
import type { SceneConfig, Stay, StaySpaceId } from "@/lib/types";
import { BookingDialog } from "./BookingDialog";
import { HotelFallback } from "./HotelFallback";
import { STAY_TIMES, type StayTime } from "./stayTimes";

const HotelScene = dynamic(() => import("./HotelScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <OrbitLoader label="Entering the stay…" />
    </div>
  ),
});

const TIME_ICON = { morning: Sun, sunset: Sunset, night: Moon } as const;
const TOUR_MS = 5200;

interface HotelExplorerProps {
  stay: Stay;
  /** Destination scene, used by the 2D fallback. */
  scene: SceneConfig;
  variant?: "section" | "page";
}

/**
 * Walk Before You Book — the Immersive Stay Engine. Move between the spaces of
 * a property, change the hour, and see what you're booking before you book it.
 */
export function HotelExplorer({ stay, scene, variant = "section" }: HotelExplorerProps) {
  const spaces = useMemo(() => stay.spaces ?? [], [stay.spaces]);
  const [spaceId, setSpaceId] = useState<StaySpaceId>(spaces[0]?.id ?? "surroundings");
  const [time, setTime] = useState<StayTime>("sunset");
  const [touring, setTouring] = useState(false);
  const [booking, setBooking] = useState(false);
  const [failed, setFailed] = useState(false);
  const webgl = useWebGLSupport();
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const near = useInViewport(frame, { rootMargin: "400px", once: true });
  const visible = useInViewport(frame, { rootMargin: "50px" });
  useWheelGuard(frame);

  const space = spaces.find((s) => s.id === spaceId) ?? spaces[0];
  const index = spaces.findIndex((s) => s.id === spaceId);

  useEffect(() => {
    if (!touring || !visible) return;
    const id = window.setTimeout(() => setSpaceId(spaces[(index + 1) % spaces.length].id), TOUR_MS);
    return () => window.clearTimeout(id);
  }, [touring, visible, index, spaces]);

  if (!space) {
    return <p className="border border-line p-10 text-center text-bone-dim">This stay doesn&apos;t have a walkable environment yet.</p>;
  }

  const use3D = webgl === "supported" && !failed;
  const choose = (id: StaySpaceId) => {
    setTouring(false);
    setSpaceId(id);
  };

  const timeSwitch = (
    <div role="radiogroup" aria-label="Time of day" className="glass flex rounded-full p-1">
      {(Object.keys(STAY_TIMES) as StayTime[]).map((t) => {
        const Icon = TIME_ICON[t];
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={time === t}
            onClick={() => setTime(t)}
            className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors", time === t ? "bg-bone text-ink-950" : "text-bone-dim hover:text-bone")}
          >
            <Icon className="size-3.5" aria-hidden />
            {STAY_TIMES[t].label}
          </button>
        );
      })}
    </div>
  );

  const spaceTabs = (
    <div role="tablist" aria-label="Spaces" className="scrollbar-none flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {spaces.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={s.id === spaceId}
          onClick={() => choose(s.id)}
          className={cn(
            "group flex shrink-0 items-center gap-3 rounded-full px-3 py-2 text-left text-sm transition-colors md:rounded-none md:px-0 md:py-1.5",
            s.id === spaceId ? "bg-bone text-ink-950 md:bg-transparent md:text-bone" : "text-bone-dim hover:text-bone",
          )}
        >
          <span className={cn("hud hidden w-5 md:inline", s.id === spaceId ? "text-sand" : "text-mist")}>{pad2(i + 1)}</span>
          <span className={cn("hidden h-px bg-sand transition-all duration-500 md:block", s.id === spaceId ? "w-8" : "w-0")} aria-hidden />
          {s.name}
        </button>
      ))}
    </div>
  );

  const info = (
    <AnimatePresence mode="wait">
      <motion.div
        key={space.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="hud text-sand">{space.caption}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{space.name}</p>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">{space.description}</p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {space.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span aria-hidden className="size-1 rounded-full bg-sand" />
              {f}
            </li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  );

  const actions = (
    <div className="mt-6 border-t border-line pt-5">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        From <span className="font-semibold tabular-nums">{formatINR(stay.nightlyEstimate)}</span> / night <EstimateTag label="Example price" />
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="md" onClick={() => setTouring((t) => !t)} aria-pressed={touring}>
          {touring ? <Pause className="size-4" aria-hidden /> : <Footprints className="size-4" aria-hidden />}
          {touring ? "Pause tour" : "Explore the Stay"}
        </Button>
        <Button size="md" variant="ghost" onClick={() => setBooking(true)}>
          Book This Experience
        </Button>
      </div>
    </div>
  );

  const height = variant === "page" ? "h-[62svh] md:h-[calc(100svh-4.5rem)]" : "h-[60svh] md:h-[88vh]";

  return (
    <div>
      <div ref={frame} className={cn("globe-surface relative overflow-hidden border-y border-line bg-ink-900 md:min-h-[620px]", height)}>
        {use3D ? (
          near && (
            <WebGLErrorBoundary onError={() => setFailed(true)}>
              <HotelScene
                space={space}
                time={time}
                quality={isMobile ? "low" : "high"}
                paused={!visible}
                reducedMotion={reduced}
                onUserMove={() => setTouring(false)}
                onContextLost={() => setFailed(true)}
              />
            </WebGLErrorBoundary>
          )
        ) : webgl === "checking" ? (
          <div className="absolute inset-0 grid place-items-center">
            <OrbitLoader label="Entering the stay…" />
          </div>
        ) : (
          <HotelFallback scene={scene} space={space.id} time={time} />
        )}

        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/70 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink-950/80 to-transparent md:h-72" />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="pointer-events-auto">
              <p className="hud text-bone-dim">Concept property · {stay.area}</p>
              <p className="mt-2 font-serif text-4xl italic md:text-6xl">{stay.name}</p>
            </div>
            <div className="pointer-events-auto hidden md:block">{timeSwitch}</div>
          </div>

          <div className="hidden items-end justify-between gap-8 md:flex">
            <div className="pointer-events-auto">{spaceTabs}</div>
            <div className="glass pointer-events-auto w-[24rem] p-6">
              {info}
              {actions}
            </div>
          </div>
        </div>

        <p className="hud pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-mist md:block">
          {use3D ? "Drag to look around · ⌘/Ctrl + scroll to move closer" : "Illustrated preview · 3D needs WebGL"}
        </p>
      </div>

      {/* Mobile: controls and details below the view, never covering it. */}
      <div className="px-5 pt-5 md:hidden">
        <div className="flex items-center justify-between gap-3">{timeSwitch}</div>
        <div className="-mx-5 mt-4 px-5">{spaceTabs}</div>
        <div className="mt-6">
          {info}
          {actions}
        </div>
      </div>

      {variant === "section" && (
        <div className="mx-auto mt-6 hidden max-w-[1680px] justify-end px-10 md:flex">
          <Link href="/stays" className="text-sm text-bone-dim underline-offset-4 hover:text-bone hover:underline">
            Open the full-screen stay →
          </Link>
        </div>
      )}

      <BookingDialog open={booking} onClose={() => setBooking(false)} stay={stay} space={space} />
    </div>
  );
}
