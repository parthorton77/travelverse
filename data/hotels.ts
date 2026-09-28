import type { Stay, StaySpace, StayTier } from "@/lib/types";

/**
 * Stays (sample data). Every property here is a fictional concept used to
 * demonstrate the product. Nightly figures are per room, estimated, not live.
 */

type StaySeed = [id: string, name: string, tier: StayTier, area: string, nightly: number, description: string, highlights: string[]];

const seeds: Record<string, StaySeed[]> = {
  goa: [
    ["saltwater-house", "Saltwater House", "comfort", "Anjuna, North Goa", 4200, "A whitewashed guesthouse two lanes from the sea.", ["Courtyard breakfast", "Scooter hire", "5 min to the beach"]],
    ["palm-veda", "Palm Veda", "premium", "Agonda, South Goa", 6600, "Timber cottages under coconut palms on a quiet bay.", ["Sea-facing cottages", "Ayurvedic spa", "Beach dinners"]],
    ["casa-mare", "Casa Maré", "luxury", "Cola, South Goa", 14500, "A concept clifftop resort where the pool meets the Arabian Sea.", ["Infinity pool", "Sea-view balconies", "Chef's beach pavilion"]],
  ],
  rajasthan: [
    ["pink-haveli", "Pink City Haveli", "comfort", "Jaipur", 4000, "A restored merchant's house with frescoed courtyards.", ["Rooftop breakfast", "Old-city location", "Block-print workshop"]],
    ["stepwell-courtyard", "Stepwell Courtyard", "premium", "Jodhpur", 9000, "Sandstone suites around a private stepwell.", ["Fort views", "Plunge pool", "Heritage walks"]],
    ["aravalli-palace", "Aravalli Palace Retreat", "luxury", "Udaipur", 28000, "Lakeside palace suites with a private boat jetty.", ["Lake-facing suites", "Royal dining", "Butler service"]],
  ],
  dubai: [
    ["dune-deira", "Dune & Deira", "comfort", "Al Seef", 7500, "A design hotel on the historic creek.", ["Creek views", "Walk to souks", "Rooftop pool"]],
    ["marina-glasshouse", "Marina Glasshouse", "premium", "Dubai Marina", 14000, "Glass-walled rooms forty floors above the marina.", ["Marina views", "Beach access", "Sky lounge"]],
    ["sahra-pavilions", "Sahra Pavilions", "luxury", "Al Marmoom", 32000, "Private desert pavilions with plunge pools.", ["Private pools", "Falconry mornings", "Stargazing deck"]],
  ],
  paris: [
    ["atelier-onze", "Atelier Onze", "comfort", "Le Marais", 11000, "Compact, characterful rooms above a courtyard.", ["Central location", "Café downstairs", "Bike hire"]],
    ["rive-gauche-rooftops", "Rive Gauche Rooftops", "premium", "Saint-Germain", 19000, "Mansard rooms looking over zinc rooftops.", ["Rooftop terrace", "Library bar", "Walk to Orsay"]],
    ["maison-seine", "Maison Seine", "luxury", "Quai Voltaire", 42000, "Riverside suites facing the Louvre.", ["Seine views", "Michelin-level dining", "Private tours"]],
  ],
  tokyo: [
    ["cedar-asakusa", "Cedar Rooms Asakusa", "comfort", "Asakusa", 9000, "Minimal cedar-lined rooms by Senso-ji.", ["Temple views", "Public bath", "Near the river"]],
    ["shibuya-skyline", "Shibuya Skyline Rooms", "premium", "Shibuya", 16000, "High-floor rooms above the Scramble.", ["City views", "Rooftop bar", "Station access"]],
    ["koen-tower", "Kōen Tower Ryokan", "luxury", "Otemachi", 38000, "A vertical ryokan with private onsen baths.", ["Private onsen", "Kaiseki dinner", "Palace garden views"]],
  ],
  bali: [
    ["terrace-bungalows", "Rice Terrace Bungalows", "comfort", "Ubud", 4500, "Bamboo bungalows facing emerald paddies.", ["Terrace views", "Yoga shala", "Scooter hire"]],
    ["canopy-villas", "Canopy Villas", "premium", "Ubud", 9500, "Pool villas in the jungle canopy.", ["Private pools", "Floating breakfast", "Spa"]],
    ["cliffline", "Cliffline Uluwatu", "luxury", "Uluwatu", 24000, "Clifftop villas above the surf breaks.", ["Ocean-edge pools", "Surf butler", "Sunset bar"]],
  ],
  switzerland: [
    ["valley-guesthouse", "Valley Guesthouse", "comfort", "Lauterbrunnen", 13000, "A timber inn beneath Staubbach Falls.", ["Waterfall views", "Swiss breakfast", "Rail access"]],
    ["glacier-chalet", "Glacier View Chalet", "premium", "Grindelwald", 22000, "Chalet suites facing the Eiger north face.", ["Eiger views", "Fireplaces", "Ski-in access"]],
    ["alpenglow-house", "Alpenglow House", "luxury", "Interlaken", 45000, "A lakeside grand hotel between two lakes.", ["Thermal spa", "Lake views", "Private rail concierge"]],
  ],
  "new-york": [
    ["hudson-loft", "Hudson Loft Rooms", "comfort", "Lower East Side", 15000, "Warehouse lofts with exposed brick.", ["Neighbourhood bars", "Subway access", "Roof deck"]],
    ["midtown-glass", "Midtown Glass Tower", "premium", "Midtown", 26000, "Floor-to-ceiling windows over the grid.", ["Skyline views", "Walk to Broadway", "Fitness studio"]],
    ["park-line", "Park Line Residence", "luxury", "Central Park South", 55000, "Park-facing suites with a private terrace.", ["Park views", "Butler service", "Chef's table"]],
  ],
  kerala: [
    ["spice-coast", "Spice Coast Homestay", "comfort", "Fort Kochi", 3800, "A colonial bungalow with a mango-tree garden.", ["Home-cooked breakfast", "Heritage lanes", "Cycle hire"]],
    ["tea-ridge", "Tea Ridge Lodge", "premium", "Munnar", 8000, "Cottages on a working tea estate.", ["Estate walks", "Fireplace lounge", "Valley views"]],
    ["kettuvallam", "Kettuvallam Private Houseboat", "luxury", "Alleppey", 18000, "A private rice-barge houseboat with a chef.", ["Private crew", "On-board chef", "Sunset deck"]],
  ],
  ladakh: [
    ["old-leh-guesthouse", "Old Leh Guesthouse", "comfort", "Leh", 3500, "A family-run mud-brick house below the palace.", ["Rooftop views", "Butter tea", "Acclimatisation friendly"]],
    ["indus-camp", "Indus Valley Camp", "premium", "Nimmu", 6500, "Deluxe tents on the river confluence.", ["Riverside", "Bonfire nights", "Rafting access"]],
    ["pangong-pods", "Pangong Glass Pods", "luxury", "Pangong", 14000, "Heated glass pods facing the lake.", ["Lake views", "Heated floors", "Stargazing roof"]],
  ],
  meghalaya: [
    ["cloud-village", "Cloud Village Homestay", "comfort", "Mawlynnong", 2800, "Bamboo rooms in Asia's cleanest village.", ["Village meals", "Sky-walk access", "Garden"]],
    ["pine-ridge", "Pine Ridge Cottages", "premium", "Shillong", 5200, "Stone cottages in a pine forest.", ["Forest trails", "Fireplaces", "Live-music nights"]],
    ["sohra-cliff", "Sohra Cliff Lodge", "luxury", "Sohra", 11000, "Glass-fronted rooms on the plateau edge.", ["Canyon views", "Waterfall walks", "Chef dinners"]],
  ],
  maldives: [
    ["maafushi", "Maafushi Island Guesthouse", "comfort", "Maafushi", 12000, "A guesthouse on a local island.", ["Bikini beach", "Excursion desk", "Local cafés"]],
    ["lagoon-villas", "Lagoon Beach Villas", "premium", "North Malé Atoll", 28000, "Beach villas stepping into the lagoon.", ["Beachfront", "House reef", "Speedboat transfer"]],
    ["horizon-overwater", "Horizon Overwater Villas", "luxury", "South Ari Atoll", 65000, "Overwater villas with glass floors.", ["Glass floors", "Private pool", "Seaplane transfer"]],
  ],
};

