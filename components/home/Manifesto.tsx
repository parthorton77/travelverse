"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useRef } from "react";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  { n: "01", title: "Explore", body: "Spin the planet. Hover a coastline. See the local time and how far it really is from home." },
  { n: "02", title: "Build", body: "Tell the engine what you want to feel. It composes the route, the stay and the budget in seconds." },
  { n: "03", title: "Experience", body: "Play the journey stop by stop and walk the hotel — before you spend a rupee." },
];

/** "Explore the world differently" — the product idea in three moves, joined by a path that draws as you scroll. */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const draw = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={ref} aria-labelledby="manifesto-title" className="relative overflow-hidden py-32 md:py-48">
      <div className="mx-auto max-w-[1680px] px-5 md:px-10">
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span className="text-sand">01</span>
            <span aria-hidden className="h-px w-8 bg-line-strong" />
            <span>A different way in</span>
          </p>
        </Reveal>
        <h2 id="manifesto-title" className="mt-8 max-w-6xl text-headline font-semibold">
          <AnimatedText as="span" text="Explore the world" className="block" />
          <AnimatedText as="span" text="differently." delay={0.2} className="block font-serif font-normal italic tracking-[-0.02em] text-sand" />
        </h2>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-bone-dim">
            Travel sites give you forty tabs and a guess. TravelVerse gives you one world you can move through — and a trip that takes shape as you do.
          </p>
        </Reveal>

        <div className="relative mt-24 md:mt-32">
          <svg aria-hidden className="absolute left-0 top-[1.1rem] hidden h-6 w-full md:block" viewBox="0 0 1000 24" preserveAspectRatio="none">
            <path d="M0 12 H1000" stroke="rgba(255,255,255,0.08)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <motion.path
              d="M0 12 H1000"
              stroke="#d9ba8c"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: reduce ? 1 : draw }}
            />
          </svg>
          <ol className="grid gap-14 md:grid-cols-3 md:gap-10">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={0.1 * i} className="relative">
                <span aria-hidden className="relative z-10 grid size-9 place-items-center rounded-full border border-line-strong bg-ink-950 font-mono text-[0.7rem] text-sand">
                  {s.n}
                </span>
                <h3 className="mt-8 text-title font-semibold">{s.title}</h3>
                <p className="mt-4 max-w-sm leading-relaxed text-bone-dim">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
