"use client";

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { formatCoordinates, formatINRCompact, pad2 } from "@/lib/format";
import { CATEGORY_LABEL, type DestinationSummary } from "@/lib/summaries";
import { DestinationScene } from "./DestinationScene";

function Panel({ d, index, total }: { d: DestinationSummary; index: number; total: number }) {
  return (
    <TransitionLink
      href={`/destinations/${d.slug}`}
      label={d.name}
      detail={formatCoordinates(d.lat, d.lng)}
      accent={d.scene.palette.accent}
      className="group relative block w-[82vw] shrink-0 snap-center outline-none sm:w-[60vw] md:w-[40vw] lg:w-[34vw] xl:w-[30vw]"
      aria-label={`${d.name}, ${d.country}. ${d.tagline}`}
    >
      <div className="flex items-center justify-between pb-4">
        <span className="hud text-mist">
          {pad2(index + 1)} / {pad2(total)}
        </span>
        <span className="hud text-mist">{formatCoordinates(d.lat, d.lng)}</span>
      </div>
      <DestinationScene scene={d.scene} parallax className="aspect-[4/5] w-full md:aspect-auto md:h-[54vh] transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[0.985] group-focus-visible:ring-2 group-focus-visible:ring-sand">
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
        <div className="absolute left-5 top-5 flex flex-wrap gap-1.5">
          {d.categories.slice(0, 3).map((c) => (
            <span key={c} className="hud rounded-full bg-ink-950/45 px-2.5 py-1 text-bone backdrop-blur-sm">
              {CATEGORY_LABEL[c]}
            </span>
          ))}
        </div>
        <span className="glass absolute right-5 top-5 grid size-10 place-items-center rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </DestinationScene>
      {/* The name overlaps the frame edge — type in front of image for depth. */}
      <div className="relative -mt-14 px-5 md:-mt-[4.5rem]">
        <p className="text-[clamp(2.75rem,5vw,5.25rem)] font-semibold leading-[0.9] tracking-[-0.045em] drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)]">{d.name}</p>
      </div>
      <div className="mt-4 px-5">
        <p className="max-w-sm text-sm leading-relaxed text-bone-dim">{d.tagline}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span>
            {d.idealDays[0]}–{d.idealDays[1]} days
          </span>
          <span aria-hidden className="h-3 w-px bg-line-strong" />
          <span>
            {formatINRCompact(d.budget.min)}–{formatINRCompact(d.budget.max)} <span className="text-mist">pp</span>
          </span>
          <EstimateTag />
        </div>
      </div>
    </TransitionLink>
  );
}

/**
 * Interactive destination discovery. Desktop: the section pins and vertical
 * scroll drives a horizontal pan across destinations. Mobile / reduced motion:
 * a native swipe carousel with snap points.
 */
export function DestinationRail({ destinations }: { destinations: DestinationSummary[] }) {
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const pinned = !isMobile && !reduced;
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!pinned) return;
    const measure = () => {
      const el = track.current;
      if (el) setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const x = useTransform(smooth, (v) => -v * distance);
  const bar = useTransform(smooth, [0, 1], ["0%", "100%"]);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(destinations.length - 1, Math.round(v * (destinations.length - 1)))));

  const heading = (
    <SectionHeading
      index="02"
      eyebrow="Destination discovery"
      title="Where will you wake up?"
      lede="Twelve places, each rendered as a world of its own. Scroll to travel — select one to step inside."
    />
  );

  if (!pinned) {
    return (
      <section ref={section} aria-label="Destinations" className="py-24">
        <div className="px-5">{heading}</div>
        <div className="scrollbar-none mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6">
          {destinations.map((d, i) => (
            <Panel key={d.id} d={d} index={i} total={destinations.length} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={section} aria-label="Destinations" style={{ height: `calc(100vh + ${distance}px)` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div ref={track} style={{ x }} className="flex items-end gap-10 pl-10 pr-[12vw] will-change-transform">
          <div className="flex w-[34vw] shrink-0 flex-col justify-between self-stretch py-4 pr-8">
            {heading}
            <div className="mt-10">
              <p className="hud mb-3 text-mist" aria-live="polite">
                {pad2(active + 1)} — {destinations[active]?.name}
              </p>
              <div className="h-px w-56 bg-line">
                <motion.div className="h-px bg-sand" style={{ width: bar }} />
              </div>
            </div>
          </div>
          {destinations.map((d, i) => (
            <div key={d.id} className={cn("transition-opacity duration-700", Math.abs(i - active) > 3 && "opacity-60")}>
              <Panel d={d} index={i} total={destinations.length} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