/** The flagship "Walk Before You Book" environment for Casa Maré. */
export const casaMareSpaces: StaySpace[] = [
  {
    id: "surroundings",
    name: "Surroundings",
    caption: "The whole property, from above",
    description: "A clifftop in Cola, South Goa: palm grove, private cove and a sunset line uninterrupted to the horizon.",
    features: ["Private cove access", "4 min to Cola beach lagoon", "West-facing for sunsets"],
    camera: { position: [30, 22, 30], target: [0, 0, -6] },
  },
  {
    id: "lobby",
    name: "Lobby",
    caption: "Arrive into open air",
    description: "An open pavilion under a floating roof. No walls between check-in and the sea breeze.",
    features: ["Open-air pavilion", "Welcome kokum sherbet", "Sea views from arrival"],
    camera: { position: [-17.3, 1.75, 7.4], target: [-5, 1.1, -8] },
  },
  {
    id: "room",
    name: "Sea-view room",
    caption: "Wake up facing west",
    description: "Floor-to-ceiling glass, a king bed aligned to the horizon and linen in the colour of wet sand.",
    features: ["King bed facing the sea", "42 m² with rain shower", "Floor-to-ceiling glass"],
    camera: { position: [15, 6.0, 6.9], target: [15, 5.3, -10] },
  },
  {
    id: "balcony",
    name: "Balcony",
    caption: "Your private edge",
    description: "A deep balcony with daybed and glass balustrade — the pool below, the sea beyond.",
    features: ["Daybed for two", "Glass balustrade", "Pool and sea views"],
    camera: { position: [15.4, 6.1, 0.1], target: [3, 0.6, -12] },
  },
  {
    id: "pool",
    name: "Infinity pool",
    caption: "Where the water meets the water",
    description: "A 16-metre infinity edge that disappears into the Arabian Sea at golden hour.",
    features: ["16 m infinity edge", "Sun loungers", "Poolside service"],
    camera: { position: [6, 1.4, -3.2], target: [-4, 0.4, -16] },
  },
  {
    id: "restaurant",
    name: "Beach pavilion",
    caption: "Dinner with your feet in the sand",
    description: "A timber pergola on the sand, lit by strings of warm bulbs. Coastal Goan, cooked over coconut husk.",
    features: ["Chef's table for 8", "Open-fire kitchen", "Sunset seating"],
    camera: { position: [-8.4, 1.65, -14.1], target: [-3, 1.1, -24] },
  },
];

export const stays: Stay[] = Object.entries(seeds).flatMap(([destinationId, list]) =>
  list.map(([id, name, tier, area, nightlyEstimate, description, highlights]) => ({
    id,
    destinationId,
    name,
    tier,
    area,
    nightlyEstimate,
    description,
    highlights,
    ...(id === "casa-mare" ? { explorable: true, spaces: casaMareSpaces } : {}),
  })),
);

export const FLAGSHIP_STAY_ID = "casa-mare";
