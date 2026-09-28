import type { Metadata } from "next";
import { EngineShowcase } from "@/components/b2b/EngineShowcase";
import { PartnerForm } from "@/components/b2b/PartnerForm";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Partners — TravelVerse Engine",
  description: "3D destination discovery, AI trip planning, interactive journeys and immersive stays — as modules for airlines, hotel groups, OTAs and tourism boards.",
};

const PILOT = [
  { n: "01", title: "Connect", body: "Share a slice of inventory — destinations, a property, a route network. We map it to the TravelVerse schema." },
  { n: "02", title: "Embed", body: "Drop one module into an existing journey: the globe on a campaign page, the stay engine on a room page." },
  { n: "03", title: "Measure", body: "Compare engagement, time-to-decision and conversion against your current flow." },
];

export default function PartnersPage() {
  return (
    <>
      <section aria-label="Partner with TravelVerse" className="pb-10 pt-32 md:pt-44">
        <div className="mx-auto max-w-[1680px] px-5 md:px-10">
          <p className="eyebrow">TravelVerse Engine</p>
          <AnimatedText as="h1" text="The experience is the demo. The engine is the product." immediate className="mt-6 max-w-6xl text-headline font-semibold" />
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-bone-dim">
              Every interaction on this site — the globe, the planner, the journey, the walkable stay — is a module built to run inside someone else&apos;s product. License one, or all of them under your brand.
            </p>
          </Reveal>
        </div>
      </section>

      <div id="modules" className="scroll-mt-20">
        <EngineShowcase index="01" showCta={false} />
      </div>

      <section aria-label="How a pilot works" className="py-28 md:py-36">
        <div className="mx-auto max-w-[1680px] px-5 md:px-10">
          <p className="eyebrow">How a pilot could work</p>
          <ol className="mt-12 grid gap-12 md:grid-cols-3">
            {PILOT.map((p, i) => (
              <Reveal as="li" key={p.n} delay={i * 0.08}>
                <span className="font-mono text-sm text-sand">{p.n}</span>
                <p className="mt-4 text-title font-semibold">{p.title}</p>
                <p className="mt-3 max-w-sm leading-relaxed text-bone-dim">{p.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="contact" aria-label="Contact partnerships" className="scroll-mt-20 border-t border-line py-28 md:py-36">
        <div className="mx-auto grid max-w-[1680px] gap-14 px-5 md:px-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">Partner with us</p>
            <p className="mt-6 text-headline font-semibold">Let&apos;s build your world.</p>
          </div>
          <PartnerForm />
        </div>
      </section>
    </>
  );
}
