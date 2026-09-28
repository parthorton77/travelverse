import { departureCities } from "@/data/cities";
import { destinations } from "@/data/destinations";
import type { IntentSignal, Interest, ParsedIntent, Travelers } from "@/lib/types";
import { formatINR } from "@/lib/format";

/**
 * Local, deterministic natural-language intent parser.
 *
 * It stands in for an LLM function-calling step: free text in, structured
 * TripRequest fields out, plus the exact phrases that produced each field so
 * the UI can show what it "understood". Swapping in a real model only needs to
 * return the same `ParsedIntent` shape.
 */

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
};

const INTEREST_PATTERNS: [Interest, RegExp][] = [
  ["beach", /\b(beach(?:es)?|seaside|coast(?:al)?|ocean|sea\b|sand)/i],
  ["adventure", /\b(adventur\w*|trek\w*|hik(?:e|ing)|raft\w*|scuba|div(?:e|ing)|surf\w*|thrill\w*|adrenaline|paraglid\w*|skydiv\w*)/i],
  ["luxury", /\b(luxur\w*|premium|5[- ]?star|five[- ]star|splurge|indulg\w*|lavish|fancy)/i],
  ["food", /\b(food\w*|cuisine|eat(?:ing)?|restaurants?|street food|culinary|gourmet)/i],
  ["culture", /\b(cultur\w*|histor\w*|heritage|museums?|temples?|architecture|art\b|forts?|palaces?)/i],
  ["nature", /\b(nature|wildlife|forests?|waterfalls?|lakes?|greenery|scenic|national park)/i],
  ["nightlife", /\b(nightlife|part(?:y|ies)|clubs?|bars?|pubs?|night ?out)/i],
  ["relaxation", /\b(relax\w*|chill\w*|unwind|slow|peaceful|calm|quiet|laid[- ]back)/i],
  ["mountains", /\b(mountains?|hills?|snow|himalaya\w*|alps|alpine)/i],
  ["hidden-gems", /\b(hidden gems?|offbeat|off[- ]beat|less crowded|undiscovered|secret|unexplored)/i],
  ["wellness", /\b(spa|wellness|yoga|ayurved\w*|retreat|detox)/i],
  ["shopping", /\b(shopping|markets?|souks?|bazaars?)/i],
];

const DESTINATION_ALIASES: Record<string, string[]> = {
  goa: ["goa", "south goa", "north goa"],
  rajasthan: ["rajasthan", "udaipur", "jodhpur", "jaisalmer", "jaipur"],
  dubai: ["dubai", "uae", "emirates"],
  paris: ["paris", "france"],
  tokyo: ["tokyo", "japan"],
  bali: ["bali", "ubud", "indonesia"],
  switzerland: ["switzerland", "swiss", "interlaken", "zurich"],
  "new-york": ["new york", "nyc", "manhattan"],
  kerala: ["kerala", "munnar", "alleppey", "alappuzha"],
  ladakh: ["ladakh", "leh", "pangong"],
  meghalaya: ["meghalaya", "shillong", "cherrapunji", "sohra"],
  maldives: ["maldives"],
};

export const INTEREST_LABELS: Record<Interest, string> = {
  beach: "Beach",
  adventure: "Adventure",
  luxury: "Luxury",
  food: "Food",
  culture: "Culture",
  nature: "Nature",
  nightlife: "Nightlife",
  relaxation: "Relaxation",
  mountains: "Mountains",
  "hidden-gems": "Hidden gems",
  wellness: "Wellness",
  shopping: "Shopping",
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseAmount(raw: string, unit: string | undefined): number {
  const value = parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(value)) return NaN;
  const u = (unit ?? "").toLowerCase();
  if (u === "k" || u === "thousand") return value * 1000;
  if (u.startsWith("l")) return value * 100000;
  return value;
}

