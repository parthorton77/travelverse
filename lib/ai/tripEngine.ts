import { DEFAULT_DEPARTURE_ID, departureCities } from "@/data/cities";
import { destinations as allDestinations } from "@/data/destinations";
import { dining as allDining, experiences as allExperiences } from "@/data/experiences";
import { stays as allStays } from "@/data/hotels";
import { DEFAULT_DNA, DNA_META, dnaSimilarity, getPersona, matchPercent, sanitizeDNA } from "@/lib/dna";
import { formatDuration, formatINR, pad2 } from "@/lib/format";
import { haversineKm } from "@/lib/geo/land";
import { INTEREST_LABELS, travelerCount } from "@/lib/ai/parseIntent";
import type {
  BudgetLine,
  City,
  DayPlan,
  Destination,
  Dining,
  Experience,
  ExperienceKind,
  GeneratedTrip,
  Interest,
  ItineraryItem,
  JourneyStop,
  Stay,
  StayTier,
  TimeOfDay,
  TransportPlan,
  TravelDNA,
  TripAlternative,
  TripRequest,
} from "@/lib/types";

/**
 * TravelVerse mock journey engine ("tv-mock-1").
 *
 * Deterministic and dependency-free: it scores destinations against intent,
 * Travel DNA, budget and duration, then optimises stay tier vs. experiences
 * to fit the budget, and composes a day-by-day itinerary plus a journey
 * timeline. A production engine would replace the scoring with a model and
 * the cost tables with live supply — the output contract stays the same.
 */

export const ENGINE_VERSION = "tv-mock-1";

export interface EngineCatalogue {
  destinations: Destination[];
  experiences: Experience[];
  dining: Dining[];
  stays: Stay[];
  cities: City[];
}

const defaultCatalogue: EngineCatalogue = {
  destinations: allDestinations,
  experiences: allExperiences,
  dining: allDining,
  stays: allStays,
  cities: departureCities,
};

const TIER_ORDER: StayTier[] = ["comfort", "premium", "luxury"];
const TIER_LABEL: Record<StayTier, string> = { comfort: "Comfort", premium: "Premium", luxury: "Luxury" };
const TIER_VALUE: Record<StayTier, number> = { comfort: 0, premium: 0.6, luxury: 1 };

// ── Normalisation ─────────────────────────────────────────────────────────────

export function normalizeRequest(req: Partial<TripRequest>): TripRequest {
  const adults = Math.max(1, Math.min(12, Math.round(req.travelers?.adults ?? 2)));
  const children = Math.max(0, Math.min(8, Math.round(req.travelers?.children ?? 0)));
  return {
    prompt: String(req.prompt ?? "").slice(0, 600),
    budget: Math.max(5000, Math.min(5_000_000, Math.round(Number(req.budget) || 75000))),
    days: Math.max(2, Math.min(14, Math.round(Number(req.days) || 5))),
    travelers: { type: req.travelers?.type ?? (adults === 1 ? "solo" : "couple"), adults, children },
    departureCityId: req.departureCityId || DEFAULT_DEPARTURE_ID,
    interests: Array.isArray(req.interests) ? [...new Set(req.interests)].slice(0, 8) : [],
    destinationId: req.destinationId || undefined,
    dna: sanitizeDNA(req.dna),
  };
}

// ── Cost model ────────────────────────────────────────────────────────────────

