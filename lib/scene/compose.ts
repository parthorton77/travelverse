import type { JourneyStopKind, SceneKind, ScenePalette, TimeOfDay } from "@/lib/types";
import { lighten, mix } from "./color";
import * as S from "./shapes";

/**
 * Scene compositions: each returns an ordered stack of silhouette layers for
 * <DestinationScene>. Layer colour is derived from depth (aerial perspective),
 * so any palette — destination or time-of-day — produces a coherent image.
 */

export type StageSet = "home" | "flight" | "train" | "airport" | "hotel" | "dining" | "night-city" | "calm-water" | "sea" | "island-hop" | "dunes";
export type SceneId = SceneKind | StageSet;

export interface SceneLayer {
  key: string;
  d: string;
  fill: string;
  depth: number;
  opacity?: number;
  stroke?: number;
  /** Clip region path (e.g. above a jagged snowline for snow caps). */
  clip?: string;
}

export interface ComposedScene {
  sky: { top: string; mid: string; horizon: string };
  horizonY: number;
  sun: { x: number; y: number; r: number; color: string; moon: boolean } | null;
  stars: string | null;
  water: { top: number; color: string; highlight: string } | null;
  layers: SceneLayer[];
}

export const TIME_PALETTES: Record<TimeOfDay, Pick<ScenePalette, "skyTop" | "skyMid" | "horizon" | "sun">> = {
  dawn: { skyTop: "#18223f", skyMid: "#7a6a8c", horizon: "#f2b9a0", sun: "#fff0d8" },
  day: { skyTop: "#10365d", skyMid: "#4b82b4", horizon: "#cde0ea", sun: "#fffaf0" },
  golden: { skyTop: "#1b2141", skyMid: "#ae645b", horizon: "#f4b274", sun: "#ffe3ab" },
  dusk: { skyTop: "#0d1430", skyMid: "#4a3d67", horizon: "#d88f7d", sun: "#ffd2a8" },
  night: { skyTop: "#04060d", skyMid: "#0d1430", horizon: "#2c3055", sun: "#ece6ff" },
};

export function withTime(p: ScenePalette, time: TimeOfDay): ScenePalette {
  return { ...p, ...TIME_PALETTES[time], time };
}

interface Ctx {
  p: ScenePalette;
  rng: S.Rng;
  layers: SceneLayer[];
  night: boolean;
}

const land = (p: ScenePalette, depth: number) => mix(p.horizon, p.land, 0.16 + 0.84 * Math.pow(depth, 0.85));

function add(c: Ctx, key: string, d: string, depth: number, fill?: string, opacity?: number) {
  if (d) c.layers.push({ key, d, depth, fill: fill ?? land(c.p, depth), opacity });
}

function lights(c: Ctx, key: string, d: string, depth: number, strength = 1) {
  const o = c.night ? 0.95 : c.p.time === "dusk" ? 0.75 : c.p.time === "golden" ? 0.35 : 0;
  if (o > 0 && d) c.layers.push({ key, d, depth, fill: c.p.accent, opacity: o * strength });
}

function sunFor(p: ScenePalette, horizonY: number, x = 1080): ComposedScene["sun"] {
  switch (p.time) {
    case "night":
      return { x, y: 180, r: 26, color: p.sun, moon: true };
    case "day":
      return { x, y: 200, r: 44, color: p.sun, moon: false };
    case "dawn":
      return { x, y: horizonY - 40, r: 64, color: p.sun, moon: false };
    default:
      return { x, y: horizonY - 70, r: 72, color: p.sun, moon: false };
  }
}

function waterFor(p: ScenePalette, top: number): ComposedScene["water"] {
  const base = p.water ?? mix(p.horizon, p.land, 0.55);
  return { top, color: base, highlight: mix(p.horizon, base, 0.35) };
}

function reflection(c: Ctx, sun: ComposedScene["sun"], top: number, depth = 0.3) {
  if (!sun) return;
  const count = c.night ? 26 : 60;
  add(c, "glitter", S.glitter(c.rng, { cx: sun.x, top: top + 4, bottom: Math.min(S.H, top + 360), spread: sun.moon ? 90 : 220, count }), depth, lighten(sun.color, 0.1), c.night ? 0.45 : 0.55);
}

// ── Destination compositions ─────────────────────────────────────────────────

