"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[TravelVerse] route error", error);
  }, [error]);

  return (
    <section className="flex min-h-[80svh] items-center px-5 pt-24 md:px-10">
      <div className="mx-auto w-full max-w-[1680px]">
        <p className="eyebrow text-sunset">Turbulence</p>
        <h1 className="mt-6 max-w-3xl text-headline font-semibold">We hit a patch of rough air.</h1>
        <p className="mt-6 max-w-lg text-lg text-bone-dim">This part of the journey didn&apos;t load. Your trip and Travel DNA are safe.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={() => retry()} className="inline-flex h-14 items-center rounded-full bg-bone px-7 font-medium text-ink-950">
            Try again
          </button>
          <Link href="/" className="inline-flex h-14 items-center rounded-full border border-line-strong px-7">
            Back to the globe
          </Link>
        </div>
      </div>
    </section>
  );
}
