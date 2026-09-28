"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface EnterOptions {
  href: string;
  label: string;
  eyebrow?: string;
  detail?: string;
  accent?: string;
  /** Wait before covering the screen — lets a 3D camera move play first. */
  delay?: number;
}

type Phase = "idle" | "covering" | "covered" | "revealing";

interface TransitionContextValue {
  enter: (options: EnterOptions) => void;
  active: boolean;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

/**
 * Cinematic route transitions: a veil with the destination's name covers the
 * screen, the route changes underneath, then the veil lifts onto the new page.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [info, setInfo] = useState<EnterOptions | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const enter = useCallback(
    (options: EnterOptions) => {
      if (phase !== "idle") return;
      const target = options.href.split(/[?#]/)[0];
      if (target === window.location.pathname) {
        router.push(options.href);
        return;
      }
      setInfo(options);
      router.prefetch(options.href);
      later(() => setPhase("covering"), options.delay ?? 0);
    },
    [phase, router],
  );

  const onCovered = () => {
    if (phase !== "covering" || !info) return;
    setPhase("covered");
    router.push(info.href);
    // Safety net: never leave the veil up if navigation stalls.
    later(() => setPhase((p) => (p === "covered" ? "revealing" : p)), 6000);
  };

  // Reveal once the new route has rendered.
  useEffect(() => {
    if (phase !== "covered" || !info) return;
    if (pathname === info.href.split(/[?#]/)[0]) {
      const id = window.setTimeout(() => setPhase("revealing"), 260);
      return () => window.clearTimeout(id);
    }
  }, [pathname, phase, info]);

  const visible = phase === "covering" || phase === "covered";
  const accent = info?.accent ?? "#d9ba8c";
  const value = useMemo(() => ({ enter, active: phase !== "idle" }), [enter, phase]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <AnimatePresence
        onExitComplete={() => {
          setPhase("idle");
          setInfo(null);
        }}
      >
        {visible && info && (
          <motion.div
            key="veil"
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-ink-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            onAnimationComplete={onCovered}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{ background: `radial-gradient(60% 50% at 50% 55%, ${accent}33, transparent 70%)` }}
            />
            <div className="relative text-center">
              <motion.p
                className="eyebrow mb-5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
              >
                {info.eyebrow ?? "Entering"}
              </motion.p>
              <motion.p
                className="text-headline font-semibold uppercase"
                initial={{ opacity: 0, letterSpacing: "0.12em", filter: "blur(8px)" }}
                animate={{ opacity: 1, letterSpacing: "-0.03em", filter: "blur(0px)" }}
                transition={{ delay: 0.1, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {info.label}
              </motion.p>
              {info.detail && (
                <motion.p
                  className="hud mt-6 text-mist"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.6 }}
                >
                  {info.detail}
                </motion.p>
              )}
              <motion.div
                aria-hidden
                className="mx-auto mt-8 h-px w-40 origin-left bg-line-strong"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundColor: accent }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  );
}

export function useJourneyTransition(): TransitionContextValue {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("useJourneyTransition must be used inside <TransitionProvider>");
  return ctx;
}