function parseBudget(text: string): { amount: number; match: string } | null {
  const patterns = [
    /(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|l)?\b/i,
    /\b([\d,]+(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?)\b/i,
    /\bbudget\s*(?:of|is|around|~)?\s*([\d,]+(?:\.\d+)?)\s*(k|lakhs?|l)?\b/i,
    /\b([\d,]{5,})\s*(?:rupees|inr|rs)\b/i,
    // A bare 5–7 digit amount ("20000", "1,20,000") that isn't a distance or duration.
    /\b(\d{1,3}(?:,\d{2,3})+|\d{5,7})\b(?!\s*(?:km|kms|miles|m\b|days?|nights?|people|of us))/i,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (!m) continue;
    const amount = parseAmount(m[1], m[2]);
    if (Number.isFinite(amount) && amount >= 1000) return { amount, match: m[0].trim() };
  }
  return null;
}

function parseDays(text: string): { days: number; match: string } | null {
  const numeric = /\b(\d{1,2})\s*[- ]?\s*(days?|nights?)\b/i.exec(text);
  if (numeric) {
    const n = parseInt(numeric[1], 10);
    const days = numeric[2].toLowerCase().startsWith("night") ? n + 1 : n;
    return { days, match: numeric[0] };
  }
  const worded = new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join("|")})\\s*[- ]?\\s*(days?|nights?)\\b`, "i").exec(text);
  if (worded) {
    const n = NUMBER_WORDS[worded[1].toLowerCase()];
    return { days: worded[2].toLowerCase().startsWith("night") ? n + 1 : n, match: worded[0] };
  }
  const weeks = /\b(a|one|two|2)\s+weeks?\b/i.exec(text);
  if (weeks) return { days: /two|2/i.test(weeks[1]) ? 14 : 7, match: weeks[0] };
  const longWeekend = /\blong weekend\b/i.exec(text);
  if (longWeekend) return { days: 4, match: longWeekend[0] };
  const weekend = /\bweekend\b/i.exec(text);
  if (weekend) return { days: 3, match: weekend[0] };
  return null;
}

function parseTravelers(text: string): { travelers: Travelers; match: string } | null {
  const familyOf = /\bfamily of (\d|\w+)\b/i.exec(text);
  if (familyOf) {
    const n = parseInt(familyOf[1], 10) || NUMBER_WORDS[familyOf[1].toLowerCase()] || 4;
    return { travelers: { type: "family", adults: Math.min(2, n), children: Math.max(0, n - 2) }, match: familyOf[0] };
  }
  const kids = /\b(?:with )?(?:my |our )?(\d|two|three)?\s*(kids|children|son|daughter)\b/i.exec(text);
  if (kids) {
    const k = parseInt(kids[1] ?? "", 10) || NUMBER_WORDS[(kids[1] ?? "").toLowerCase()] || (/son|daughter/i.test(kids[2]) ? 1 : 2);
    return { travelers: { type: "family", adults: 2, children: k }, match: kids[0].trim() };
  }
  const couple = /\b(couple|honeymoon|anniversary|my (?:wife|husband|partner|girlfriend|boyfriend|fianc[ée]e?))\b/i.exec(text);
  if (couple) return { travelers: { type: "couple", adults: 2, children: 0 }, match: couple[0] };
  const solo = /\b(solo|alone|by myself|just me)\b/i.exec(text);
  if (solo) return { travelers: { type: "solo", adults: 1, children: 0 }, match: solo[0] };
  const group = /\b(\d{1,2})\s*(?:of us|people|friends|adults|travell?ers|pax)\b/i.exec(text);
  if (group) {
    const n = Math.max(1, Math.min(12, parseInt(group[1], 10)));
    const type = n === 1 ? "solo" : n === 2 ? "couple" : "friends";
    return { travelers: { type, adults: n, children: 0 }, match: group[0] };
  }
  const friends = /\b(friends|group|gang|squad)\b/i.exec(text);
  if (friends) return { travelers: { type: "friends", adults: 4, children: 0 }, match: friends[0] };
  return null;
}

function cityPattern(names: string[]) {
  return names.map(escapeRegExp).join("|");
}

function parseDeparture(text: string): { cityId: string; match: string } | null {
  for (const city of departureCities) {
    const names = [city.name, ...(city.aliases ?? [])];
    const re = new RegExp(`\\b(?:from|leaving|departing|flying out of|based in|live in)\\s+(${cityPattern(names)})\\b`, "i");
    const m = re.exec(text);
    if (m) return { cityId: city.id, match: m[0] };
  }
  return null;
}

function parseDestination(text: string, departureMatch?: string): { destinationId: string; match: string } | null {
  const scrubbed = departureMatch ? text.replace(departureMatch, " ") : text;
  for (const [id, aliases] of Object.entries(DESTINATION_ALIASES)) {
    const m = new RegExp(`\\b(${cityPattern(aliases)})\\b`, "i").exec(scrubbed);
    if (m && destinations.some((d) => d.id === id)) return { destinationId: id, match: m[0] };
  }
  return null;
}

const TRAVELER_LABEL: Record<Travelers["type"], string> = {
  solo: "Solo",
  couple: "Couple",
  family: "Family",
  friends: "Friends",
};

export function travelerCount(t: Travelers): number {
  return Math.max(1, t.adults + t.children);
}

export function describeTravelers(t: Travelers): string {
  const n = travelerCount(t);
  return `${TRAVELER_LABEL[t.type]} · ${n} ${n === 1 ? "traveller" : "travellers"}`;
}

export function parseIntent(prompt: string): ParsedIntent {
  const text = (prompt ?? "").slice(0, 600);
  const signals: IntentSignal[] = [];
  const result: ParsedIntent = { interests: [], signals };
  if (!text.trim()) return result;

  const budget = parseBudget(text);
  if (budget) {
    result.budget = Math.round(budget.amount);
    signals.push({ field: "budget", label: `Budget ${formatINR(result.budget)}`, match: budget.match });
  }

  const days = parseDays(text);
  if (days) {
    result.days = Math.max(1, Math.min(21, days.days));
    signals.push({ field: "days", label: `${result.days} days`, match: days.match });
  }

  const travelers = parseTravelers(text);
  if (travelers) {
    result.travelers = travelers.travelers;
    signals.push({ field: "travelers", label: describeTravelers(travelers.travelers), match: travelers.match });
  }

  const departure = parseDeparture(text);
  if (departure) {
    result.departureCityId = departure.cityId;
    const city = departureCities.find((c) => c.id === departure.cityId);
    signals.push({ field: "departure", label: `From ${city?.name ?? departure.cityId}`, match: departure.match });
  }

  const destination = parseDestination(text, departure?.match);
  if (destination) {
    result.destinationId = destination.destinationId;
    const d = destinations.find((x) => x.id === destination.destinationId);
    signals.push({ field: "destination", label: `Destination ${d?.name ?? destination.destinationId}`, match: destination.match });
  }

  for (const [interest, pattern] of INTEREST_PATTERNS) {
    const m = pattern.exec(text);
    if (m) {
      result.interests.push(interest);
      signals.push({ field: "interests", label: INTEREST_LABELS[interest], match: m[0] });
    }
  }

  return result;
}
