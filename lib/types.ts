/**
 * Core domain model for TravelVerse.
 *
 * These types are the contract between data, services and UI. Mock data in
 * `data/` satisfies them today; real APIs (destination CMS, hotel inventory,
 * flight search, an LLM trip planner) can satisfy them tomorrow without any
 * component changes.
 */

// ── Personalisation ───────────────────────────────────────────────────────────

export const DNA_DIMENSIONS = [
  "adventure",
  "culture",
  "luxury",
  "nature",
  "food",
  "nightlife",
  "relaxation",
] as const;

export type DnaDimension = (typeof DNA_DIMENSIONS)[number];

/** Each dimension is 0–100. */
export type TravelDNA = Record<DnaDimension, number>;

export interface TravelPersona {
  title: string;
  code: string;
  summary: string;
  primary: DnaDimension;
  secondary: DnaDimension;
}

// ── Geography ─────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface City {
  id: string;
  name: string;
  airportCode: string;
  coordinates: LatLng;
  /** Extra spellings the intent parser should recognise. */
  aliases?: string[];
}

// ── Destinations ──────────────────────────────────────────────────────────────

export const DESTINATION_CATEGORIES = [
  "beach",
  "mountains",
  "city",
  "adventure",
  "culture",
  "luxury",
  "food",
  "hidden-gems",
] as const;

export type DestinationCategory = (typeof DESTINATION_CATEGORIES)[number];

export type Interest =
  | "beach"
  | "adventure"
  | "luxury"
  | "food"
  | "culture"
  | "nature"
  | "nightlife"
  | "relaxation"
  | "mountains"
  | "hidden-gems"
  | "wellness"
  | "shopping";

export type Region = "india" | "asia" | "middle-east" | "europe" | "americas" | "indian-ocean";

export type TimeOfDay = "dawn" | "day" | "golden" | "dusk" | "night";

/** Procedural scene compositions rendered by <DestinationScene>. */
export type SceneKind =
  | "desert-city"
  | "paris"
  | "tokyo"
  | "bali"
  | "coast"
  | "rajasthan"
  | "alpine"
  | "manhattan"
  | "backwater"
  | "himalaya"
  | "highland"
  | "atoll";

export interface ScenePalette {
  skyTop: string;
  skyMid: string;
  horizon: string;
  sun: string;
  /** Colour of the nearest land layer; farther layers fade toward `horizon`. */
  land: string;
  accent: string;
  water?: string;
  time: TimeOfDay;
}

export interface SceneConfig {
  kind: SceneKind;
  palette: ScenePalette;
  /** Seed for deterministic procedural generation (SSR-safe). */
  seed: number;
}

export type ExperienceKind =
  | "beach"
  | "water"
  | "island"
  | "culture"
  | "food"
  | "nature"
  | "adventure"
  | "nightlife"
  | "wellness"
  | "luxury"
  | "city"
  | "desert"
  | "mountain";

export interface PointOfInterest {
  id: string;
  name: string;
  kind: ExperienceKind;
  description: string;
  /** Position within the destination hero scene, in percent. */
  x: number;
  y: number;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: Region;
  coordinates: LatLng;
  timezone: string;
  airportCode: string;
  tagline: string;
  description: string;
  categories: DestinationCategory[];
  dna: TravelDNA;
  idealDays: [number, number];
  bestTime: string;
  pointsOfInterest: PointOfInterest[];
  scene: SceneConfig;
  costs: {
    /** Per person per day, INR (estimate). */
    food: Record<StayTier, number>;
    /** Per travelling group per day, INR (estimate). */
    localTransport: number;
    /** Multiplier on the generic flight fare model for harder-to-reach hubs. */
    fareModifier?: number;
  };
  /** Optional title variant for longer trips, e.g. "Goa + South Goa". */
  extendedTitle?: string;
  /** Optional photography; procedural scene is used when absent or on error. */
  image?: { src: string; alt: string };
}

// ── Experiences, dining, stays ────────────────────────────────────────────────

export type DaySlot = "morning" | "afternoon" | "evening" | "full-day";

export interface Experience {
  id: string;
  destinationId: string;
  title: string;
  kind: ExperienceKind;
  tags: Interest[];
  slot: DaySlot;
  durationHours: number;
  /** INR per person (estimate). 0 means free / self-guided. */
  costPerPerson: number;
  location: string;
  description: string;
  /** 0–1: how physically intense. Used for day pacing. */
  intensity: number;
  /** Good as a first-evening activity after travel. */
  arrivalFriendly?: boolean;
  /** Surfaced in the Immersive Experiences showcase. */
  signature?: boolean;
}

