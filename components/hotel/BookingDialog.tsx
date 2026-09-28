"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { formatINR } from "@/lib/format";
import type { Stay, StaySpace } from "@/lib/types";

/**
 * "Book This Experience" — honest about the prototype: no real booking,
 * but shows exactly what would hand off to a partner's booking engine.
 */
export function BookingDialog({ open, onClose, stay, space }: { open: boolean; onClose: () => void; stay: Stay; space: StaySpace }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="booking-title"
      className="m-auto w-[min(92vw,34rem)] border border-line-strong bg-ink-900 p-0 text-bone backdrop:bg-ink-950/70 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-7 md:p-9">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 grid size-9 place-items-center rounded-full border border-line text-bone-dim hover:text-bone" aria-label="Close">
          <X className="size-4" />
        </button>
        <p className="eyebrow">Prototype · booking hand-off</p>
        <h2 id="booking-title" className="mt-4 font-serif text-3xl italic leading-tight">
          You&apos;ve walked it. In production, you&apos;d book it here.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-bone-dim">
          Booking isn&apos;t live in this demo. For a partner property, TravelVerse passes the exact room, view and timing you explored straight to their booking engine.
        </p>
        <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-mist">Stay</dt>
            <dd>
              {stay.name} · {stay.area}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-mist">Last viewed</dt>
            <dd>{space.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-mist">From</dt>
            <dd className="flex items-center gap-2">
              {formatINR(stay.nightlyEstimate)} / night <EstimateTag label="Example price" />
            </dd>
          </div>
        </dl>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={onClose}>Got it</Button>
          <Link href="/partners" className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 text-sm hover:border-bone/50">
            Power this for your property
          </Link>
        </div>
      </div>
    </dialog>
  );
}
