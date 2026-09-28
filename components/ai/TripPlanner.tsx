"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { ArrowRight, Banknote, Calendar, Dna, MapPin, PenLine, RotateCcw, Sparkles, Users } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTravelDna } from "@/components/providers/DnaProvider";
import { useTrip } from "@/components/providers/TripProvider";
import { Button } from "@/components/ui/Button";
import { DEFAULT_DEPARTURE_ID } from "@/data/cities";
import { describeTravelers, parseIntent } from "@/lib/ai/parseIntent";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import type { DestinationSummary } from "@/lib/summaries";
import type { City, Interest, IntentSignal, ParsedField, Travelers, TripRequest } from "@/lib/types";
import { PlannerControls, TRAVELER_PRESETS } from "./PlannerControls";
import { TripGeneration } from "./TripGeneration";
import { TripResult } from "./TripResult";

const EXAMPLES = [
  "I have ₹75,000 for 5 days. I'm travelling as a couple from Ahmedabad. I want beaches, adventure and a little luxury.",
  "A slow week of culture and food from Mumbai, around ₹2 lakh for the two of us.",
  "Family of 4 from Delhi, 6 days in the mountains, nature and adventure, ₹1.5 lakh.",
  "Weekend escape from Bengaluru, 40k, somewhere with hidden gems and good food.",
];

const SUGGESTIONS: { id: string; label: string }[] = [
  { id: "weekend", label: "Weekend escape" },
  { id: "luxury", label: "Luxury" },
  { id: "adventure", label: "Adventure" },
  { id: "food", label: "Food trip" },
  { id: "hidden-gems", label: "Hidden gems" },
  { id: "family", label: "Family" },
];

const SIGNAL_ICON: Record<ParsedField, typeof Banknote> = {
  budget: Banknote,
  days: Calendar,
  travelers: Users,
  departure: MapPin,
  destination: MapPin,
  interests: Sparkles,
};

interface Overrides {
  budget?: number;
  days?: number;
  travelers?: Travelers;
  departureCityId?: string;
  /** null = explicitly "Surprise me". */
  destinationId?: string | null;
  added: Interest[];
  removed: Interest[];
}

/** Types the example prompts into the empty console, one character at a time. */
function useTypewriter(enabled: boolean): string {
  const [text, setText] = useState(EXAMPLES[0]);
  const example = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    let i = 0;
    let pause = 0;
    const id = window.setInterval(() => {
      if (pause > 0) {
        pause--;
        return;
      }
      const full = EXAMPLES[example.current];
      i++;
      setText(full.slice(0, i));
      if (i >= full.length) {
        pause = 60;
        i = 0;
        example.current = (example.current + 1) % EXAMPLES.length;
      }
    }, 38);
    return () => window.clearInterval(id);
  }, [enabled]);
  return text;
}

interface TripPlannerProps {
  destinations: DestinationSummary[];
  cities: City[];
  initialDestinationId?: string;
  initialPrompt?: string;
  /** Where "Play the journey" goes: in-page anchor on the homepage, route elsewhere. */
  journeyHref?: string;
}

/**
 * AI Trip Builder. Natural language and explicit controls feed one request;
 * the engine responds with a composed journey that the rest of the product
 * (Journey simulator, Walk Before You Book) picks up automatically.
 */