export function estimateTransport(from: City, dest: Destination): TransportPlan {
  const distanceKm = Math.round(haversineKm(from.coordinates, dest.coordinates));
  const domestic = dest.region === "india";
  if (domestic && distanceKm < 650) {
    return {
      mode: "train",
      from,
      toCode: dest.airportCode,
      distanceKm,
      durationHours: distanceKm / 62 + 0.5,
      stops: 0,
      farePerPerson: roundTo(2 * (600 + distanceKm * 1.4), 100),
    };
  }
  const base = domestic ? 3500 + distanceKm * 4.4 : 9000 + distanceKm * 6.2;
  const stops = distanceKm > 5200 ? 1 : 0;
  return {
    mode: "flight",
    from,
    toCode: dest.airportCode,
    distanceKm,
    durationHours: distanceKm / 800 + 0.35 + stops * 2.5,
    stops,
    farePerPerson: roundTo(base * (dest.costs.fareModifier ?? 1), 100),
  };
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

function roomsFor(req: TripRequest) {
  return Math.max(1, Math.ceil(req.travelers.adults / 2));
}

interface CostBreakdown {
  transport: number;
  stay: number;
  food: number;
  local: number;
  experiences: number;
  total: number;
}

function costFor(dest: Destination, stay: Stay, tier: StayTier, transport: TransportPlan, req: TripRequest, picked: Experience[]): CostBreakdown {
  const people = travelerCount(req.travelers);
  const nights = req.days - 1;
  const transportCost = transport.farePerPerson * people;
  const stayCost = stay.nightlyEstimate * nights * roomsFor(req);
  const food = dest.costs.food[tier] * req.days * people;
  const local = dest.costs.localTransport * req.days * Math.max(1, Math.ceil(people / 4));
  const experiences = picked.reduce((s, e) => s + e.costPerPerson * people, 0);
  return { transport: transportCost, stay: stayCost, food, local, experiences, total: transportCost + stayCost + food + local + experiences };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const INTEREST_TO_DNA: Partial<Record<Interest, keyof TravelDNA>> = {
  adventure: "adventure",
  luxury: "luxury",
  food: "food",
  culture: "culture",
  nature: "nature",
  nightlife: "nightlife",
  relaxation: "relaxation",
};

function interestAffinity(dest: Destination, interest: Interest): number {
  switch (interest) {
    case "beach":
      return dest.categories.includes("beach") ? 1 : 0.1;
    case "mountains":
      return dest.categories.includes("mountains") ? 1 : dest.dna.nature / 250;
    case "hidden-gems":
      return dest.categories.includes("hidden-gems") ? 1 : 0.15;
    case "wellness":
      return (dest.dna.relaxation * 0.6 + dest.dna.luxury * 0.4) / 100;
    case "shopping":
      return dest.categories.includes("city") ? 0.9 : 0.45;
    default: {
      const dim = INTEREST_TO_DNA[interest];
      return dim ? dest.dna[dim] / 100 : 0.5;
    }
  }
}

function experienceRelevance(exp: Experience, req: TripRequest, dna: TravelDNA): number {
  const wanted = req.interests;
  const overlap = wanted.length ? exp.tags.filter((t) => wanted.includes(t)).length / wanted.length : 0.3;
  const dnaFit =
    exp.tags.reduce((s, t) => {
      const dim = INTEREST_TO_DNA[t];
      if (dim) return s + dna[dim] / 100;
      if (t === "beach") return s + dna.relaxation / 140;
      if (t === "mountains") return s + dna.nature / 110;
      if (t === "wellness") return s + dna.relaxation / 120;
      return s + 0.4;
    }, 0) / Math.max(1, exp.tags.length);
  return overlap * 0.6 + dnaFit * 0.4 + (exp.signature ? 0.05 : 0);
}

interface DestinationScore {
  dest: Destination;
  score: number;
  interest: number;
  dna: number;
  budgetFit: number;
  durationFit: number;
  leanCost: number;
}

function scoreDestination(dest: Destination, req: TripRequest, dna: TravelDNA, cat: EngineCatalogue, from: City): DestinationScore {
  const interest = req.interests.length
    ? req.interests.reduce((s, i) => s + interestAffinity(dest, i), 0) / req.interests.length
    : 0.55;
  const dnaScore = dnaSimilarity(dna, dest.dna);
  const transport = estimateTransport(from, dest);
  const comfort = cat.stays.find((s) => s.destinationId === dest.id && s.tier === "comfort");
  const leanCost = comfort ? costFor(dest, comfort, "comfort", transport, req, []).total : Infinity;
  const budgetFit = leanCost <= req.budget ? 1 : Math.max(0, 1 - ((leanCost - req.budget) / req.budget) * 1.6);
  const [min, max] = dest.idealDays;
  const gap = req.days < min ? min - req.days : req.days > max ? req.days - max : 0;
  const durationFit = Math.max(0, 1 - gap * 0.14);
  // Over-budget destinations are penalised multiplicatively: great taste can't outrun the wallet.
  const score = (interest * 0.42 + dnaScore * 0.23 + budgetFit * 0.25 + durationFit * 0.1) * (0.4 + 0.6 * budgetFit);
  return { dest, score, interest, dna: dnaScore, budgetFit, durationFit, leanCost };
}

// ── Experience selection & budget optimisation ────────────────────────────────

interface Plan {
  tier: StayTier;
  stay: Stay;
  arrival: Experience | null;
  heroes: (Experience | null)[];
  evenings: Experience[];
  cost: CostBreakdown;
  utility: number;
  fits: boolean;
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a);
  const inter = b.filter((x) => A.has(x)).length;
  return inter / (new Set([...a, ...b]).size || 1);
}

function selectExperiences(pool: Experience[], req: TripRequest, dna: TravelDNA) {
  const rel = new Map(pool.map((e) => [e.id, experienceRelevance(e, req, dna)]));
  const byRel = [...pool].sort((a, b) => (rel.get(b.id) ?? 0) - (rel.get(a.id) ?? 0));
  const middleDays = Math.max(0, req.days - 2);

  const arrival =
    byRel.find((e) => e.arrivalFriendly && e.slot === "evening") ?? byRel.find((e) => e.slot === "evening") ?? null;

  // Pick one hero experience per full day, rewarding variety and uncovered interests.
  const heroes: Experience[] = [];
  const covered = new Set<Interest>();
  const candidates = byRel.filter((e) => e.slot !== "evening" && e.id !== arrival?.id);
  for (let d = 0; d < middleDays; d++) {
    let best: Experience | null = null;
    let bestScore = -Infinity;
    for (const e of candidates) {
      if (heroes.includes(e)) continue;
      const sameKind = heroes.filter((h) => h.kind === e.kind).length;
      const similarity = heroes.reduce((m, h) => Math.max(m, jaccard(h.tags, e.tags)), 0);
      const coverage = e.tags.some((t) => req.interests.includes(t) && !covered.has(t)) ? 0.25 : 0;
      const s = (rel.get(e.id) ?? 0) * Math.pow(0.75, sameKind) * (1 - 0.3 * similarity) + coverage;
      if (s > bestScore) {
        bestScore = s;
        best = e;
      }
    }
    if (!best) break;
    heroes.push(best);
    best.tags.forEach((t) => covered.add(t));
  }

  const wantsEvenings = ["nightlife", "food", "luxury"].some((i) => req.interests.includes(i as Interest)) || dna.nightlife > 55;
  const eveningQuota = Math.min(middleDays, 1 + (wantsEvenings ? 1 : 0) + (middleDays >= 4 ? 1 : 0));
  const evenings = byRel.filter((e) => e.slot === "evening" && e.id !== arrival?.id).slice(0, eveningQuota);

  // A requested luxury should survive: make sure one luxury moment is in the plan.
  const wantsLuxury = req.interests.includes("luxury");
  let protectedId: string | null = null;
  if (wantsLuxury && middleDays > 0) {
    const inPlan = [...heroes, ...evenings].find((e) => e.tags.includes("luxury"));
    const best = inPlan ?? byRel.find((e) => e.tags.includes("luxury"));
    if (best && !inPlan) {
      if (best.slot === "evening") evenings.splice(Math.max(0, evenings.length - 1), 1, best);
      else if (heroes.length) heroes.splice(heroes.length - 1, 1, best);
    }
    protectedId = best?.id ?? null;
  }

  return { arrival, heroes, evenings, rel, protectedId };
}

function planForDestination(dest: Destination, req: TripRequest, dna: TravelDNA, cat: EngineCatalogue, transport: TransportPlan): Plan {
  const pool = cat.experiences.filter((e) => e.destinationId === dest.id);
  const { arrival, heroes, evenings, rel, protectedId } = selectExperiences(pool, req, dna);
  const luxPref = (req.interests.includes("luxury") ? 0.6 : 0) + (dna.luxury / 100) * 0.4;

  const plans: Plan[] = [];
  for (const tier of TIER_ORDER) {
    const stay = cat.stays.find((s) => s.destinationId === dest.id && s.tier === tier);
    if (!stay) continue;
    let a: Experience | null = arrival;
    const h: (Experience | null)[] = [...heroes];
    let ev = [...evenings];
    const picked = () => [a, ...h, ...ev].filter((x): x is Experience => !!x);
    let cost = costFor(dest, stay, tier, transport, req, picked());
    let dropped = 0;

    // Trim the least valuable spend first until the plan fits.
    while (cost.total > req.budget) {
      const paid = picked().filter((e) => e.costPerPerson > 0);
      if (!paid.length) break;
      const candidates = paid.filter((e) => e.id !== protectedId);
      const victimPool = candidates.length ? candidates : paid;
      const victim = victimPool.reduce((worst, e) =>
        e.costPerPerson / (rel.get(e.id) ?? 0.1) > worst.costPerPerson / (rel.get(worst.id) ?? 0.1) ? e : worst,
      );
      const free = pool.find(
        (e) => e.costPerPerson === 0 && e.slot === victim.slot && !picked().includes(e),
      );
      if (a?.id === victim.id) a = free ?? null;
      else if (ev.some((e) => e.id === victim.id)) ev = ev.filter((e) => e.id !== victim.id).concat(free ? [free] : []);
      else {
        const i = h.findIndex((e) => e?.id === victim.id);
        if (i >= 0) h[i] = free ?? null;
      }
      if (!free) dropped++;
      cost = costFor(dest, stay, tier, transport, req, picked());
    }

    const relSum = picked().reduce((s, e) => s + (rel.get(e.id) ?? 0), 0);
    const utility = TIER_VALUE[tier] * (0.5 + luxPref) + relSum * 0.35 - dropped * 0.25;
    plans.push({ tier, stay, arrival: a, heroes: h, evenings: ev, cost, utility, fits: cost.total <= req.budget });
  }

  const fitting = plans.filter((p) => p.fits);
  if (fitting.length) return fitting.reduce((best, p) => (p.utility > best.utility ? p : best));
  return plans.reduce((best, p) => (p.cost.total < best.cost.total ? p : best));
}

// ── Itinerary & journey composition ───────────────────────────────────────────

const SLOT_TIME: Record<Experience["slot"], string> = {
  morning: "09:00",
  afternoon: "14:30",
  "full-day": "08:30",
  evening: "18:00",
};

const DAY_THEME: Record<ExperienceKind, string> = {
  beach: "Beach Day",
  water: "On the Water",
  island: "Island Exploration",
  culture: "Culture & Heritage",
  food: "Food Trail",
  nature: "Into Nature",
  adventure: "Adventure Day",
  nightlife: "After Dark",
  wellness: "Slow & Restore",
  luxury: "Luxury Experience",
  city: "City Day",
  desert: "Desert Day",
  mountain: "Mountain Day",
};

const STOP_LABEL: Record<ExperienceKind, string> = {
  beach: "BEACH",
  water: "WATER",
  island: "ISLAND",
  culture: "CULTURE",
  food: "FOOD",
  nature: "NATURE",
  adventure: "ADVENTURE",
  nightlife: "NIGHT",
  wellness: "SPA",
  luxury: "LUXURY",
  city: "CITY",
  desert: "DESERT",
  mountain: "PEAKS",
};

function dayTheme(hero: Experience | null, evening: Experience | undefined, wantsLuxury: boolean): string {
  if (wantsLuxury && [hero, evening].some((e) => e?.tags.includes("luxury"))) return "Luxury Experience";
  if (!hero) return evening ? DAY_THEME[evening.kind] : "Unplanned, on Purpose";
  if (hero.kind === "water" && hero.tags.includes("beach") && hero.tags.includes("adventure")) return "Beach + Water Adventure";
  return DAY_THEME[hero.kind];
}

function timeOfDayFor(time: string): TimeOfDay {
  const h = parseInt(time.slice(0, 2), 10);
  if (h < 8) return "dawn";
  if (h < 16) return "day";
  if (h < 18) return "golden";
  if (h < 20) return "dusk";
  return "night";
}

function hashString(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.round(h * 60 + m + hours * 60);
  return `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
}

function composeItinerary(dest: Destination, plan: Plan, transport: TransportPlan, req: TripRequest, diningPool: Dining[]) {
  const people = travelerCount(req.travelers);
  const wantsLuxury = req.interests.includes("luxury");
  const days: DayPlan[] = [];
  const modeLabel = transport.mode === "flight" ? "Flight" : "Train";
  const route = `${transport.from.airportCode} → ${dest.airportCode}`;
  const transportDesc = `${formatDuration(transport.durationHours)} ${transport.stops ? `· ${transport.stops} stop` : "· direct"} (estimated)`;

  const departTime = transport.mode === "train" ? "21:30" : transport.durationHours > 6 ? "02:30" : "07:10";
  const arriveTime = transport.mode === "train" ? "06:45" : addHours(departTime, transport.durationHours + 0.4);
  const luxuryDining = diningPool.filter((d) => d.tier === "luxury");
  const everydayDining = diningPool.filter((d) => d.tier !== "luxury");
  const pickDining = (i: number, lux: boolean): Dining | undefined =>
    lux && luxuryDining.length ? luxuryDining[0] : everydayDining[i % Math.max(1, everydayDining.length)] ?? diningPool[0];

  // Evening experiences: luxury saved for the final full day, others spread from Day 2.
  const middleCount = Math.max(0, req.days - 2);
  const eveningByDay = new Map<number, Experience>();
  const sortedEvenings = [...plan.evenings].sort((a, b) => Number(a.tags.includes("luxury")) - Number(b.tags.includes("luxury")));
  const slots = Array.from({ length: middleCount }, (_, i) => i + 2);
  sortedEvenings.forEach((e, i) => {
    const isLux = e.tags.includes("luxury");
    const day = isLux ? slots[slots.length - 1] : slots[Math.min(i * 2, slots.length - 1)];
    if (day && !eveningByDay.has(day)) eveningByDay.set(day, e);
    else {
      const free = slots.find((d) => !eveningByDay.has(d));
      if (free) eveningByDay.set(free, e);
    }
  });

  // Heroes: most intense first while energy is high, luxury toward the end.
  const heroes = [...plan.heroes].sort((a, b) => {
    const la = a?.tags.includes("luxury") ? 1 : 0;
    const lb = b?.tags.includes("luxury") ? 1 : 0;
    if (la !== lb) return la - lb;
    return (b?.intensity ?? 0) - (a?.intensity ?? 0);
  });

  let itemId = 0;
  const id = () => `i${++itemId}`;
  const expItem = (e: Experience, time: string): ItineraryItem => ({
    id: id(),
    time,
    kind: "experience",
    title: e.title,
    description: e.description,
    location: e.location,
    cost: e.costPerPerson * people,
    experienceKind: e.kind,
  });
  const diningItem = (d: Dining, time: string, meal: string): ItineraryItem => ({
    id: id(),
    time,
    kind: "dining",
    title: `${meal}: ${d.name}`,
    description: `${d.cuisine} · ${d.description}`,
    location: d.location,
  });

  // Day 1
  const day1: ItineraryItem[] = [
    { id: id(), time: departTime, kind: "transport", title: `${modeLabel} ${route}`, description: transportDesc },
    { id: id(), time: transport.durationHours > 6 ? addHours(arriveTime, 1) : "13:30", kind: "stay", title: `Check-in · ${plan.stay.name}`, description: plan.stay.description, location: plan.stay.area },
  ];
  if (plan.arrival) day1.push(expItem(plan.arrival, plan.arrival.slot === "evening" ? "17:30" : SLOT_TIME[plan.arrival.slot]));
  const d1Dining = pickDining(0, false);
  if (d1Dining) day1.push(diningItem(d1Dining, "20:30", "Dinner"));
  days.push({
    day: 1,
    title: `${transport.from.name} → ${dest.name}`,
    theme: plan.arrival ? `Check-in · ${plan.arrival.kind === "beach" || plan.arrival.title.toLowerCase().includes("sunset") ? "Sunset experience" : plan.arrival.title}` : "Arrive & settle in",
    items: day1,
  });

  // Middle days
  for (let d = 2; d <= req.days - 1; d++) {
    const hero = heroes[d - 2] ?? null;
    const evening = eveningByDay.get(d);
    const items: ItineraryItem[] = [];
    if (hero) items.push(expItem(hero, SLOT_TIME[hero.slot]));
    else items.push({ id: id(), time: "10:00", kind: "free", title: "Unplanned, on purpose", description: `A free day to wander ${dest.name} at your own pace.` });
    if (!hero || hero.slot === "morning") {
      const lunch = pickDining(d, false);
      if (lunch) items.push(diningItem(lunch, "13:15", "Lunch"));
    }
    if (evening) items.push(expItem(evening, evening.tags.includes("luxury") ? "19:30" : "18:00"));
    if (!evening || !evening.tags.includes("food")) {
      const dinner = pickDining(d + 1, plan.tier === "luxury" && d === req.days - 1);
      if (dinner) items.push(diningItem(dinner, "20:45", "Dinner"));
    }
    days.push({ day: d, title: dayTheme(hero, evening, wantsLuxury), theme: [hero?.title, evening?.title].filter(Boolean).join(" · ") || "Free day", items });
  }

  // Last day
  const lastDepart = transport.mode === "train" ? "19:40" : transport.durationHours > 6 ? "21:30" : "15:20";
  days.push({
    day: req.days,
    title: `${dest.name} → ${transport.from.name}`,
    theme: "Slow morning · Departure",
    items: [
      { id: id(), time: "09:30", kind: "free", title: "Slow breakfast & check-out", description: "One last look at the view before you go." },
      { id: id(), time: lastDepart, kind: "transport", title: `${modeLabel} ${dest.airportCode} → ${transport.from.airportCode}`, description: transportDesc },
    ],
  });

  return days;
}

function composeJourney(dest: Destination, plan: Plan, transport: TransportPlan, req: TripRequest, days: DayPlan[]): JourneyStop[] {
  const stops: JourneyStop[] = [];
  const home = transport.from;
  const first = days[0]?.items[0];
  const modeIsFlight = transport.mode === "flight";
  stops.push({
    id: "home",
    kind: "home",
    label: home.name.toUpperCase(),
    title: `Leave ${home.name}`,
    subtitle: `Day 01 · ${first?.time ?? "07:00"}`,
    description: `Bags packed. ${req.travelers.type === "couple" ? "Two" : "Everyone"} ready. The journey starts at your front door.`,
    day: 1,
    time: first?.time,
    timeOfDay: modeIsFlight ? "dawn" : "night",
    tips: [`${formatDuration(transport.durationHours)} door to ${modeIsFlight ? "gate" : "platform"} — leave ${modeIsFlight ? "2h" : "45m"} early.`],
  });
  stops.push({
    id: "transit-out",
    kind: modeIsFlight ? "flight" : "train",
    label: modeIsFlight ? "FLIGHT" : "TRAIN",
    title: `${home.airportCode} → ${dest.airportCode}`,
    subtitle: `${formatDuration(transport.durationHours)} · ${transport.stops ? `${transport.stops} stop` : "direct"} · estimated`,
    description: modeIsFlight
      ? `${transport.distanceKm.toLocaleString("en-IN")} km over the ${dest.region === "india" ? "subcontinent" : "curve of the Earth"}. Window seat, left side.`
      : `An overnight rail journey — ${transport.distanceKm.toLocaleString("en-IN")} km while you sleep.`,
    day: 1,
    duration: formatDuration(transport.durationHours),
    cost: transport.farePerPerson * travelerCount(req.travelers),
    timeOfDay: modeIsFlight ? "day" : "night",
  });
  stops.push({
    id: "arrival",
    kind: "arrival",
    label: dest.name.toUpperCase(),
    title: `Arrive in ${dest.name}`,
    subtitle: dest.tagline,
    description: dest.description,
    day: 1,
    timeOfDay: "day",
  });
  stops.push({
    id: "hotel",
    kind: "hotel",
    label: "HOTEL",
    title: plan.stay.name,
    subtitle: `${TIER_LABEL[plan.tier]} · ${plan.stay.area}`,
    description: plan.stay.description,
    day: 1,
    cost: plan.cost.stay,
    tips: plan.stay.highlights,
    timeOfDay: "golden",
  });

  let restaurantAdded = false;
  for (const day of days) {
    for (const item of day.items) {
      if (item.kind === "experience" && item.experienceKind) {
        stops.push({
          id: `stop-${item.id}`,
          kind: item.experienceKind,
          label: STOP_LABEL[item.experienceKind],
          title: item.title,
          subtitle: `Day ${pad2(day.day)} · ${item.time}${item.location ? ` · ${item.location}` : ""}`,
          description: item.description,
          day: day.day,
          time: item.time,
          cost: item.cost,
          timeOfDay: timeOfDayFor(item.time),
        });
      } else if (item.kind === "dining" && !restaurantAdded && day.day > 1 && (day.day >= Math.ceil(req.days / 2) || item.title.includes("Dinner"))) {
        restaurantAdded = true;
        stops.push({
          id: `stop-${item.id}`,
          kind: "food",
          label: "RESTAURANT",
          title: item.title.replace(/^(Lunch|Dinner): /, ""),
          subtitle: `Day ${pad2(day.day)} · ${item.time}${item.location ? ` · ${item.location}` : ""}`,
          description: item.description,
          day: day.day,
          time: item.time,
          timeOfDay: timeOfDayFor(item.time),
        });
      }
    }
  }

  const lastDay = days[days.length - 1];
  const returnLeg = lastDay?.items.find((i) => i.kind === "transport");
  stops.push({
    id: "departure",
    kind: "airport",
    label: modeIsFlight ? "AIRPORT" : "STATION",
    title: `${dest.airportCode} → ${home.airportCode}`,
    subtitle: `Day ${pad2(req.days)} · ${returnLeg?.time ?? ""}`,
    description: "Check-out, one last coffee, and the long look back.",
    day: req.days,
    time: returnLeg?.time,
    timeOfDay: "day",
  });
  stops.push({
    id: "home-return",
    kind: "home",
    label: home.name.toUpperCase(),
    title: "Home",
    subtitle: "Back with stories",
    description: `${plan.heroes.filter(Boolean).length + plan.evenings.length + (plan.arrival ? 1 : 0)} experiences, ${req.days - 1} nights, and a camera roll to sort through.`,
    day: req.days,
    timeOfDay: "dusk",
  });
  return stops;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateTrip(input: Partial<TripRequest>, catalogue: EngineCatalogue = defaultCatalogue): GeneratedTrip {
  const req = normalizeRequest(input);
  const dna = req.dna ?? DEFAULT_DNA;
  const from = catalogue.cities.find((c) => c.id === req.departureCityId) ?? catalogue.cities[0];

  const scores = catalogue.destinations
    .map((d) => scoreDestination(d, req, dna, catalogue, from))
    .sort((a, b) => b.score - a.score);
  if (!scores.length) throw new Error("Destination catalogue is empty");

  const forced = req.destinationId ? scores.find((s) => s.dest.id === req.destinationId) : undefined;
  // If nothing is affordable, the most useful answer is the leanest option, not the dreamiest.
  const anyAffordable = scores.some((s) => s.budgetFit > 0);
  const leanest = scores.reduce((best, s) => (s.leanCost < best.leanCost ? s : best));
  const chosen = forced ?? (anyAffordable ? scores[0] : leanest);
  const dest = chosen.dest;
  const transport = estimateTransport(from, dest);
  const plan = planForDestination(dest, req, dna, catalogue, transport);
  const diningPool = catalogue.dining.filter((d) => d.destinationId === dest.id);
  const itinerary = composeItinerary(dest, plan, transport, req, diningPool);
  const journey = composeJourney(dest, plan, transport, req, itinerary);

  const persona = getPersona(dna);
  const people = travelerCount(req.travelers);
  const lines: BudgetLine[] = [
    { category: "transport", label: transport.mode === "flight" ? "Flights" : "Train", amount: plan.cost.transport },
    { category: "stay", label: `Stay · ${req.days - 1} nights`, amount: plan.cost.stay },
    { category: "experiences", label: "Experiences", amount: plan.cost.experiences },
    { category: "food", label: "Food & dining", amount: plan.cost.food },
    { category: "local", label: "Local transport", amount: plan.cost.local },
  ];

  const topInterests = req.interests.slice(0, 3).map((i) => INTEREST_LABELS[i].toLowerCase());
  const reasoning: string[] = [];
  reasoning.push(
    topInterests.length
      ? `${dest.name} is the strongest match for ${topInterests.join(" + ")} across ${catalogue.destinations.length} destinations.`
      : `${dest.name} fits your Travel DNA best across ${catalogue.destinations.length} destinations.`,
  );
  reasoning.push(`Your Travel DNA — ${persona.title} — aligns ${matchPercent(chosen.dna)}% with ${dest.name}'s character.`);
  if (plan.fits) {
    reasoning.push(
      `A ${TIER_LABEL[plan.tier].toLowerCase()} stay keeps the estimate at ${formatINR(plan.cost.total)}, ${formatINR(req.budget - plan.cost.total)} inside your ${formatINR(req.budget)}.`,
    );
  } else {
    reasoning.push(
      `Even kept lean, this runs about ${formatINR(plan.cost.total - req.budget)} over ${formatINR(req.budget)}. Fewer days or a closer destination would close the gap.`,
    );
  }
  if (transport.durationHours < 4 && transport.mode === "flight") {
    reasoning.push(`${transport.from.name} → ${dest.name} is about ${formatDuration(transport.durationHours)} by air — you land in time for the first evening.`);
  } else if (transport.mode === "train") {
    reasoning.push(`${dest.name} is close enough to go overland — an overnight train saves a day's budget for experiences.`);
  }
  const luxMoment = [...plan.evenings, ...plan.heroes].find((e) => e?.tags.includes("luxury"));
  if (req.interests.includes("luxury") && luxMoment) {
    const day = itinerary.find((d) => d.items.some((i) => i.title === luxMoment.title))?.day;
    if (day) reasoning.push(`The ${luxMoment.title.toLowerCase()} is saved for Day ${pad2(day)} — the moment the trip builds toward.`);
  }

  const alternatives: TripAlternative[] = scores
    .filter((s) => s.dest.id !== dest.id)
    .slice(0, 2)
    .map((s) => {
      const strongest = (Object.keys(DNA_META) as (keyof TravelDNA)[]).reduce((best, k) =>
        s.dest.dna[k] - dest.dna[k] > s.dest.dna[best] - dest.dna[best] ? k : best,
      );
      const cheaper = s.leanCost < chosen.leanCost * 0.85;
      return {
        destinationId: s.dest.id,
        name: s.dest.name,
        matchScore: matchPercent(s.score),
        reason: cheaper ? "Leaner on budget" : `More ${DNA_META[strongest].label.toLowerCase()}`,
      };
    });

  const nights = req.days - 1;
  const title = req.days >= 5 && dest.extendedTitle ? dest.extendedTitle : dest.name;

  return {
    id: `trip-${hashString(JSON.stringify(req))}`,
    title,
    destinationId: dest.id,
    request: req,
    days: req.days,
    nights,
    travelerCount: people,
    matchScore: matchPercent(chosen.score),
    reasoning,
    transport,
    stay: plan.stay,
    budget: { requested: req.budget, total: plan.cost.total, withinBudget: plan.fits, lines },
    itinerary,
    journey,
    experiences: [plan.arrival, ...plan.heroes, ...plan.evenings].filter((e): e is Experience => !!e),
    dining: diningPool,
    alternatives,
    engine: ENGINE_VERSION,
    disclaimer: "Demo estimates generated from sample data. Not live prices, fares or availability.",
  };
}
