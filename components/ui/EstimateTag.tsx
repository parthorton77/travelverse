import { cn } from "@/lib/cn";

/** Every price in the prototype carries this label — nothing is a live rate. */
export function EstimateTag({ label = "Estimated", className }: { label?: "Estimated" | "Example price" | string; className?: string }) {
  return (
    <span
      className={cn("hud inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-mist", className)}
      title="Illustrative estimate from sample data — not a live price or availability."
    >
      <span aria-hidden className="size-1 rounded-full bg-sand/70" />
      {label}
    </span>
  );
}
