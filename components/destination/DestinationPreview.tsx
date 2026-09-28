"use client";

import Link from "next/link";
import { Clock, Plane, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { useLocalTime } from "@/hooks/useLocalTime";
import { formatCoordinates, formatDuration, formatINRCompact } from "@/lib/format";
import type { DestinationSummary } from "@/lib/summaries";
import { DestinationScene } from "./DestinationScene";

interface DestinationPreviewProps {
  destination: DestinationSummary;
  onEnter: () => void;
  showScene?: boolean;
}

/** Compact destination card used by the hero panel, explore panels and mobile sheets. */
export function DestinationPreview({ destination: d, onEnter, showScene = true }: DestinationPreviewProps) {
  const localTime = useLocalTime(d.timezone);
  const TransportIcon = d.transport.mode === "flight" ? Plane : TrainFront;
  return (
    <div>
      {showScene && (
        <DestinationScene scene={d.scene} priority className="-mx-5 -mt-5 mb-5 h-32 md:h-36">
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />
        </DestinationScene>
      )}
      <p className="hud text-mist">
        {d.country} · {formatCoordinates(d.lat, d.lng)}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{d.name}</p>
      <p className="mt-2 text-sm leading-relaxed text-bone-dim">{d.tagline}</p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
        <div>
          <dt className="hud text-mist">Local time</dt>
          <dd className="mt-1 flex items-center gap-1.5 tabular-nums">
            <Clock aria-hidden className="size-3.5 text-sand" />
            {localTime || "—"}
          </dd>
        </div>
        <div>
          <dt className="hud text-mist">From {d.transport.fromName}</dt>
          <dd className="mt-1 flex items-center gap-1.5">
            <TransportIcon aria-hidden className="size-3.5 text-sand" />
            {formatDuration(d.transport.durationHours)} <span className="text-mist">est.</span>
          </dd>
        </div>
        <div>
          <dt className="hud text-mist">Ideal stay</dt>
          <dd className="mt-1">
            {d.idealDays[0]}–{d.idealDays[1]} days
          </dd>
        </div>
        <div>
          <dt className="hud text-mist">Per person</dt>
          <dd className="mt-1">
            {formatINRCompact(d.budget.min)}–{formatINRCompact(d.budget.max)}
          </dd>
        </div>
      </dl>
      <div className="mt-3">
        <EstimateTag />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={onEnter} arrow>
          Enter {d.name}
        </Button>
        <Link href={`/plan?destination=${d.slug}`} className="text-sm text-bone-dim underline-offset-4 hover:text-bone hover:underline">
          Build a trip here
        </Link>
      </div>
    </div>
  );
}
