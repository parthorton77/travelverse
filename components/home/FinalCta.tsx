import { AnimatedText } from "@/components/ui/AnimatedText";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/** Closing moment: a sunrise over the planet's limb, drawn in CSS so it costs nothing to render. */
export function FinalCta() {
  return (
    <section aria-label="Start your journey" className="relative isolate overflow-hidden py-36 md:py-52">
      <div aria-hidden className="absolute inset-x-[-20%] bottom-[-78vw] -z-10 aspect-square rounded-full bg-[radial-gradient(circle_at_50%_0%,#1a2c40_0%,#0a1119_45%,#050607_70%)] shadow-[0_-40px_120px_-20px_rgba(91,155,208,0.35)] md:bottom-[-86vw]" />
      <div aria-hidden className="absolute inset-x-[-20%] bottom-[-78vw] -z-10 aspect-square rounded-full border-t border-[#8fb8dc]/40 md:bottom-[-86vw]" />
      <div aria-hidden className="absolute bottom-[8%] left-1/2 -z-10 h-40 w-[60%] -translate-x-1/2 rounded-full bg-sand/15 blur-3xl" />

      <div className="mx-auto max-w-[1680px] px-5 text-center md:px-10">
        <Reveal>
          <p className="eyebrow">Your journey starts here</p>
        </Reveal>
        <AnimatedText as="h2" text="Build your world." className="mx-auto mt-8 max-w-5xl text-display font-semibold uppercase" />
        <Reveal delay={0.2}>
          <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-bone-dim">Explore before you book. It takes one spin of the planet.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/explore" size="lg" arrow magnetic>
              Start Exploring
            </ButtonLink>
            <ButtonLink href="/plan" size="lg" variant="ghost">
              Build My Trip
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
