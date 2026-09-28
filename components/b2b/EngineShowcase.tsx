"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { engineModules, integrationModes, partnerTypes, type EngineModule } from "@/data/engine";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import { ApiConsole } from "./ApiConsole";

function B2BModule({ module, index, active, onSelect }: { module: EngineModule; index: number; active: boolean; onSelect: () => void }) {
  return (
    <li className="border-b border-line first:border-t">
      <button
        type="button"
        aria-expanded={active}
        onClick={onSelect}
        onMouseEnter={onSelect}
        className="group grid w-full grid-cols-[2.5rem_1fr] items-baseline gap-4 py-5 text-left md:grid-cols-[3rem_1fr_auto]"
      >
        <span className={cn("hud", active ? "text-sand" : "text-mist")}>{pad2(index + 1)}</span>
        <span className={cn("font-mono text-sm tracking-[0.14em] transition-colors md:text-base", active ? "text-bone" : "text-bone-dim group-hover:text-bone")}>
          [{module.name.toUpperCase()}]
        </span>
        <span className="hud hidden text-mist md:inline">{module.code}</span>
      </button>
      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 pb-7 pl-[3.5rem] md:grid-cols-2 md:pl-[4rem]">
              <div>
                <p className="leading-relaxed text-bone">{module.summary}</p>
                <p className="hud mt-5 text-mist">Built for</p>
                <p className="mt-1.5 text-sm text-bone-dim">{module.partners.join(" · ")}</p>
                <p className="hud mt-4 text-mist">Powers in this demo</p>
                <p className="mt-1.5 flex flex-wrap gap-3 text-sm">
                  {module.powers.map((p) => (
                    <Link key={p.href} href={p.href} className="text-sand underline-offset-4 hover:underline">
                      {p.label}
                    </Link>
                  ))}
                </p>
              </div>
              <ul className="space-y-2 text-sm text-bone-dim">
                {module.capabilities.map((c) => (
                  <li key={c} className="flex gap-3">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-sand" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/**
 * The strategic reveal: everything above is a product built on the
 * TravelVerse Engine, and each module can be licensed on its own.
 */
export function EngineShowcase({ index = "08", showCta = true }: { index?: string; showCta?: boolean }) {
  const [activeId, setActiveId] = useState<EngineModule["id"]>("journey");
  const active = engineModules.find((m) => m.id === activeId) ?? engineModules[0];

  return (
    <section id="engine" aria-label="TravelVerse Engine" className="relative overflow-hidden border-t border-line bg-[linear-gradient(180deg,#07090b,#050607)] py-28 md:py-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(70%_60%_at_50%_40%,#000,transparent)]" />
      <div className="relative mx-auto max-w-[1680px] px-5 md:px-10">
        <SectionHeading
          index={index}
          eyebrow="For airlines, hotel groups, OTAs & tourism boards"
          title="Travel technology, built for the next generation."
          lede="Everything you just used is a demo. Underneath is the TravelVerse Engine — five modules, one API, embeddable one at a time or as a complete white-label experience."
        />

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <Reveal>
            <p className="hud mb-4 flex items-center gap-3 text-sand">
              <span className="size-1.5 rounded-full bg-sand" /> TRAVELVERSE ENGINE · v1 prototype
            </p>
            <ul>
              {engineModules.map((m, i) => (
                <B2BModule key={m.id} module={m} index={i} active={m.id === activeId} onSelect={() => setActiveId(m.id)} />
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="min-h-[24rem] lg:sticky lg:top-28 lg:self-start">
            <ApiConsole key={active.id} module={active} />
          </Reveal>
        </div>

        <Reveal className="mt-24">
          <p className="eyebrow">Who it&apos;s for</p>
          <ul className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {partnerTypes.map((p) => (
              <li key={p.name} className="bg-ink-950 p-6">
                <p className="text-lg font-semibold">{p.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-bone-dim">{p.use}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-16 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <ul className="grid gap-6 sm:grid-cols-3 lg:max-w-4xl">
            {integrationModes.map((m) => (
              <li key={m.name}>
                <p className="font-mono text-sm tracking-[0.14em] text-bone">{m.name.toUpperCase()}</p>
                <p className="mt-2 text-sm text-bone-dim">{m.detail}</p>
              </li>
            ))}
          </ul>
          {showCta && (
            <ButtonLink href="/partners#contact" size="lg" arrow magnetic className="self-start">
              Partner With Us
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}
