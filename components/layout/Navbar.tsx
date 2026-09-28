"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/plan", label: "Plan" },
  { href: "/journey", label: "Journey" },
  { href: "/stays", label: "Stays" },
] as const;

/**
 * Sticky, experience-integrated navigation: transparent over immersive heroes,
 * condensing into a thin glass bar on scroll and tucking away while reading.
 */
export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 240 && y > prev + 4 && !menuOpen);
    if (y < prev - 4) setHidden(false);
  });

  // Close the mobile menu on navigation.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-500",
            scrolled ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="absolute inset-0 border-b border-line bg-ink-950/85 backdrop-blur-xl backdrop-saturate-150" />
        </div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-950/70 to-transparent transition-opacity duration-500",
            scrolled ? "opacity-0" : "opacity-100",
          )}
        />
        <nav aria-label="Primary" className="relative mx-auto flex h-16 max-w-[1680px] items-center justify-between px-5 md:h-[4.5rem] md:px-10">
          <Link href="/" className="rounded-sm text-bone" aria-label="TravelVerse home">
            <Logo />
          </Link>

          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
            {LINKS.map((link) => (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "hud rounded-sm px-1 py-2 text-[0.7rem] tracking-[0.24em] transition-colors",
                    isActive(link.href) ? "text-bone" : "text-bone-dim hover:text-bone",
                  )}
                >
                  {link.label}
                </Link>
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-sand"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <span className="hidden md:block">
              <ButtonLink href="/explore" size="md" className="h-10 px-5 text-[0.8rem]" magnetic>
                Start Exploring
              </ButtonLink>
            </span>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-line-strong md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span aria-hidden className="relative block h-2.5 w-4">
                <span className={cn("absolute left-0 top-0 h-px w-4 bg-bone transition-transform duration-300", menuOpen && "top-1/2 rotate-45")} />
                <span className={cn("absolute bottom-0 left-0 h-px w-4 bg-bone transition-transform duration-300", menuOpen && "bottom-auto top-1/2 -rotate-45")} />
              </span>
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-ink-950/96 px-6 pb-10 pt-28 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <ul className="flex flex-col gap-2">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i + 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href={link.href} className="flex items-baseline gap-4 py-2 text-5xl font-semibold tracking-[-0.04em]">
                    <span className="hud text-sand">{String(i + 1).padStart(2, "0")}</span>
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-3">
              <ButtonLink href="/explore" size="lg" arrow>
                Start Exploring
              </ButtonLink>
              <ButtonLink href="/partners" size="lg" variant="ghost">
                Partner with us
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
