import { SectionHeading } from "@/components/ui/SectionHeading";
import type { SceneConfig, Stay } from "@/lib/types";
import { HotelExplorer } from "./HotelExplorer";

export function StaySection({ stay, scene }: { stay: Stay; scene: SceneConfig }) {
  return (
    <section id="stays" aria-label="Walk before you book" className="scroll-mt-20 py-28 md:py-40">
      <div className="mx-auto max-w-[1680px] px-5 md:px-10">
        <SectionHeading
          index="06"
          eyebrow="Immersive stay engine"
          title="Walk before you book."
          lede="Stand in the room. Step onto the balcony. Watch the pool at sunset, then at night. A stay you've already walked is a stay you book with confidence."
        />
      </div>
      <div className="mt-14 md:mt-20">
        <HotelExplorer stay={stay} scene={scene} />
      </div>
    </section>
  );
}
