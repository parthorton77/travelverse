import { cn } from "@/lib/cn";

/** TravelVerse mark: a world with a single orbit — exploration as a path, not a pin. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-6", className)} fill="none">
      <circle cx="16" cy="16" r="7.5" fill="currentColor" opacity="0.92" />
      <ellipse cx="16" cy="16" rx="14" ry="5.2" transform="rotate(-24 16 16)" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <circle cx="28.2" cy="10.6" r="1.6" fill="#d9ba8c" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-mono text-[0.8rem] font-medium tracking-[0.32em]">TRAVELVERSE</span>
    </span>
  );
}