export function TripPlanner({ destinations, cities, initialDestinationId, initialPrompt = "", journeyHref = "/journey" }: TripPlannerProps) {
  const id = useId().replace(/[:«»]/g, "");
  const reduce = usePrefersReducedMotion();
  const { dna, persona } = useTravelDna();
  const { trip, status, error, generate } = useTrip();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [focused, setFocused] = useState(false);
  // Arriving with a destination or prompt means "start a new brief", even if a trip is already in session.
  const [editing, setEditing] = useState(Boolean(initialDestinationId || initialPrompt));
  const [overrides, setOverrides] = useState<Overrides>({ added: [], removed: [], destinationId: initialDestinationId });
  const root = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const typewriter = useTypewriter(!prompt && !focused && !reduce && status !== "generating");

  const parsed = useMemo(() => parseIntent(prompt), [prompt]);

  const fields = useMemo(() => {
    const interests = [...new Set([...parsed.interests.filter((i) => !overrides.removed.includes(i)), ...overrides.added])];
    return {
      budget: overrides.budget ?? parsed.budget ?? 75000,
      days: overrides.days ?? parsed.days ?? 5,
      travelers: overrides.travelers ?? parsed.travelers ?? TRAVELER_PRESETS.couple,
      departureCityId: overrides.departureCityId ?? parsed.departureCityId ?? DEFAULT_DEPARTURE_ID,
      destinationId: overrides.destinationId === null ? null : (overrides.destinationId ?? parsed.destinationId ?? null),
      interests,
    };
  }, [parsed, overrides]);

  const set = <K extends keyof Overrides>(key: K, value: Overrides[K]) => setOverrides((o) => ({ ...o, [key]: value }));

  const toggleInterest = (i: Interest) =>
    setOverrides((o) => {
      const on = fields.interests.includes(i);
      return on
        ? { ...o, added: o.added.filter((x) => x !== i), removed: [...new Set([...o.removed, i])] }
        : { ...o, removed: o.removed.filter((x) => x !== i), added: [...new Set([...o.added, i])] };
    });

  const applySuggestion = (sid: string) => {
    if (sid === "weekend") {
      setOverrides((o) => ({ ...o, days: fields.days === 3 ? undefined : 3 }));
    } else if (sid === "family") {
      setOverrides((o) => ({ ...o, travelers: fields.travelers.type === "family" ? TRAVELER_PRESETS.couple : TRAVELER_PRESETS.family }));
    } else {
      toggleInterest(sid as Interest);
    }
  };

  const suggestionActive = (sid: string) =>
    sid === "weekend" ? fields.days <= 3 : sid === "family" ? fields.travelers.type === "family" : fields.interests.includes(sid as Interest);

  const buildRequest = useCallback(
    (destinationId: string | null): TripRequest => ({
      prompt,
      budget: fields.budget,
      days: fields.days,
      travelers: fields.travelers,
      departureCityId: fields.departureCityId,
      interests: fields.interests,
      destinationId: destinationId ?? undefined,
      dna,
    }),
    [prompt, fields, dna],
  );

  const scrollToTop = () => root.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

  const submit = async (e?: FormEvent, destinationOverride?: string | null) => {
    e?.preventDefault();
    if (status === "generating") return;
    setEditing(false);
    scrollToTop();
    await generate(buildRequest(destinationOverride === undefined ? fields.destinationId : destinationOverride));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  };

  const view = status === "generating" ? "generating" : editing ? "compose" : status === "error" ? "error" : trip ? "result" : "compose";
  const cityName = cities.find((c) => c.id === fields.departureCityId)?.name ?? "home";
  const resultDestination = destinations.find((d) => d.id === trip?.destinationId);

  const signals: IntentSignal[] = parsed.signals;

  return (
    <div ref={root} className="scroll-mt-24">
      <AnimatePresence mode="wait" initial={false}>
        {view === "compose" && (
          <motion.form
            key="compose"
            onSubmit={submit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.25 } }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden border border-line bg-gradient-to-b from-ink-900/90 to-ink-950"
            aria-label="Describe your journey"
          >
            <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[70%] -translate-x-1/2 rounded-full bg-sand/[0.06] blur-3xl" />
            <div className="relative flex items-center justify-between gap-4 border-b border-line px-5 py-4 md:px-10">
              <p className="hud flex items-center gap-2.5 text-bone-dim">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald/60" />
                  <span className="relative size-2 rounded-full bg-emerald" />
                </span>
                Journey engine · ready
              </p>
              <p className="hud hidden text-mist sm:block">Demo engine · sample data</p>
            </div>

            <div className="relative px-5 pt-8 md:px-10 md:pt-12">
              <label htmlFor={`${id}-prompt`} className="sr-only">
                Describe the journey you want
              </label>
              <textarea
                ref={textarea}
                id={`${id}-prompt`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={onKeyDown}
                rows={3}
                maxLength={600}
                placeholder={reduce ? EXAMPLES[0] : typewriter || " "}
                className="block w-full resize-none bg-transparent text-[1.45rem] font-light leading-snug tracking-[-0.02em] text-bone outline-none placeholder:text-bone/30 md:text-[2.1rem]"
              />
              <div className="mt-3 flex min-h-8 flex-wrap items-center gap-2" aria-live="polite">
                {signals.length === 0 ? (
                  <button
                    type="button"
                    className="hud text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
                    onClick={() => {
                      setPrompt(EXAMPLES[0]);
                      textarea.current?.focus();
                    }}
                  >
                    Use the example →
                  </button>
                ) : (
                  <>
                    <span className="hud mr-1 text-mist">Understood</span>
                    <AnimatePresence initial={false}>
                      {signals.map((s) => {
                        const Icon = SIGNAL_ICON[s.field];
                        return (
                          <motion.span
                            key={`${s.field}-${s.label}`}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-1.5 rounded-full border border-sand/30 bg-sand/[0.07] px-3 py-1 text-xs text-bone"
                            title={`From “${s.match}”`}
                          >
                            <Icon className="size-3 text-sand" aria-hidden />
                            {s.label}
                          </motion.span>
                        );
                      })}
                    </AnimatePresence>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={suggestionActive(s.id)}
                    onClick={() => applySuggestion(s.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm transition-colors",
                      suggestionActive(s.id) ? "bg-bone text-ink-950" : "bg-white/[0.05] text-bone-dim hover:bg-white/[0.09] hover:text-bone",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-10 border-t border-line px-5 py-8 md:px-10">
              <PlannerControls
                idPrefix={id}
                budget={fields.budget}
                days={fields.days}
                travelers={fields.travelers}
                departureCityId={fields.departureCityId}
                destinationId={fields.destinationId}
                interests={fields.interests}
                cities={cities}
                destinations={destinations}
                onBudget={(v) => set("budget", v)}
                onDays={(v) => set("days", v)}
                onTravelers={(t) => set("travelers", t)}
                onDeparture={(v) => set("departureCityId", v)}
                onDestination={(v) => set("destinationId", v)}
                onToggleInterest={toggleInterest}
              />
            </div>

            <div className="relative flex flex-col gap-5 border-t border-line px-5 py-6 md:flex-row md:items-center md:justify-between md:px-10">
              <a href="#dna" className="group flex items-center gap-3 text-sm text-bone-dim hover:text-bone">
                <Dna className="size-4 text-sand" aria-hidden />
                <span>
                  Tuned to your Travel DNA — <span className="text-bone">{persona.title}</span>
                </span>
              </a>
              <div className="flex items-center gap-4">
                <span className="hud hidden text-mist lg:inline">Ctrl / ⌘ + Enter</span>
                <Button type="submit" size="lg" arrow magnetic>
                  Compose my journey
                </Button>
              </div>
            </div>
          </motion.form>
        )}

        {view === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <TripGeneration
              signals={signals.length}
              destinations={destinations.map((d) => d.name)}
              personaTitle={persona.title}
              departure={cityName}
              budget={fields.budget}
              days={fields.days}
            />
          </motion.div>
        )}

        {view === "error" && (
          <motion.div
            key="error"
            role="alert"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-sunset/40 bg-sunset/[0.04] p-8 md:p-12"
          >
            <p className="eyebrow text-sunset">Signal lost</p>
            <p className="mt-4 max-w-xl font-serif text-3xl italic leading-tight md:text-4xl">We couldn&apos;t compose this journey.</p>
            <p className="mt-4 max-w-xl text-bone-dim">{error ?? "Something interrupted the engine."} Your brief is saved — try again, or adjust it.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => void submit()} arrow>
                Try again
              </Button>
              <Button variant="ghost" onClick={() => setEditing(true)}>
                <PenLine className="size-4" aria-hidden /> Adjust the brief
              </Button>
            </div>
          </motion.div>
        )}

        {view === "result" && trip && (
          <motion.div key={`result-${trip.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
            <div className="mb-8 flex flex-col gap-4 border border-line px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <p className="text-sm text-bone-dim">
                <span className="hud mr-3 text-mist">Your brief</span>
                {trip.days} days · {describeTravelers(trip.request.travelers)} · {formatINR(trip.request.budget)} · from {trip.transport.from.name}
                {trip.request.interests.length > 0 && <> · {trip.request.interests.join(", ")}</>}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" className="h-9 px-4 text-xs" onClick={() => setEditing(true)}>
                  <PenLine className="size-3.5" aria-hidden /> Edit brief
                </Button>
                <Button variant="quiet" className="h-9 px-3 text-xs" onClick={() => void submit(undefined, null)} aria-label="Recompose">
                  <RotateCcw className="size-3.5" aria-hidden />
                </Button>
              </div>
            </div>
            <TripResult
              trip={trip}
              destination={resultDestination}
              journeyHref={journeyHref}
              onAdjust={() => {
                setEditing(true);
                scrollToTop();
              }}
              onSwitch={(destId) => {
                set("destinationId", destId);
                void submit(undefined, destId);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {view === "compose" && trip && (
        <button type="button" onClick={() => setEditing(false)} className="mt-4 flex items-center gap-2 text-sm text-bone-dim hover:text-bone">
          Back to your {trip.title} journey <ArrowRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
