/** TravelVerse Engine — the B2B modules behind the consumer experience. */

export interface EngineModule {
  id: "destination" | "journey" | "stay" | "personalization" | "data";
  code: string;
  name: string;
  summary: string;
  capabilities: string[];
  powers: { label: string; href: string }[];
  partners: string[];
  snippet: string;
  /** Live endpoint in this prototype, if the module exposes one. */
  endpoint?: { method: "GET" | "POST"; path: string };
}

export const engineModules: EngineModule[] = [
  {
    id: "destination",
    code: "TV·3D",
    name: "3D Destination Engine",
    summary: "A living globe and destination worlds rendered in the browser — hover, zoom, fly in — with a 2D fallback that never breaks.",
    capabilities: ["WebGL2 globe with hotspots, routes and live local time", "Procedural destination scenes, no asset pipeline", "Choreographed camera transitions", "Automatic fallback on low-end devices"],
    powers: [
      { label: "Hero globe", href: "/" },
      { label: "Explore", href: "/explore" },
    ],
    partners: ["Tourism boards", "Airlines"],
    snippet: `import { Globe } from "@travelverse/react";

<Globe
  destinations={catalogue}
  origin={{ name: "Ahmedabad", lat: 23.02, lng: 72.57 }}
  onSelect={(id) => router.push(\`/d/\${id}\`)}
/>`,
    endpoint: { method: "GET", path: "/api/v1/destinations?category=beach" },
  },
  {
    id: "journey",
    code: "TV·AI",
    name: "AI Journey Engine",
    summary: "Natural language in; a costed, paced, day-by-day journey out — plus an interactive simulator to play it back.",
    capabilities: ["Intent parsing into structured briefs", "Budget optimisation across stay tiers and experiences", "Day pacing, sequencing and reasoning", "Provider-agnostic: swap in any LLM server-side"],
    powers: [
      { label: "Trip builder", href: "/plan" },
      { label: "Journey simulator", href: "/journey" },
    ],
    partners: ["OTAs", "Travel advisors", "Airlines"],
    snippet: `const { trip } = await travelverse.trips.generate({
  prompt: "5 days, couple, beaches and a little luxury",
  budget: 75000,
  departureCityId: "ahmedabad",
});`,
    endpoint: { method: "POST", path: "/api/v1/trips" },
  },
  {
    id: "stay",
    code: "TV·STY",
    name: "Immersive Stay Engine",
    summary: "Walkable stays with time-of-day lighting and guided viewpoints — the room, the balcony, the pool, the view — before booking.",
    capabilities: ["Space-by-space camera tours", "Morning, sunset and night lighting", "Booking hand-off with viewed room context", "Runs from a floor plan and a photo set"],
    powers: [{ label: "Walk before you book", href: "/stays" }],
    partners: ["Hotel groups", "Resorts", "OTAs"],
    snippet: `<StayExplorer
  property="casa-mare"
  spaces={["lobby", "room", "balcony", "pool"]}
  time="sunset"
  onBook={(ctx) => partner.checkout(ctx)}
/>`,
  },
  {
    id: "personalization",
    code: "TV·DNA",
    name: "Personalization Engine",
    summary: "Travel DNA profiles that re-rank inventory in real time and tune every recommendation and itinerary.",
    capabilities: ["Seven-dimension traveller profiles", "Weighted destination and experience matching", "Explainable match scores", "Works signed-out, syncs when signed-in"],
    powers: [{ label: "Travel DNA", href: "/#dna" }],
    partners: ["OTAs", "Airline loyalty", "Card programmes"],
    snippet: `const ranked = travelverse.personalize.rank(dna, inventory);
// → [{ id: "goa", match: 93 }, { id: "kerala", match: 88 }, …]`,
  },
  {
    id: "data",
    code: "TV·DAT",
    name: "Travel Data Engine",
    summary: "One typed schema for destinations, experiences, stays and routes — behind a versioned API partners can build on.",
    capabilities: ["Unified destination / stay / experience model", "Versioned REST API (v1)", "Mock-to-live provider swap per domain", "Estimates always labelled as estimates"],
    powers: [{ label: "API", href: "/api/v1/destinations" }],
    partners: ["Every partner"],
    snippet: `GET /api/v1/destinations/goa

{ "data": { "name": "Goa", "idealDays": [3, 6],
  "experiences": [...], "stays": [...] } }`,
    endpoint: { method: "GET", path: "/api/v1/destinations/goa" },
  },
];

export const partnerTypes = [
  { name: "Airlines", use: "Turn a fare search into a destination you can see — and sell the trip, not just the seat." },
  { name: "Hotel groups", use: "Let guests walk the room and the view before they commit. Fewer surprises, fewer cancellations." },
  { name: "OTAs", use: "Replace result lists with composed journeys personalised to each traveller's DNA." },
  { name: "Tourism boards", use: "An immersive, always-on showcase of your destination that any campaign can deep-link into." },
];

export const integrationModes = [
  { name: "Embed SDK", detail: "React components for globe, planner, journey and stay." },
  { name: "REST API", detail: "Versioned endpoints for trips, destinations and personalisation." },
  { name: "White-label", detail: "The full TravelVerse experience under your brand and inventory." },
];
