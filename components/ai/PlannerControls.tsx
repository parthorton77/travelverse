"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { INTEREST_LABELS } from "@/lib/ai/parseIntent";
import { cn } from "@/lib/cn";
import { formatINR, formatINRCompact } from "@/lib/format";
import type { City, Interest, TravelerType, Travelers } from "@/lib/types";

export const TRAVELER_PRESETS: Record<TravelerType, Travelers> = {
  solo: { type: "solo", adults: 1, children: 0 },
  couple: { type: "couple", adults: 2, children: 0 },
  family: { type: "family", adults: 2, children: 2 },
  friends: { type: "friends", adults: 4, children: 0 },
};

export const INTEREST_OPTIONS: Interest[] = ["beach", "adventure", "luxury", "food", "culture", "nature", "nightlife", "relaxation", "mountains", "hidden-gems"];

export const BUDGET_MIN = 15000;
export const BUDGET_MAX = 500000;

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="hud text-mist">
            {label}
          </label>
        ) : (
          <p className="hud text-mist">{label}</p>
        )}
        {hint}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

interface PlannerControlsProps {
  idPrefix: string;
  budget: number;
  days: number;
  travelers: Travelers;
  departureCityId: string;
  destinationId: string | null;
  interests: Interest[];
  cities: City[];
  destinations: { id: string; name: string }[];
  onBudget: (v: number) => void;
  onDays: (v: number) => void;
  onTravelers: (t: Travelers) => void;
  onDeparture: (id: string) => void;
  onDestination: (id: string | null) => void;
  onToggleInterest: (i: Interest) => void;
}

/** Explicit trip parameters. Everything the prompt can express, the user can also set directly. */
export function PlannerControls(p: PlannerControlsProps) {
  const fill = ((Math.min(BUDGET_MAX, p.budget) - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const selectCls =
    "h-11 w-full appearance-none rounded-full border border-line-strong bg-ink-950/60 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22%3E%3Cpath d=%22M1 1l4 4 4-4%22 stroke=%22%238f949c%22 fill=%22none%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_1rem_center] bg-no-repeat px-4 pr-9 text-sm text-bone outline-none transition-colors hover:border-bone/40 focus-visible:border-sand";

  return (
    <div className="grid gap-8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.5fr_1fr_1fr]">
        <Field label="Budget" htmlFor={`${p.idPrefix}-budget`} hint={<span className="font-mono text-sm tabular-nums text-bone">{formatINR(p.budget)}</span>}>
          <input
            id={`${p.idPrefix}-budget`}
            type="range"
            className="tv-range"
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={5000}
            value={Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, p.budget))}
            style={{ ["--fill" as string]: `${fill}%` }}
            aria-valuetext={`${formatINR(p.budget)} total`}
            onChange={(e) => p.onBudget(Number(e.target.value))}
          />
          <div className="mt-1 flex justify-between font-mono text-[0.65rem] text-mist">
            <span>{formatINRCompact(BUDGET_MIN)}</span>
            <span>Total for everyone</span>
            <span>{formatINRCompact(BUDGET_MAX)}</span>
          </div>
        </Field>

        <Field label="Duration">
          <div className="flex h-11 items-center justify-between rounded-full border border-line-strong px-1.5">
            <button type="button" aria-label="Fewer days" className="grid size-8 place-items-center rounded-full text-bone-dim hover:bg-white/5 hover:text-bone disabled:opacity-30" disabled={p.days <= 2} onClick={() => p.onDays(p.days - 1)}>
              <Minus className="size-3.5" />
            </button>
            <span className="text-sm tabular-nums" aria-live="polite">
              {p.days} days
            </span>
            <button type="button" aria-label="More days" className="grid size-8 place-items-center rounded-full text-bone-dim hover:bg-white/5 hover:text-bone disabled:opacity-30" disabled={p.days >= 14} onClick={() => p.onDays(p.days + 1)}>
              <Plus className="size-3.5" />
            </button>
          </div>
        </Field>

        <Field label="Travellers" hint={<span className="text-xs text-mist">{p.travelers.adults + p.travelers.children} people</span>}>
          <div role="radiogroup" aria-label="Travellers" className="grid h-11 grid-cols-4 rounded-full border border-line-strong p-1">
            {(Object.keys(TRAVELER_PRESETS) as TravelerType[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={p.travelers.type === t}
                onClick={() => p.onTravelers(TRAVELER_PRESETS[t])}
                className={cn(
                  "rounded-full text-xs capitalize transition-colors",
                  p.travelers.type === t ? "bg-bone text-ink-950" : "text-bone-dim hover:text-bone",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="From" htmlFor={`${p.idPrefix}-from`}>
          <select id={`${p.idPrefix}-from`} className={selectCls} value={p.departureCityId} onChange={(e) => p.onDeparture(e.target.value)}>
            {p.cities.map((c) => (
              <option key={c.id} value={c.id} className="bg-ink-900">
                {c.name} ({c.airportCode})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Destination" htmlFor={`${p.idPrefix}-to`}>
          <select id={`${p.idPrefix}-to`} className={selectCls} value={p.destinationId ?? ""} onChange={(e) => p.onDestination(e.target.value || null)}>
            <option value="" className="bg-ink-900">
              Surprise me
            </option>
            {p.destinations.map((d) => (
              <option key={d.id} value={d.id} className="bg-ink-900">
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Interests">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Interests">
          {INTEREST_OPTIONS.map((i) => {
            const on = p.interests.includes(i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                onClick={() => p.onToggleInterest(i)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  on ? "border-sand/70 bg-sand/10 text-bone" : "border-line-strong text-bone-dim hover:border-bone/40 hover:text-bone",
                )}
              >
                {INTEREST_LABELS[i]}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
