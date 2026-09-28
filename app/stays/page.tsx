import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HotelExplorer } from "@/components/hotel/HotelExplorer";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatINR } from "@/lib/format";
import { destinationService } from "@/lib/services/destinationService";
import { hotelService } from "@/lib/services/hotelService";

export const metadata: Metadata = {
  title: "Stays — Walk before you book",
  description: "Walk a concept resort room by room, at morning, sunset or night, before you book it.",
};

export default async function StaysPage() {
  const flagship = hotelService.getFlagshipSync();
  const [home, luxury, catalogue] = await Promise.all([
    destinationService.getById(flagship.destinationId),
    hotelService.listByTier("luxury"),
    destinationService.list(),
  ]);
  if (!home) notFound();
  const others = luxury.filter((s) => s.id !== flagship.id);
  const nameOf = (id: string) => catalogue.find((d) => d.id === id)?.name ?? "";

  return (
    <>
      <h1 className="sr-only">Walk before you book — {flagship.name}</h1>
      <div className="pt-16 md:pt-[4.5rem]">
        <HotelExplorer stay={flagship} scene={home.scene} variant="page" />
      </div>

      <section aria-label="More concept stays" className="py-28 md:py-36">
        <div className="mx-auto max-w-[1680px] px-5 md:px-10">
          <SectionHeading
            eyebrow="Immersive stay engine"
            title="Every stay could be walked like this."
            lede="Casa Maré is the flagship demo. The same engine turns any property's floor plan and photography into a walkable preview."
          />
          <ul className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {others.map((s) => (
              <li key={s.id} className="bg-ink-950 p-6">
                <p className="hud text-mist">{nameOf(s.destinationId)}</p>
                <p className="mt-2 text-xl font-semibold">{s.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-bone-dim">{s.description}</p>
                <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  {formatINR(s.nightlyEstimate)} / night <EstimateTag label="Example price" />
                </p>
                <p className="hud mt-3 text-mist">Walkthrough · needs partner floor plans</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-bone-dim">
            Run a hotel group?{" "}
            <Link href="/partners#contact" className="text-sand underline-offset-4 hover:underline">
              See what the Immersive Stay Engine can do for your properties →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