const compositions: Record<SceneId, (c: Ctx) => Omit<ComposedScene, "sky" | "stars" | "layers">> = {
  coast(c) {
    const hy = 640;
    add(c, "far-hills", S.rolling(c.rng, { base: 640, amp: 10, waves: 2, closeAt: hy + 2 }), 0.12);
    add(c, "headland", S.ridge(c.rng, { base: 636, amp: 80, x0: -100, x1: 560, detail: 6, closeAt: hy + 4 }), 0.28);
    const sun = sunFor(c.p, hy, 1020);
    reflection(c, sun, hy);
    add(c, "boat", S.boat(760, 712, 0.9, true), 0.45);
    add(c, "beach", `M-20,1010 L-20,800 C420,768 900,830 1620,796 L1620,1010 Z`, 0.9, mix(c.p.land, c.p.accent, 0.12));
    // Kept inside x≈400–1200 so portrait crops still frame the palms.
    add(c, "palm-a", S.palm(430, 880, 470, 0.2), 1);
    add(c, "palm-b", S.palm(540, 860, 360, 0.34), 0.95);
    add(c, "palm-c", S.palm(1230, 870, 420, -0.26), 1);
    return { horizonY: hy, sun, water: waterFor(c.p, hy) };
  },
  rajasthan(c) {
    const hy = 700;
    add(c, "far-dunes", S.rolling(c.rng, { base: 690, amp: 16, waves: 3 }), 0.12);
    add(c, "fort", S.hillFort(c.rng, { x0: 470, x1: 1130, base: 760, hill: 150, wall: 40 }), 0.45);
    add(c, "mid-dunes", S.rolling(c.rng, { base: 800, amp: 36, waves: 2.2 }), 0.65);
    add(c, "birds", S.birds(c.rng, 5, 1240, 420), 0.5, land(c.p, 0.8));
    add(c, "near-dunes", S.rolling(c.rng, { base: 910, amp: 44, waves: 1.6 }), 1);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1180), water: null };
  },
  "desert-city"(c) {
    const hy = 700;
    add(c, "far-dunes", S.rolling(c.rng, { base: 700, amp: 12 }), 0.1);
    const city = S.skyline(c.rng, { base: 720, x0: 260, x1: 1400, minH: 60, maxH: 250, spire: 0.25, windowDensity: 0.14 });
    add(c, "skyline", city.d + S.burjKhalifa(830, 720, 560), 0.36);
    lights(c, "skyline-lights", city.windows, 0.36);
    add(c, "mid-dunes", S.rolling(c.rng, { base: 820, amp: 40, waves: 2.4 }), 0.72);
    add(c, "near-dunes", S.rolling(c.rng, { base: 930, amp: 36, waves: 1.4 }), 1);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1210), water: null };
  },
  paris(c) {
    const hy = 720;
    add(c, "montmartre", S.rolling(c.rng, { base: 700, amp: 30, waves: 1.2, x0: -40, x1: 600, closeAt: 732 }) + S.chhatri(240, 640, 60), 0.14);
    const blocks = S.skyline(c.rng, { base: 730, x0: -20, x1: 1620, minH: 50, maxH: 95, minW: 40, maxW: 90, gap: 2, mansard: true, windowDensity: 0.22 });
    add(c, "haussmann", blocks.d, 0.32);
    add(c, "eiffel", S.eiffel(1010, 730, 520), 0.36);
    lights(c, "windows", blocks.windows, 0.32);
    const sun = sunFor(c.p, hy, 1240);
    reflection(c, sun, 740, 0.45);
    add(c, "bridge", S.archBridge(-40, 1640, 790, 5), 0.78);
    add(c, "quay", `M-20,1010 L-20,900 L1620,930 L1620,1010 Z`, 1);
    return { horizonY: hy, sun, water: waterFor(c.p, 740) };
  },
  tokyo(c) {
    const hy = 700;
    const f = S.fuji(560, 700, 760, 250);
    add(c, "fuji", f.cone, 0.06);
    add(c, "fuji-snow", f.snow, 0.06, mix(c.p.horizon, "#ffffff", 0.35), 0.75);
    const far = S.skyline(c.rng, { base: 720, x0: -20, x1: 1620, minH: 60, maxH: 200, minW: 22, maxW: 50, gap: 1, windowDensity: 0.2 });
    add(c, "far-city", far.d, 0.3);
    lights(c, "far-lights", far.windows, 0.3, 0.7);
    add(c, "tower", S.tokyoTower(1060, 740, 400), 0.45);
    add(c, "tower-lights", S.tokyoTower(1060, 740, 400), 0.45, c.p.accent, c.night ? 0.28 : 0);
    const near = S.skyline(c.rng, { base: 820, x0: -20, x1: 1620, minH: 80, maxH: 330, minW: 34, maxW: 80, spire: 0.3, windowDensity: 0.28 });
    add(c, "near-city", near.d, 0.66);
    lights(c, "near-lights", near.windows, 0.66);
    add(c, "rooftops", S.rolling(c.rng, { base: 828, amp: 6, waves: 6 }), 1);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1260), water: null };
  },
  bali(c) {
    const hy = 660;
    add(c, "volcano", S.ridge(c.rng, { base: 660, amp: 40, detail: 5, peaks: [[560, 360], [640, 372]] }), 0.1);
    add(c, "jungle", S.rolling(c.rng, { base: 700, amp: 40, waves: 3.2 }), 0.34);
    S.terraces(c.rng, 760, 6).forEach((d, i) => add(c, `terrace-${i}`, d, 0.55 + i * 0.08, i % 2 ? land(c.p, 0.55 + i * 0.08) : mix(land(c.p, 0.55 + i * 0.08), c.p.accent, 0.12)));
    add(c, "meru", S.meru(1050, 800, 330, 9), 0.82);
    add(c, "palm", S.palm(420, 1000, 520, 0.22) + S.palm(1210, 1000, 470, -0.3), 1);
    return { horizonY: hy, sun: sunFor(c.p, hy, 820), water: null };
  },
  alpine(c) {
    const hy = 700;
    const peaks = S.ridge(c.rng, { base: 600, amp: 260, detail: 8, rough: 0.55, peaks: [[520, 250], [980, 300]] });
    add(c, "far-peaks", peaks, 0.3);
    c.layers.push({ key: "far-snow", d: peaks, depth: 0.3, fill: mix(c.p.accent, c.p.horizon, 0.15), opacity: 0.92, clip: S.snowClip(c.rng, 390, 34) });
    const mid = S.ridge(c.rng, { base: 700, amp: 170, detail: 7, rough: 0.5 });
    add(c, "mid-ridge", mid, 0.62);
    c.layers.push({ key: "mid-snow", d: mid, depth: 0.62, fill: mix(c.p.accent, c.p.horizon, 0.3), opacity: 0.75, clip: S.snowClip(c.rng, 560, 22) });
    add(c, "meadow", S.rolling(c.rng, { base: 790, amp: 30, waves: 2 }), 0.78);
    let pines = "";
    for (let i = 0; i < 14; i++) pines += S.pine(60 + i * 44 + (i > 6 ? 700 : 0), 840 + (i % 3) * 8, 90 + (i % 4) * 22) + " ";
    add(c, "pines", pines, 0.92);
    add(c, "foreground", S.rolling(c.rng, { base: 900, amp: 20, waves: 1.2 }), 1);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1240), water: waterFor(c.p, 740) };
  },
  manhattan(c) {
    const hy = 700;
    const far = S.skyline(c.rng, { base: 700, x0: 160, x1: 1460, minH: 80, maxH: 270, minW: 26, maxW: 60, gap: 2, spire: 0.2, windowDensity: 0.3 });
    add(c, "skyline", far.d + S.burjKhalifa(640, 700, 380) + S.burjKhalifa(1120, 700, 460), 0.32);
    lights(c, "windows", far.windows, 0.32);
    const sun = sunFor(c.p, hy, 1300);
    reflection(c, sun, 704, 0.4);
    const b = S.suspensionBridge(-60, 1660, 800, 300);
    add(c, "bridge", b.solid, 0.85);
    c.layers.push({ key: "cables", d: b.cables, depth: 0.85, fill: "none", stroke: 2, opacity: 0.9 });
    return { horizonY: hy, sun, water: waterFor(c.p, 704) };
  },
  backwater(c) {
    const hy = 650;
    let far = S.rolling(c.rng, { base: 650, amp: 8, waves: 5, closeAt: hy + 3 });
    for (let x = -20; x < 1640; x += 55 + c.rng() * 50) far += " " + S.palm(x, 652, 55 + c.rng() * 75, (c.rng() - 0.5) * 0.5);
    add(c, "far-palms", far, 0.3);
    const sun = sunFor(c.p, hy, 980);
    reflection(c, sun, hy, 0.3);
    const hb = S.houseboat(820, 760, 440);
    add(c, "houseboat", hb.d, 0.6);
    lights(c, "houseboat-lights", hb.windows, 0.6);
    add(c, "near-left", S.palm(400, 1010, 640, 0.42) + S.palm(520, 1000, 520, 0.3), 1);
    add(c, "near-right", S.palm(1230, 1010, 600, -0.4), 1);
    add(c, "bank", `M-20,1010 L-20,940 C500,920 1100,960 1620,930 L1620,1010 Z`, 1);
    return { horizonY: hy, sun, water: waterFor(c.p, hy) };
  },
  himalaya(c) {
    const hy = 720;
    const range = S.ridge(c.rng, { base: 600, amp: 240, detail: 8, peaks: [[400, 300], [1180, 280]] });
    add(c, "far-range", range, 0.18);
    c.layers.push({ key: "far-snow", d: range, depth: 0.18, fill: mix(c.p.horizon, "#ffffff", 0.7), opacity: 0.95, clip: S.snowClip(c.rng, 410, 30) });
    add(c, "barren", S.ridge(c.rng, { base: 700, amp: 180, detail: 7, rough: 0.48 }), 0.6);
    add(c, "monastery", S.monastery(c.rng, 380, 760, 220, 150), 0.55);
    add(c, "near-ground", S.rolling(c.rng, { base: 880, amp: 26, waves: 1.3 }), 0.9);
    add(c, "stupas", S.stupa(960, 880, 34) + S.stupa(1050, 884, 26) + S.stupa(1124, 888, 20), 0.95, mix("#f4efe6", c.p.land, 0.2));
    add(c, "flags", S.prayerFlags(820, 1300, 700, 70), 0.95, c.p.accent, 0.85);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1220), water: waterFor(c.p, 740) };
  },
  highland(c) {
    const hy = 640;
    [0.1, 0.3, 0.5, 0.72, 0.95].forEach((depth, i) => {
      add(c, `hill-${i}`, S.rolling(c.rng, { base: 620 + i * 80, amp: 60 - i * 6, waves: 2 + i * 0.5 }), depth);
      // Soft cloud banks drifting in the valleys (the "abode of clouds").
      if (i < 4) add(c, `mist-${i}`, S.clouds(c.rng, { count: 5, yMin: 650 + i * 80, yMax: 680 + i * 80, scale: 1.3 }), depth + 0.05, lighten(c.p.horizon, 0.1), 0.22);
    });
    add(c, "falls", S.waterfall(c.rng, 620, 640, 760) + S.waterfall(c.rng, 1060, 710, 830), 0.6, mix(c.p.accent, "#ffffff", 0.3), 0.55);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1100), water: null };
  },
  atoll(c) {
    const hy = 620;
    let isle = S.island(1180, hy + 2, 360, 18);
    isle += " " + S.palm(1140, hy - 6, 90, -0.2) + S.palm(1200, hy - 8, 70, 0.2);
    add(c, "far-isle", isle, 0.2);
    const sun = sunFor(c.p, hy, 520);
    reflection(c, sun, hy, 0.3);
    const v = S.overwaterVillas(300, 1100, 740, 6);
    add(c, "villas", v.d, 0.6);
    lights(c, "villa-lights", v.windows, 0.6);
    add(c, "sandbank", `M860,1010 C960,900 1360,890 1640,900 L1640,1010 Z`, 0.95, mix(c.p.land, "#f4dcb6", 0.12));
    add(c, "palm", S.palm(1160, 920, 460, -0.35), 1);
    return { horizonY: hy, sun, water: waterFor(c.p, hy) };
  },

  // ── Journey stage sets ─────────────────────────────────────────────────────
  home(c) {
    const hy = 720;
    const city = S.skyline(c.rng, { base: 740, x0: -20, x1: 1620, minH: 40, maxH: 180, minW: 30, maxW: 80, windowDensity: 0.16 });
    add(c, "city", city.d, 0.4);
    lights(c, "city-lights", city.windows, 0.4);
    add(c, "near", S.rolling(c.rng, { base: 900, amp: 14, waves: 3 }), 1);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1150), water: null };
  },
  flight(c) {
    const hy = 780;
    add(c, "cloud-floor", S.clouds(c.rng, { count: 16, yMin: 780, yMax: 900, scale: 1.4 }), 0.25, lighten(c.p.horizon, 0.15), 0.9);
    add(c, "cloud-far", S.clouds(c.rng, { count: 6, yMin: 520, yMax: 640, scale: 0.8 }), 0.12, lighten(c.p.skyMid, 0.2), 0.35);
    add(c, "plane", S.aircraft(760, 430, 170), 0.7, mix(c.p.land, c.p.skyTop, 0.3));
    add(c, "cloud-near", S.clouds(c.rng, { count: 10, yMin: 900, yMax: 1000, scale: 1.8 }), 1, lighten(c.p.horizon, 0.3), 0.95);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1240), water: null };
  },
  train(c) {
    const hy = 700;
    add(c, "far-hills", S.rolling(c.rng, { base: 700, amp: 40, waves: 2 }), 0.2);
    add(c, "mid", S.rolling(c.rng, { base: 800, amp: 24, waves: 3 }), 0.55);
    let carriages = "";
    for (let i = 0; i < 8; i++) carriages += `M${140 + i * 176},850 L${140 + i * 176},790 Q${140 + i * 176},780 ${150 + i * 176},780 L${300 + i * 176},780 Q${310 + i * 176},780 ${310 + i * 176},790 L${310 + i * 176},850 Z `;
    add(c, "train", carriages, 0.85);
    let windows = "";
    for (let i = 0; i < 8; i++) for (let w = 0; w < 5; w++) windows += `M${156 + i * 176 + w * 30},796 h20 v16 h-20 Z `;
    lights(c, "train-lights", windows, 0.85, 1.2);
    add(c, "track", `M-20,1010 L-20,852 L1620,852 L1620,1010 Z`, 1);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1200), water: null };
  },
  airport(c) {
    const hy = 700;
    const a = S.airport(700);
    add(c, "terminal", a.d, 0.5);
    add(c, "plane", S.aircraft(560, 560, 150), 0.62);
    add(c, "apron", `M-20,1010 L-20,705 L1620,705 L1620,1010 Z`, 0.95);
    c.layers.push({ key: "runway", d: a.lights, depth: 0.95, fill: c.p.accent, opacity: c.night || c.p.time === "dusk" ? 0.95 : 0.55 });
    return { horizonY: hy, sun: sunFor(c.p, hy, 1300), water: null };
  },
  hotel(c) {
    const hy = 660;
    const sun = sunFor(c.p, hy, 1260);
    reflection(c, sun, hy, 0.25);
    const r = S.resort(760, 860, 620, 4);
    add(c, "resort", r.d, 0.62);
    lights(c, "resort-lights", r.windows, 0.62, 1.1);
    add(c, "pool", `M320,900 L1200,900 L1240,930 L280,930 Z`, 0.8, mix(c.p.water ?? c.p.horizon, c.p.accent, 0.2), 0.85);
    add(c, "palms", S.palm(400, 1000, 520, 0.2) + S.palm(1200, 1000, 560, -0.24) + S.palm(1110, 990, 400, -0.1), 1);
    add(c, "deck", `M-20,1010 L-20,940 L1620,940 L1620,1010 Z`, 1);
    return { horizonY: hy, sun, water: waterFor(c.p, hy) };
  },
  dining(c) {
    const hy = 660;
    const sun = sunFor(c.p, hy, 980);
    reflection(c, sun, hy, 0.25);
    add(c, "far-shore", S.rolling(c.rng, { base: 662, amp: 10, waves: 2, closeAt: hy + 3 }), 0.15);
    // Kept below y≈400: wide stages crop the top third of the frame.
    const l = S.stringLights({ y: 430, sag: 45, spans: 3 });
    c.layers.push({ key: "wire", d: l.wire, depth: 0.9, fill: "none", stroke: 1.5, opacity: 0.6 });
    c.layers.push({ key: "bulbs", d: l.bulbs, depth: 0.9, fill: "#ffd79a", opacity: 0.95 });
    add(c, "tables", S.diningTables(c.rng, 940, 4), 0.92);
    add(c, "sand", `M-20,1010 L-20,930 L1620,945 L1620,1010 Z`, 1);
    return { horizonY: hy, sun, water: waterFor(c.p, hy) };
  },
  "night-city"(c) {
    const hy = 720;
    const far = S.skyline(c.rng, { base: 720, x0: -20, x1: 1620, minH: 80, maxH: 260, minW: 24, maxW: 60, gap: 2, spire: 0.25, windowDensity: 0.35 });
    add(c, "far", far.d, 0.35);
    c.layers.push({ key: "far-lights", d: far.windows, depth: 0.35, fill: c.p.accent, opacity: 0.9 });
    const near = S.skyline(c.rng, { base: 900, x0: -20, x1: 1620, minH: 120, maxH: 380, minW: 60, maxW: 120, windowDensity: 0.4 });
    add(c, "near", near.d, 0.8);
    c.layers.push({ key: "near-lights", d: near.windows, depth: 0.8, fill: "#ffcf8a", opacity: 0.95 });
    return { horizonY: hy, sun: sunFor(c.p, hy, 1260), water: null };
  },
  "calm-water"(c) {
    const hy = 620;
    add(c, "far-hills", S.rolling(c.rng, { base: 624, amp: 24, waves: 2, closeAt: hy + 3 }), 0.14);
    const sun = sunFor(c.p, hy, 800);
    reflection(c, sun, hy, 0.25);
    let lanterns = "";
    for (let i = 0; i < 9; i++) {
      const x = 300 + i * 120 + (c.rng() - 0.5) * 40;
      const y = 820 + (c.rng() - 0.5) * 80;
      lanterns += `M${x - 6},${y} a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 Z `;
    }
    c.layers.push({ key: "lanterns", d: lanterns, depth: 0.7, fill: "#ffcf8a", opacity: 0.85 });
    add(c, "reeds", S.palm(1520, 1010, 420, -0.3), 1);
    return { horizonY: hy, sun, water: waterFor(c.p, hy) };
  },
  sea(c) {
    const hy = 620;
    const sun = sunFor(c.p, hy, 1100);
    reflection(c, sun, hy, 0.3);
    add(c, "far-coast", S.ridge(c.rng, { base: 624, amp: 60, detail: 6, x0: -60, x1: 700, closeAt: hy + 3 }), 0.2);
    add(c, "boat", S.boat(900, 760, 2.2, false), 0.65);
    return { horizonY: hy, sun, water: waterFor(c.p, hy) };
  },
  dunes(c) {
    const hy = 700;
    add(c, "far-dunes", S.rolling(c.rng, { base: 690, amp: 24, waves: 2.5 }), 0.14);
    add(c, "mid-dunes", S.rolling(c.rng, { base: 770, amp: 50, waves: 1.8 }), 0.45);
    let caravan = "";
    for (let i = 0; i < 5; i++) caravan += S.camel(600 + i * 96, 748 - i * 4, 1.5 - i * 0.08) + " ";
    add(c, "caravan", caravan, 0.5);
    add(c, "near-dunes", S.rolling(c.rng, { base: 900, amp: 60, waves: 1.2 }), 1);
    return { horizonY: hy, sun: sunFor(c.p, hy, 1080), water: null };
  },
  "island-hop"(c) {
    const hy = 620;
    const sun = sunFor(c.p, hy, 700);
    reflection(c, sun, hy, 0.3);
    add(c, "isle-far", S.island(1200, hy + 2, 520, 34), 0.18);
    add(c, "isle-mid", S.island(420, hy + 30, 620, 70) + S.palm(380, hy - 28, 120, 0.1), 0.42);
    add(c, "boat", S.boat(1080, 820, 2.6, true), 0.8);
    return { horizonY: hy, sun, water: waterFor(c.p, hy) };
  },
};

