"use client";

import { motion } from "framer-motion";
import { ArrowRight, BedDouble, CalendarRange, Plane, RefreshCw, SlidersHorizontal, Sparkles, TrainFront, Utensils } from "lucide-react";
import Link from "next/link";
import { DestinationScene } from "@/components/destination/DestinationScene";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { ItineraryGrid } from "@/components/journey/ItineraryGrid";
import { formatDuration, pad2 } from "@/lib/format";
import type { DestinationSummary } from "@/lib/summaries";
import type { GeneratedTrip } from "@/lib/types";
import { BudgetBar } from "./BudgetBar";

function MatchRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-[72px] place-items-center" aria-label={`${value}% match`} role="img">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#d9ba8c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      <span className="font-mono text-sm">{value}%</span>
    </div>
  );
}

interface TripResultProps {
  trip: GeneratedTrip;
  destination?: DestinationSummary;
  journeyHref: string;
  onAdjust: () => void;
  onSwitch: (destinationId: string) => void;
}

/** The composed trip: identity, reasoning, budget, logistics and a compact day-by-day. */
export function TripResult({ trip, destination, journeyHref, onAdjust, onSwitch }: TripResultProps) {
  const TransportIcon = trip.transport.mode === "flight" ? Plane : TrainFront;
  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div aria-live="polite">
      {/* Identity */}
      <motion.div {...stagger(0)} className="relative overflow-hidden border border-line">
        {destination ? (
          <DestinationScene scene={destination.scene} priority drift className="h-[340px] md:h-[420px]">
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
          </DestinationScene>
        ) : (
          <div className="h-[340px] bg-ink-900 md:h-[420px]" />
        )}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-10">
          <div>
            <p className="hud flex items-center gap-2 text-sand">
              <Sparkles className="size-3.5" aria-hidden /> Composed by the TravelVerse engine
            </p>
            <p className="mt-4 font-mono text-5xl font-medium tracking-[-0.04em] md:text-7xl">
              {trip.days} DAYS
            </p>
            <h3 className="mt-1 text-[clamp(2rem,5vw,4.5rem)] font-semibold uppercase leading-[0.92] tracking-[-0.04em]">{trip.title}</h3>
          </div>
          <div className="flex items-center gap-4">
            <MatchRing value={trip.matchScore} />
            <div>
              <p className="hud text-mist">Match</p>
              <p className="text-sm text-bone-dim">
                {trip.travelerCount} {trip.travelerCount === 1 ? "traveller" : "travellers"} · {trip.nights} nights
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Logistics */}
      <motion.dl {...stagger(1)} className="grid grid-cols-1 border-x border-b border-line sm:grid-cols-3">
        {[
          {
            icon: TransportIcon,
            label: trip.transport.mode === "flight" ? "Flight" : "Train",
            value: `${trip.transport.from.airportCode} → ${trip.transport.toCode}`,
            sub: `${formatDuration(trip.transport.durationHours)} · ${trip.transport.stops ? `${trip.transport.stops} stop` : "direct"} · est.`,
          },
          { icon: BedDouble, label: "Stay", value: trip.stay.name, sub: `${trip.stay.tier[0].toUpperCase()}${trip.stay.tier.slice(1)} · ${trip.stay.area}` },
          { icon: CalendarRange, label: "Travel time", value: `${pad2(trip.days)} days · ${pad2(trip.nights)} nights`, sub: `From ${trip.transport.from.name}` },
        ].map((f, i) => (
          <div key={f.label} className={`flex gap-4 p-6 ${i > 0 ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}>
            <f.icon className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden />
            <div>
              <dt className="hud text-mist">{f.label}</dt>
              <dd className="mt-1.5 font-medium">{f.value}</dd>
              <dd className="mt-0.5 text-sm text-bone-dim">{f.sub}</dd>
            </div>
          </div>
        ))}
      </motion.dl>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Reasoning */}
        <motion.section {...stagger(2)} aria-label="Why this journey">
          <p className="eyebrow">Why this journey</p>
          <ol className="mt-6 space-y-5">
            {trip.reasoning.map((r, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-xs text-sand">{pad2(i + 1)}</span>
                <p className="leading-relaxed text-bone-dim">{r}</p>
              </li>
            ))}
          </ol>
          {trip.alternatives.length > 0 && (
            <div className="mt-10">
              <p className="eyebrow">Also worth a look</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {trip.alternatives.map((a) => (
                  <button
                    key={a.destinationId}
                    type="button"
                    onClick={() => onSwitch(a.destinationId)}
                    className="group flex items-center gap-3 rounded-full border border-line-strong px-4 py-2.5 text-sm transition-colors hover:border-bone/40"
                  >
                    <span className="font-medium">{a.name}</span>
                    <span className="font-mono text-xs text-sand">{a.matchScore}%</span>
                    <span className="text-bone-dim">{a.reason}</span>
                    <RefreshCw className="size-3.5 text-mist transition-transform duration-500 group-hover:rotate-180" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* Budget */}
        <motion.section {...stagger(3)} aria-label="Budget estimate" className="border border-line p-6 md:p-8">
          <BudgetBar budget={trip.budget} />
          {!trip.budget.withinBudget && (
            <p className="mt-5 border-l-2 border-sunset pl-4 text-sm text-bone-dim">
              This is over your budget even at its leanest. Try fewer days, more travellers sharing, or a destination closer to home.
            </p>
          )}
        </motion.section>
      </div>

      {/* Day by day */}
      <motion.section {...stagger(4)} aria-label="Day by day" className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="eyebrow">Day by day</p>
          <p className="hud text-mist">Times are suggestions · costs per group</p>
        </div>
        <div className="mt-6">
          <ItineraryGrid days={trip.itinerary} />
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-mist">
          <Utensils className="size-3.5" aria-hidden /> Dining is covered by the food estimate. <EstimateTag className="ml-1" />
        </p>
      </motion.section>

      <motion.div {...stagger(5)} className="mt-12 flex flex-wrap items-center gap-3">
        <ButtonLink href={journeyHref} size="lg" arrow magnetic>
          Play the journey
        </ButtonLink>
        <ButtonLink href="/stays" size="lg" variant="ghost">
          Walk the stay
        </ButtonLink>
        <Button variant="quiet" onClick={onAdjust} className="h-14 px-4">
          <SlidersHorizontal className="size-4" aria-hidden /> Adjust
        </Button>
        {destination && (
          <Link href={`/destinations/${destination.slug}`} className="ml-auto hidden items-center gap-2 text-sm text-bone-dim hover:text-bone md:flex">
            About {destination.name} <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </motion.div>
      <p className="mt-6 text-xs text-mist">{trip.disclaimer}</p>
    </div>
  );
}
