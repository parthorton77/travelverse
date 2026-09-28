import { cn } from "@/lib/cn";

/**
 * Premium loading state: an orbiting satellite around a small world, with a
 * line of copy instead of "Loading…".
 */
export function OrbitLoader({ label = "Preparing your journey…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-6", className)}>
      <div aria-hidden className="relative size-16">
        <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#2b4a66,#0a1520_70%)] shadow-[0_0_30px_rgba(91,155,208,0.35)]" />
        <div className="absolute inset-0 rounded-full border border-line-strong" />
        <div className="absolute inset-0 animate-orbit">
          <span className="absolute -top-[3px] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-sand shadow-[0_0_10px_#d9ba8c]" />
        </div>
      </div>
      <p className="hud text-bone-dim">{label}</p>
    </div>
  );
}
