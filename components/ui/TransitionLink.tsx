"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useJourneyTransition } from "@/components/providers/TransitionProvider";

interface TransitionLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
  label: string;
  eyebrow?: string;
  detail?: string;
  accent?: string;
}

/**
 * A normal link that plays the cinematic veil on plain left-clicks. Modified
 * clicks (new tab, etc.) and keyboard activation keep native behaviour.
 */
export function TransitionLink({ href, label, eyebrow, detail, accent, onClick, ...rest }: TransitionLinkProps) {
  const { enter } = useJourneyTransition();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    enter({ href, label, eyebrow, detail, accent });
  };
  return <Link href={href} onClick={handle} {...rest} />;
}
