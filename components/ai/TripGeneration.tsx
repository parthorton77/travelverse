"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";

interface TripGenerationProps {
  signals: number;
  destinations: string[];
  personaTitle: string;
  departure: string;
  budget: number;
  days: number;
}

/**
 * The engine "thinking" — a fast, legible trace of what it is doing with the
 * user's request. Every line is derived from the real inputs.
 */
export function TripGeneration({ signals, destinations, personaTitle, departure, budget, days }: TripGenerationProps) {
  const reduce = usePrefersReducedMotion();
  const steps = [
    { label: "Reading intent", detail: signals ? `${signals} ${signals === 1 ? "signal" : "signals"} understood, plus your Travel DNA` : "Working from your settings and Travel DNA" },
    { label: "Scanning destinations", detail: `${destinations.length} worlds in range` },
    { label: "Matching Travel DNA", detail: personaTitle },
    { label: `Routing from ${departure}`, detail: "Flights, rail and transfer times" },
    { label: `Balancing ${formatINR(budget)}`, detail: `Across ${days} days, stay tiers and experiences` },
    { label: "Composing the journey", detail: "Pacing each day around its best moment" },
  ];
  const [step, setStep] = useState(reduce ? steps.length : 0);
  const [scan, setScan] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setStep((s) => Math.min(steps.length, s + 1)), 420);
    const s = window.setInterval(() => setScan((i) => i + 1), 90);
    return () => {
      window.clearInterval(t);
      window.clearInterval(s);
    };
  }, [reduce, steps.length]);

  return (
    <div role="status" aria-live="polite" className="relative overflow-hidden border border-line bg-ink-900/60 p-6 md:p-10">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="h-px w-1/3 animate-scan bg-gradient-to-r from-transparent via-sand to-transparent" />
      </div>
      <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
        <div>
          <p className="eyebrow">Journey engine · working</p>
          <p className="mt-6 font-serif text-4xl italic leading-tight md:text-5xl">Preparing your journey…</p>
          <p className="mt-6 h-6 font-mono text-sm text-sand" aria-hidden>
            {step < 2 ? destinations[scan % destinations.length]?.toUpperCase() : step >= steps.length ? "LOCKED" : destinations[(scan * 7) % destinations.length]?.toUpperCase()}
          </p>
        </div>
        <ol className="space-y-4">
          {steps.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <motion.li
                key={s.label}
                className="flex items-start gap-4"
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: i <= step ? 1 : 0.25, x: 0 }}
                transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.05 }}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-300",
                    done ? "border-sand bg-sand text-ink-950" : current ? "border-sand" : "border-line-strong",
                  )}
                >
                  {done ? <Check className="size-3" aria-hidden /> : current ? <span className="size-1.5 animate-pulse rounded-full bg-sand" /> : null}
                </span>
                <div>
                  <p className={cn("text-sm", done || current ? "text-bone" : "text-mist")}>{s.label}</p>
                  <p className="text-xs text-mist">{s.detail}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