export function composeScene(id: SceneId, palette: ScenePalette, seed: number): ComposedScene {
  const ctx: Ctx = { p: palette, rng: S.mulberry32(seed), layers: [], night: palette.time === "night" };
  const compose = compositions[id] ?? compositions.coast;
  const base = compose(ctx);
  const starry = palette.time === "night" || palette.time === "dusk";
  return {
    ...base,
    sky: { top: palette.skyTop, mid: palette.skyMid, horizon: palette.horizon },
    stars: starry ? S.stars(S.mulberry32(seed + 99), palette.time === "night" ? 180 : 60, base.horizonY * 0.8) : null,
    layers: ctx.layers,
  };
}

/** Which stage set represents each journey stop, given the destination's own scene. */
export function stageFor(kind: JourneyStopKind, destinationScene: SceneKind): SceneId {
  switch (kind) {
    case "home":
      return "home";
    case "flight":
      return "flight";
    case "train":
      return "train";
    case "airport":
      return "airport";
    case "hotel":
      return "hotel";
    case "food":
    case "luxury":
      return "dining";
    case "nightlife":
      return destinationScene === "tokyo" || destinationScene === "manhattan" ? destinationScene : "night-city";
    case "wellness":
      return "calm-water";
    case "water":
      return destinationScene === "backwater" || destinationScene === "atoll" ? destinationScene : "sea";
    case "island":
      return destinationScene === "atoll" ? "atoll" : "island-hop";
    case "beach":
      return destinationScene === "atoll" || destinationScene === "bali" ? destinationScene : "coast";
    case "desert":
      return "dunes";
    default:
      return destinationScene;
  }
}
