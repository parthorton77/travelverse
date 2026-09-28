"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { forwardRef, useRef, type ComponentProps, type ReactNode } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "quiet";
type Size = "md" | "lg";

const base =
  "group relative inline-flex select-none items-center justify-center gap-3 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-300 ease-out disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-bone text-ink-950 hover:bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_10px_40px_-10px_rgba(237,232,223,0.35)]",
  ghost: "border border-line-strong text-bone hover:border-bone/50 hover:bg-white/[0.04]",
  quiet: "text-bone-dim hover:text-bone",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-[0.95rem]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Show the trailing arrow glyph. */
  arrow?: boolean;
  magnetic?: boolean;
  children: ReactNode;
  className?: string;
}

function Inner({ children, arrow }: { children: ReactNode; arrow?: boolean }) {
  return (
    <>
      <span className="relative inline-flex items-center gap-2">{children}</span>
      {arrow && (
        <ArrowUpRight
          aria-hidden
          className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, CommonProps & Omit<ComponentProps<"button">, "children">>(function Button(
  { variant = "primary", size = "md", arrow, magnetic, className, children, ...rest },
  forwarded,
) {
  const local = useRef<HTMLButtonElement>(null);
  useMagnetic(local, magnetic ? 0.25 : 0);
  return (
    <button
      ref={(node) => {
        local.current = node;
        if (typeof forwarded === "function") forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  );
});

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow,
  magnetic,
  className,
  children,
  ...rest
}: CommonProps & Omit<ComponentProps<typeof Link>, "children">) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnetic(ref, magnetic ? 0.25 : 0);
  return (
    <Link ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      <Inner arrow={arrow}>{children}</Inner>
    </Link>
  );
}
