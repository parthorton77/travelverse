import { DNA_DIMENSIONS, type DnaDimension, type TravelDNA, type TravelPersona } from "@/lib/types";

export const DEFAULT_DNA: TravelDNA = {
  adventure: 62,
  culture: 48,
  luxury: 55,
  nature: 58,
  food: 72,
  nightlife: 34,
  relaxation: 60,
};

interface DimensionMeta {
  label: string;
  code: string;
  color: string;
  descriptor: string;
  adjective: string;
  noun: string;
}

export const DNA_META: Record<DnaDimension, DimensionMeta> = {
  adventure: { label: "Adventure", code: "AD", color: "#e67c4f", descriptor: "How much adrenaline you want in a day", adjective: "Restless", noun: "Pathfinder" },
  culture: { label: "Culture", code: "CU", color: "#d9ba8c", descriptor: "History, art and the stories places tell", adjective: "Curious", noun: "Storyseeker" },
  luxury: { label: "Luxury", code: "LX", color: "#e8d3a6", descriptor: "Comfort, service and the finer details", adjective: "Refined", noun: "Aesthete" },
  nature: { label: "Nature", code: "NA", color: "#4aa383", descriptor: "Wild landscapes and open horizons", adjective: "Wild", noun: "Wanderer" },
  food: { label: "Food", code: "FD", color: "#e0a24a", descriptor: "Travelling through your tastebuds", adjective: "Epicurean", noun: "Gourmand" },
  nightlife: { label: "Nightlife", code: "NL", color: "#9a8fd6", descriptor: "Where the evening takes you", adjective: "Nocturnal", noun: "Night Owl" },
  relaxation: { label: "Relaxation", code: "RL", color: "#5696cc", descriptor: "Unhurried days with nowhere to be", adjective: "Unhurried", noun: "Drifter" },
};

export const DNA_PRESETS: { id: string; label: string; dna: TravelDNA }[] = [
  { id: "explorer", label: "Explorer", dna: { adventure: 90, culture: 55, luxury: 20, nature: 92, food: 45, nightlife: 20, relaxation: 30 } },
  { id: "epicure", label: "Epicure", dna: { adventure: 30, culture: 78, luxury: 60, nature: 30, food: 96, nightlife: 65, relaxation: 45 } },
  { id: "luxurist", label: "Luxurist", dna: { adventure: 25, culture: 45, luxury: 96, nature: 55, food: 70, nightlife: 40, relaxation: 92 } },
  { id: "storyseeker", label: "Storyseeker", dna: { adventure: 45, culture: 96, luxury: 50, nature: 40, food: 70, nightlife: 30, relaxation: 45 } },
];

const clamp = (v: number) => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 50));

export function sanitizeDNA(input: Partial<TravelDNA> | null | undefined): TravelDNA {
  const out = { ...DEFAULT_DNA };
  if (!input) return out;
  for (const d of DNA_DIMENSIONS) {
    if (typeof input[d] === "number") out[d] = clamp(input[d] as number);
  }
  return out;
}

/**
 * 0–1 similarity between a traveller and a destination. Dimensions the
 * traveller cares about weigh more, so a food lover is matched primarily on food.
 */
export function dnaSimilarity(user: TravelDNA, place: TravelDNA): number {
  let distance = 0;
  let weight = 0;
  for (const d of DNA_DIMENSIONS) {
    const w = 0.5 + user[d] / 100;
    distance += Math.abs(user[d] - place[d]) * w;
    weight += 100 * w;
  }
  return 1 - distance / weight;
}

/** Maps similarity to a friendlier 0–100 match percentage. */
export function matchPercent(similarity: number): number {
  return Math.round(Math.max(0, Math.min(99, 40 + similarity * 60)));
}

export function rankDimensions(dna: TravelDNA): DnaDimension[] {
  return [...DNA_DIMENSIONS].sort((a, b) => dna[b] - dna[a]);
}

export function getPersona(dna: TravelDNA): TravelPersona {
  const [primary, secondary] = rankDimensions(dna);
  const code = rankDimensions(dna)
    .slice(0, 3)
    .map((d) => `${DNA_META[d].code}${Math.round(dna[d])}`)
    .join("·");
  return {
    title: `The ${DNA_META[primary].adjective} ${DNA_META[secondary].noun}`,
    code: `TV·${code}`,
    summary: `${DNA_META[primary].descriptor}, balanced with ${DNA_META[secondary].label.toLowerCase()}.`,
    primary,
    secondary,
  };
}
