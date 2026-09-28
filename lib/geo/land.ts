import { LANDMASK_COLS, LANDMASK_RESOLUTION, LANDMASK_RLE, LANDMASK_ROWS } from "./landmask";

let grid: Uint8Array | null = null;

/** Decodes the embedded run-length land mask once and caches it. */
export function getLandGrid(): Uint8Array {
  if (grid) return grid;
  const out = new Uint8Array(LANDMASK_COLS * LANDMASK_ROWS);
  const rows = LANDMASK_RLE.split("|");
  for (let r = 0; r < rows.length; r++) {
    let c = 0;
    let value = 0;
    for (const token of rows[r].split(",")) {
      const len = parseInt(token, 36);
      if (value === 1) out.fill(1, r * LANDMASK_COLS + c, r * LANDMASK_COLS + c + len);
      c += len;
      value ^= 1;
    }
  }
  grid = out;
  return out;
}

export function isLand(lat: number, lng: number): boolean {
  const g = getLandGrid();
  const row = Math.min(LANDMASK_ROWS - 1, Math.max(0, Math.floor((90 - lat) / LANDMASK_RESOLUTION)));
  const col = Math.min(LANDMASK_COLS - 1, Math.max(0, Math.floor((lng + 180) / LANDMASK_RESOLUTION)));
  return g[row * LANDMASK_COLS + col] === 1;
}

/**
 * Converts lat/lng to a point on a sphere. Matches three.js SphereGeometry UVs
 * (u = (lng + 180) / 360), so textures and markers line up.
 */
export function latLngToVector3(lat: number, lng: number, radius = 1): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)];
}

export function vector3ToLatLng(x: number, y: number, z: number): { lat: number; lng: number } {
  const len = Math.hypot(x, y, z) || 1;
  const lat = (Math.asin(y / len) * 180) / Math.PI;
  let lng = (Math.atan2(z, -x) * 180) / Math.PI - 180;
  if (lng < -180) lng += 360;
  return { lat, lng };
}

export interface LandDots {
  /** xyz triplets on the unit sphere. */
  positions: Float32Array;
  /** lat/lng pairs, same order as positions. */
  coords: Float32Array;
  /** Per-dot random value in [0, 1), used for twinkle and city lights. */
  seeds: Float32Array;
  count: number;
}

/**
 * Evenly distributes `samples` points over a sphere (Fibonacci lattice) and
 * keeps those that fall on land. Deterministic, so SSR and client agree.
 */
export function createLandDots(samples: number): LandDots {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pos: number[] = [];
  const coords: number[] = [];
  const seeds: number[] = [];
  for (let i = 0; i < samples; i++) {
    const y = 1 - ((i + 0.5) / samples) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    const x = Math.cos(t) * r;
    const z = Math.sin(t) * r;
    const { lat, lng } = vector3ToLatLng(x, y, z);
    if (!isLand(lat, lng)) continue;
    pos.push(x, y, z);
    coords.push(lat, lng);
    // Cheap deterministic hash → [0, 1)
    const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    seeds.push(h - Math.floor(h));
  }
  return {
    positions: new Float32Array(pos),
    coords: new Float32Array(coords),
    seeds: new Float32Array(seeds),
    count: seeds.length,
  };
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
