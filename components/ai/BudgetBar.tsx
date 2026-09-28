"use client";

import { motion } from "framer-motion";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { formatINR } from "@/lib/format";
import type { BudgetCategory, TripBudget } from "@/lib/types";

export const BUDGET_COLORS: Record<BudgetCategory, string> = {
  transport: "#5b9bd0",
  stay: "#d9ba8c",
  experiences: "#e67c4f",
  food: "#4aa383",
  local: "#8f949c",
};

/** Stacked allocation of the estimate against the requested budget. */
export function BudgetBar({ budget }: { budget: TripBudget }) {
  const scale = Math.max(budget.total, budget.requested);
  const remaining = Math.max(0, budget.requested - budget.total);
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="hud text-mist">Estimated total</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.03em]">{formatINR(budget.total)}</p>
        </div>
        <div className="text-right">
          <p className="hud text-mist">Your budget</p>
          <p className="mt-1 tabular-nums text-bone-dim">{formatINR(budget.requested)}</p>
        </div>
      </div>

      <div className="relative mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]" role="img" aria-label="Budget allocation">
        {budget.lines.map((l, i) => (
          <motion.div
            key={l.category}
            className="h-full"
            style={{ backgroundColor: BUDGET_COLORS[l.category] }}
            initial={{ width: 0 }}
            animate={{ width: `${(l.amount / scale) * 100}%` }}
            transition={{ duration: 1, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
        {budget.total > budget.requested && (
          <span className="absolute inset-y-0 w-px bg-bone" style={{ left: `${(budget.requested / scale) * 100}%` }} aria-hidden />
        )}
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
        {budget.lines.map((l) => (
          <li key={l.category} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-bone-dim">
              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: BUDGET_COLORS[l.category] }} />
              {l.label}
            </span>
            <span className="tabular-nums">{formatINR(l.amount)}</span>
          </li>
        ))}
        {remaining > 0 && (
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-bone-dim">
              <span aria-hidden className="size-2 rounded-full border border-line-strong" />
              Headroom
            </span>
            <span className="tabular-nums text-emerald">{formatINR(remaining)}</span>
          </li>
        )}
      </ul>
      <div className="mt-4 flex items-center gap-3">
        <EstimateTag />
        <span className="text-xs text-mist">Sample-data estimate · not live prices</span>
      </div>
    </div>
  );
}
