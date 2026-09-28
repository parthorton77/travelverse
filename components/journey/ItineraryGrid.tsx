import { formatINR, pad2 } from "@/lib/format";
import type { DayPlan, ItineraryItemKind } from "@/lib/types";

const ITEM_TONE: Record<ItineraryItemKind, string> = {
  transport: "bg-ocean",
  stay: "bg-sand",
  experience: "bg-sunset",
  dining: "bg-emerald",
  free: "bg-mist",
};

/** Compact day-by-day plan: one tile per day, colour-coded by kind. */
export function ItineraryGrid({ days }: { days: DayPlan[] }) {
  if (!days.length) return <p className="text-bone-dim">No days planned yet.</p>;
  return (
    // Borders live on the tiles, so a part-filled last row leaves clean empty space instead of a grey gap.
    <ol className="grid border-l border-t border-line md:grid-cols-2 xl:grid-cols-3">
      {days.map((day) => (
        <li key={day.day} className="border-b border-r border-line bg-ink-950 p-6">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-3xl text-sand">{pad2(day.day)}</span>
            <div>
              <p className="font-semibold">{day.title}</p>
              <p className="text-sm text-mist">{day.theme}</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {day.items.map((item) => (
              <li key={item.id} className="flex gap-3 text-sm">
                <span className="w-11 shrink-0 font-mono text-xs leading-5 text-mist">{item.time}</span>
                <span aria-hidden className={`mt-2 size-1.5 shrink-0 rounded-full ${ITEM_TONE[item.kind]}`} />
                <span className="leading-5">
                  <span className="text-bone">{item.title}</span>
                  {item.cost ? <span className="ml-2 font-mono text-xs text-mist">{formatINR(item.cost)}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
