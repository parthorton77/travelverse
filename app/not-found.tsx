import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[90svh] items-center overflow-hidden px-5 pt-24 md:px-10">
      <div aria-hidden className="absolute right-[-10vw] top-1/2 size-[60vw] max-h-[720px] max-w-[720px] -translate-y-1/2 rounded-full border border-line bg-[radial-gradient(circle_at_35%_30%,#15222f,#050607_70%)]" />
      <div className="relative mx-auto w-full max-w-[1680px]">
        <p className="hud text-mist">404 · 00.00°N 00.00°E</p>
        <h1 className="mt-6 max-w-3xl text-headline font-semibold">Off the map.</h1>
        <p className="mt-6 max-w-md text-lg text-bone-dim">This place isn&apos;t on our globe — yet. Plenty of others are.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/explore" className="inline-flex h-14 items-center rounded-full bg-bone px-7 font-medium text-ink-950">
            Start Exploring
          </Link>
          <Link href="/plan" className="inline-flex h-14 items-center rounded-full border border-line-strong px-7">
            Build My Trip
          </Link>
        </div>
      </div>
    </section>
  );
}