export interface Dining {
  id: string;
  destinationId: string;
  name: string;
  cuisine: string;
  location: string;
  description: string;
  /** INR per person (estimate). */
  costPerPerson: number;
  tier: StayTier;
}

export type StayTier = "comfort" | "premium" | "luxury";

export type StaySpaceId = "lobby" | "room" | "balcony" | "pool" | "restaurant" | "surroundings";

export interface StaySpace {
  id: StaySpaceId;
  name: string;
  caption: string;
  description: string;
  features: string[];
  /** Camera viewpoint in the 3D stay scene: [x, y, z]. */
  camera: { position: [number, number, number]; target: [number, number, number] };
}

export interface Stay {
  id: string;
  destinationId: string;
  name: string;
  tier: StayTier;
  area: string;
  /** INR per room per night (estimate, not live). */
  nightlyEstimate: number;
  description: string;
  highlights: string[];
  /** Has a walkable 3D concept environment. */
  explorable?: boolean;
  spaces?: StaySpace[];
}

// ── Trip planning ─────────────────────────────────────────────────────────────

export type TravelerType = "solo" | "couple" | "family" | "friends";

export interface Travelers {
  type: TravelerType;
  adults: number;
  children: number;
}

export interface TripRequest {
  prompt: string;
  /** Total budget for the whole group, INR. */
  budget: number;
  days: number;
  travelers: Travelers;
  departureCityId: string;
  interests: Interest[];
  /** Force a destination (e.g. arriving from a destination page). */
  destinationId?: string;
  dna?: TravelDNA;
}

export type ParsedField = "budget" | "days" | "travelers" | "departure" | "interests" | "destination";

export interface IntentSignal {
  field: ParsedField;
  label: string;
  /** The substring of the prompt that produced this signal. */
  match: string;
}

export interface ParsedIntent {
  budget?: number;
  days?: number;
  travelers?: Travelers;
  departureCityId?: string;
  interests: Interest[];
  destinationId?: string;
  signals: IntentSignal[];
}

export type TransportMode = "flight" | "train";

export interface TransportPlan {
  mode: TransportMode;
  from: City;
  toCode: string;
  distanceKm: number;
  durationHours: number;
  stops: number;
  /** INR per person, round trip (estimate). */
  farePerPerson: number;
}

export type ItineraryItemKind = "transport" | "stay" | "experience" | "dining" | "free";

export interface ItineraryItem {
  id: string;
  time: string;
  kind: ItineraryItemKind;
  title: string;
  description: string;
  location?: string;
  /** INR total for the group (estimate). */
  cost?: number;
  experienceKind?: ExperienceKind;
}

export interface DayPlan {
  day: number;
  title: string;
  theme: string;
  items: ItineraryItem[];
}

export type JourneyStopKind =
  | "home"
  | "flight"
  | "train"
  | "arrival"
  | "hotel"
  | "airport"
  | ExperienceKind;

export interface JourneyStop {
  id: string;
  kind: JourneyStopKind;
  /** Short, uppercase label on the track, e.g. "GOA". */
  label: string;
  title: string;
  subtitle: string;
  description: string;
  day: number;
  time?: string;
  duration?: string;
  cost?: number;
  tips?: string[];
  timeOfDay: TimeOfDay;
}

export type BudgetCategory = "transport" | "stay" | "experiences" | "food" | "local";

export interface BudgetLine {
  category: BudgetCategory;
  label: string;
  amount: number;
}

export interface TripBudget {
  requested: number;
  total: number;
  withinBudget: boolean;
  lines: BudgetLine[];
}

export interface TripAlternative {
  destinationId: string;
  name: string;
  matchScore: number;
  reason: string;
}

export interface GeneratedTrip {
  id: string;
  title: string;
  destinationId: string;
  request: TripRequest;
  days: number;
  nights: number;
  travelerCount: number;
  matchScore: number;
  reasoning: string[];
  transport: TransportPlan;
  stay: Stay;
  budget: TripBudget;
  itinerary: DayPlan[];
  journey: JourneyStop[];
  experiences: Experience[];
  dining: Dining[];
  alternatives: TripAlternative[];
  engine: string;
  disclaimer: string;
}
