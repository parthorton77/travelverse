import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const COLUMNS = [
  {
    title: "Experience",
    links: [
      { href: "/explore", label: "Explore the world" },
      { href: "/plan", label: "Build a trip" },
      { href: "/journey", label: "Journey simulator" },
      { href: "/stays", label: "Walk before you book" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/partners", label: "TravelVerse Engine" },
      { href: "/partners#modules", label: "Modules" },
      { href: "/api/v1/destinations", label: "Destinations API (sample)" },
      { href: "/partners#contact", label: "Partner with us" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-ink-950">
      <div className="mx-auto grid max-w-[1680px] gap-14 px-5 py-20 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div className="max-w-sm">
          <Logo className="text-bone" />
          <p className="mt-6 font-serif text-3xl italic leading-tight text-bone">Explore before you book.</p>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            TravelVerse is a working prototype. Destinations and landmarks are real; stays are fictional concepts, and every price,
            fare and duration is an illustrative estimate — never a live offer or availability.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-6 space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-bone-dim transition-colors hover:text-bone">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-2 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-10">
          <p className="hud text-mist">© 2026 TravelVerse · Concept prototype</p>
          <p className="hud text-mist">Map data: Natural Earth (public domain)</p>
        </div>
      </div>
    </footer>
  );
}
