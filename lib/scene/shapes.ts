/**
 * Procedural silhouette generators for a 1600×1000 scene viewBox.
 * Every function is pure and seeded, so server and client render identically.
 */

export const W = 1600;
export const H = 1000;

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const between = (rng: Rng, a: number, b: number) => a + (b - a) * rng();

/** Close a list of top-edge points into a filled silhouette down to the bottom. */
function closeDown(points: [number, number][], bottom = H + 10): string {
  if (!points.length) return "";
  const [first] = points;
  const last = points[points.length - 1];
  return `M${r1(first[0])},${bottom} ${points.map(([x, y]) => `L${r1(x)},${r1(y)}`).join(" ")} L${r1(last[0])},${bottom} Z`;
}

/**
 * Close a partial-width landform at the waterline instead of the frame bottom,
 * tapering both ends into the water (islands, headlands, far shores).
 */
function closeAtLine(points: [number, number][], line: number): string {
  if (points.length < 2) return "";
  const pts = points.map(([x, y]) => [x, Math.min(y, line)] as [number, number]);
  pts[0] = [pts[0][0], line];
  pts[pts.length - 1] = [pts[pts.length - 1][0], line];
  return `M${r1(pts[0][0])},${r1(line)} ${pts.map(([x, y]) => `L${r1(x)},${r1(y)}`).join(" ")} Z`;
}

/** Jagged mountain ridge via midpoint displacement. */
export function ridge(rng: Rng, o: { base: number; amp: number; detail?: number; rough?: number; x0?: number; x1?: number; peaks?: [number, number][]; closeAt?: number }): string {
  const x0 = o.x0 ?? -60;
  const x1 = o.x1 ?? W + 60;
  let pts: [number, number][] = [[x0, o.base - rng() * o.amp * 0.3], ...(o.peaks ?? []), [x1, o.base - rng() * o.amp * 0.3]];
  pts.sort((a, b) => a[0] - b[0]);
  let disp = o.amp;
  const rough = o.rough ?? 0.52;
  for (let d = 0; d < (o.detail ?? 7); d++) {
    const next: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      next.push([ax, ay]);
      next.push([(ax + bx) / 2, (ay + by) / 2 - (rng() - 0.35) * disp]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    disp *= rough;
  }
  const clamped = pts.map(([x, y]) => [x, Math.min(y, o.base + o.amp * 0.2)] as [number, number]);
  return o.closeAt !== undefined ? closeAtLine(clamped, o.closeAt) : closeDown(clamped);
}

/** Smooth rolling hills / dunes from summed sines. */
export function rolling(rng: Rng, o: { base: number; amp: number; waves?: number; x0?: number; x1?: number; step?: number; closeAt?: number }): string {
  const x0 = o.x0 ?? -40;
  const x1 = o.x1 ?? W + 40;
  const w = o.waves ?? 3;
  const phases = [rng() * 6.28, rng() * 6.28, rng() * 6.28];
  const pts: [number, number][] = [];
  for (let x = x0; x <= x1; x += o.step ?? 20) {
    const t = x / W;
    const y =
      o.base -
      o.amp * (0.55 * Math.sin(t * Math.PI * w + phases[0]) + 0.3 * Math.sin(t * Math.PI * w * 2.3 + phases[1]) + 0.15 * Math.sin(t * Math.PI * w * 5.1 + phases[2]));
    pts.push([x, y]);
  }
  return o.closeAt !== undefined ? closeAtLine(pts, o.closeAt) : closeDown(pts);
}

/**
 * Clip region for snow caps: everything above a jagged snowline around `y`,
 * so caps follow gullies instead of ending in a ruler-straight edge.
 */
export function snowClip(rng: Rng, y: number, amp: number): string {
  let d = `M-100,-100 L${W + 100},-100 L${W + 100},${r1(y)} `;
  for (let x = W + 100; x >= -100; x -= 18) {
    const dip = rng() < 0.18 ? amp * (1.2 + rng()) : (rng() - 0.5) * amp;
    d += `L${r1(x)},${r1(y + dip)} `;
  }
  return `${d}Z`;
}

/** A rounded island sitting on the waterline. */
export function island(cx: number, line: number, w: number, h: number): string {
  return `M${r1(cx - w / 2)},${r1(line)} C${r1(cx - w * 0.32)},${r1(line - h * 0.9)} ${r1(cx - w * 0.12)},${r1(line - h)} ${r1(cx)},${r1(line - h)} C${r1(cx + w * 0.16)},${r1(line - h)} ${r1(cx + w * 0.34)},${r1(line - h * 0.7)} ${r1(cx + w / 2)},${r1(line)} Z`;
}

/** A band of water from `top` to the bottom of the frame. */
export function waterBody(top: number, bottom = H + 10): string {
  return `M-20,${top} L${W + 20},${top} L${W + 20},${bottom} L-20,${bottom} Z`;
}

/** Horizontal glitter strokes reflecting a light source on water. */
export function glitter(rng: Rng, o: { cx: number; top: number; bottom: number; spread: number; count: number }): string {
  let d = "";
  for (let i = 0; i < o.count; i++) {
    const y = between(rng, o.top, o.bottom);
    const t = (y - o.top) / (o.bottom - o.top);
    const width = between(rng, 8, 60) * (0.4 + t);
    const x = o.cx + (rng() - 0.5) * o.spread * (0.3 + t * 1.4);
    d += `M${r1(x - width / 2)},${r1(y)} h${r1(width)} v${r1(1.2 + t * 2)} h${r1(-width)} Z `;
  }
  return d;
}

export function stars(rng: Rng, count: number, maxY: number): string {
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = rng() * W;
    const y = rng() * rng() * maxY;
    const s = rng() < 0.08 ? 2.4 : rng() < 0.4 ? 1.6 : 1.1;
    d += `M${r1(x)},${r1(y)} h${s} v${s} h${-s} Z `;
  }
  return d;
}

/** Soft cloud banks made of overlapping ellipses. */
export function clouds(rng: Rng, o: { count: number; yMin: number; yMax: number; scale?: number }): string {
  let d = "";
  const s = o.scale ?? 1;
  for (let i = 0; i < o.count; i++) {
    const cx = rng() * W;
    const cy = between(rng, o.yMin, o.yMax);
    const puffs = 3 + Math.floor(rng() * 4);
    for (let p = 0; p < puffs; p++) {
      const rx = between(rng, 40, 120) * s;
      const ry = rx * between(rng, 0.25, 0.45);
      const x = cx + (p - puffs / 2) * rx * 0.8;
      const y = cy - rng() * ry * 0.6;
      d += `M${r1(x - rx)},${r1(y)} a${r1(rx)},${r1(ry)} 0 1,0 ${r1(rx * 2)},0 a${r1(rx)},${r1(ry)} 0 1,0 ${r1(-rx * 2)},0 Z `;
    }
  }
  return d;
}

export interface Skyline {
  d: string;
  windows: string;
}

/** Block skyline with optional setbacks and antennas, plus a lit-window path. */
export function skyline(
  rng: Rng,
  o: { base: number; x0: number; x1: number; minH: number; maxH: number; minW?: number; maxW?: number; gap?: number; spire?: number; windowDensity?: number; mansard?: boolean },
): Skyline {
  let x = o.x0;
  let d = "";
  let windows = "";
  const minW = o.minW ?? 28;
  const maxW = o.maxW ?? 70;
  while (x < o.x1) {
    const w = between(rng, minW, maxW);
    const centre = 1 - Math.abs((x - (o.x0 + o.x1) / 2) / ((o.x1 - o.x0) / 2));
    const h = between(rng, o.minH, o.minH + (o.maxH - o.minH) * (0.35 + 0.65 * centre));
    const top = o.base - h;
    if (o.mansard) {
      const roof = Math.min(18, h * 0.25);
      d += `M${r1(x)},${o.base + 10} L${r1(x)},${r1(top + roof)} L${r1(x + 5)},${r1(top)} L${r1(x + w - 5)},${r1(top)} L${r1(x + w)},${r1(top + roof)} L${r1(x + w)},${o.base + 10} Z `;
    } else if (rng() < 0.35 && h > o.minH * 1.6) {
      const inset = w * 0.18;
      const step = h * between(rng, 0.12, 0.25);
      d += `M${r1(x)},${o.base + 10} L${r1(x)},${r1(top + step)} L${r1(x + inset)},${r1(top + step)} L${r1(x + inset)},${r1(top)} L${r1(x + w - inset)},${r1(top)} L${r1(x + w - inset)},${r1(top + step)} L${r1(x + w)},${r1(top + step)} L${r1(x + w)},${o.base + 10} Z `;
    } else {
      d += `M${r1(x)},${o.base + 10} L${r1(x)},${r1(top)} L${r1(x + w)},${r1(top)} L${r1(x + w)},${o.base + 10} Z `;
    }
    if (o.spire && rng() < o.spire && h > o.minH * 1.4) {
      const sx = x + w / 2;
      d += `M${r1(sx - 1.5)},${r1(top + 2)} L${r1(sx)},${r1(top - h * 0.22)} L${r1(sx + 1.5)},${r1(top + 2)} Z `;
    }
    const density = o.windowDensity ?? 0.18;
    for (let wy = top + 10; wy < o.base - 6; wy += 14) {
      for (let wx = x + 5; wx < x + w - 6; wx += 11) {
        if (rng() < density) windows += `M${r1(wx)},${r1(wy)} h3 v4 h-3 Z `;
      }
    }
    x += w + (o.gap ?? between(rng, 0, 6));
  }
  return { d, windows };
}

// ── Landmarks ────────────────────────────────────────────────────────────────

export function burjKhalifa(x: number, base: number, h: number): string {
  const w = h * 0.075;
  const tiers = [1, 0.8, 0.62, 0.46, 0.33, 0.22, 0.13];
  let d = "";
  tiers.forEach((t, i) => {
    const top = base - h * (0.18 + i * 0.105);
    const hw = (w * t) / 2;
    d += `M${r1(x - hw)},${base + 10} L${r1(x - hw)},${r1(top)} L${r1(x + hw)},${r1(top)} L${r1(x + hw)},${base + 10} Z `;
  });
  d += `M${r1(x - 2)},${r1(base - h * 0.88)} L${r1(x)},${r1(base - h)} L${r1(x + 2)},${r1(base - h * 0.88)} Z`;
  return d;
}

export function eiffel(x: number, base: number, h: number): string {
  const w = h * 0.42;
  const p = (fx: number, fy: number) => `${r1(x + fx * w)},${r1(base - fy * h)}`;
  // Outer silhouette with the arch cut out between the legs.
  return (
    `M${p(-0.5, 0)} C${p(-0.36, 0.14)} ${p(-0.2, 0.3)} ${p(-0.12, 0.44)} L${p(-0.07, 0.62)} L${p(-0.03, 0.86)} L${p(-0.012, 0.93)} L${p(0, 1)} ` +
    `L${p(0.012, 0.93)} L${p(0.03, 0.86)} L${p(0.07, 0.62)} L${p(0.12, 0.44)} C${p(0.2, 0.3)} ${p(0.36, 0.14)} ${p(0.5, 0)} ` +
    `L${p(0.32, 0)} C${p(0.22, 0.16)} ${p(-0.22, 0.16)} ${p(-0.32, 0)} Z ` +
    `M${p(-0.17, 0.33)} L${p(0.17, 0.33)} L${p(0.16, 0.35)} L${p(-0.16, 0.35)} Z ` +
    `M${p(-0.09, 0.58)} L${p(0.09, 0.58)} L${p(0.085, 0.6)} L${p(-0.085, 0.6)} Z`
  );
}

export function tokyoTower(x: number, base: number, h: number): string {
  const w = h * 0.34;
  const p = (fx: number, fy: number) => `${r1(x + fx * w)},${r1(base - fy * h)}`;
  return (
    `M${p(-0.5, 0)} L${p(-0.16, 0.5)} L${p(-0.08, 0.72)} L${p(-0.02, 0.9)} L${p(0, 1)} L${p(0.02, 0.9)} L${p(0.08, 0.72)} L${p(0.16, 0.5)} L${p(0.5, 0)} ` +
    `L${p(0.3, 0)} L${p(0, 0.2)} L${p(-0.3, 0)} Z ` +
    `M${p(-0.2, 0.46)} L${p(0.2, 0.46)} L${p(0.2, 0.5)} L${p(-0.2, 0.5)} Z ` +
    `M${p(-0.1, 0.7)} L${p(0.1, 0.7)} L${p(0.1, 0.73)} L${p(-0.1, 0.73)} Z`
  );
}

/** Mt Fuji: returns the cone and a separate snow cap path. */
export function fuji(x: number, base: number, w: number, h: number): { cone: string; snow: string } {
  const top = base - h;
  const cone = `M${r1(x - w / 2)},${base + 10} C${r1(x - w * 0.22)},${r1(base - h * 0.35)} ${r1(x - w * 0.1)},${r1(top + 6)} ${r1(x - w * 0.06)},${r1(top)} L${r1(x + w * 0.06)},${r1(top)} C${r1(x + w * 0.1)},${r1(top + 6)} ${r1(x + w * 0.22)},${r1(base - h * 0.35)} ${r1(x + w / 2)},${base + 10} Z`;
  const sl = top + h * 0.3;
  const snow = `M${r1(x - w * 0.06)},${r1(top)} L${r1(x + w * 0.06)},${r1(top)} C${r1(x + w * 0.1)},${r1(top + 10)} ${r1(x + w * 0.14)},${r1(sl - 20)} ${r1(x + w * 0.17)},${r1(sl)} L${r1(x + w * 0.1)},${r1(sl - 14)} L${r1(x + w * 0.05)},${r1(sl + 4)} L${r1(x)},${r1(sl - 18)} L${r1(x - w * 0.05)},${r1(sl + 2)} L${r1(x - w * 0.11)},${r1(sl - 12)} L${r1(x - w * 0.17)},${r1(sl)} C${r1(x - w * 0.14)},${r1(sl - 20)} ${r1(x - w * 0.1)},${r1(top + 10)} ${r1(x - w * 0.06)},${r1(top)} Z`;
  return { cone, snow };
}

/** Balinese meru: a plinth and a stack of shrinking thatched tiers. */
export function meru(x: number, base: number, h: number, tiers = 7): string {
  const plinth = h * 0.2;
  const w0 = h * 0.5;
  let d = `M${r1(x - w0 * 0.35)},${base + 10} L${r1(x - w0 * 0.35)},${r1(base - plinth)} L${r1(x + w0 * 0.35)},${r1(base - plinth)} L${r1(x + w0 * 0.35)},${base + 10} Z `;
  const tierH = (h - plinth) / (tiers + 0.6);
  for (let i = 0; i < tiers; i++) {
    const y = base - plinth - i * tierH;
    const hw = (w0 / 2) * (1 - i / (tiers + 1.5));
    d += `M${r1(x - hw)},${r1(y)} L${r1(x - hw * 0.7)},${r1(y - tierH * 0.85)} L${r1(x + hw * 0.7)},${r1(y - tierH * 0.85)} L${r1(x + hw)},${r1(y)} Z `;
    d += `M${r1(x - hw * 0.22)},${r1(y + 1)} L${r1(x - hw * 0.22)},${r1(y - tierH * 0.2)} L${r1(x + hw * 0.22)},${r1(y - tierH * 0.2)} L${r1(x + hw * 0.22)},${r1(y + 1)} Z `;
  }
  const topY = base - plinth - tiers * tierH;
  d += `M${r1(x - 3)},${r1(topY + 2)} L${r1(x)},${r1(topY - tierH * 0.9)} L${r1(x + 3)},${r1(topY + 2)} Z`;
  return d;
}

/** Rajasthani hill fort: crenellated walls, bastions and chhatri domes on a rise. */
export function hillFort(rng: Rng, o: { x0: number; x1: number; base: number; hill: number; wall: number }): string {
  const { x0, x1, base, hill, wall } = o;
  const mid = (x0 + x1) / 2;
  const span = x1 - x0;
  const hillTop = base - hill;
  let d = `M${r1(x0 - span * 0.25)},${base + 10} C${r1(x0)},${r1(base - hill * 0.4)} ${r1(x0 + span * 0.1)},${r1(hillTop)} ${r1(mid)},${r1(hillTop)} C${r1(x1 - span * 0.1)},${r1(hillTop)} ${r1(x1)},${r1(base - hill * 0.4)} ${r1(x1 + span * 0.25)},${base + 10} Z `;
  const wallTop = hillTop - wall;
  const wx0 = x0 + span * 0.08;
  const wx1 = x1 - span * 0.08;
  d += `M${r1(wx0)},${r1(hillTop + 12)} L${r1(wx0)},${r1(wallTop)} `;
  for (let x = wx0; x < wx1; x += 14) d += `L${r1(x)},${r1(wallTop - 6)} L${r1(x + 7)},${r1(wallTop - 6)} L${r1(x + 7)},${r1(wallTop)} L${r1(x + 14)},${r1(wallTop)} `;
  d += `L${r1(wx1)},${r1(hillTop + 12)} Z `;
  const bastions = 5;
  for (let i = 0; i < bastions; i++) {
    const bx = wx0 + ((wx1 - wx0) * i) / (bastions - 1);
    const bh = wall * between(rng, 1.2, 1.7);
    const bw = 26;
    d += `M${r1(bx - bw / 2)},${r1(hillTop + 12)} L${r1(bx - bw / 2 + 3)},${r1(hillTop - bh)} L${r1(bx + bw / 2 - 3)},${r1(hillTop - bh)} L${r1(bx + bw / 2)},${r1(hillTop + 12)} Z `;
    d += chhatri(bx, hillTop - bh, bw * 0.9);
  }
  // A palace block with domes in the centre.
  const pw = span * 0.28;
  const ph = wall * 2.4;
  d += `M${r1(mid - pw / 2)},${r1(hillTop)} L${r1(mid - pw / 2)},${r1(hillTop - ph)} L${r1(mid + pw / 2)},${r1(hillTop - ph)} L${r1(mid + pw / 2)},${r1(hillTop)} Z `;
  for (let i = -1; i <= 1; i++) d += chhatri(mid + i * pw * 0.33, hillTop - ph, pw * (i === 0 ? 0.3 : 0.2));
  return d;
}

/** A small domed pavilion (chhatri) sitting on y. */
export function chhatri(x: number, y: number, w: number): string {
  const h = w * 0.55;
  return `M${r1(x - w / 2)},${r1(y + 1)} L${r1(x - w / 2)},${r1(y - h * 0.35)} L${r1(x + w / 2)},${r1(y - h * 0.35)} L${r1(x + w / 2)},${r1(y + 1)} Z M${r1(x - w * 0.42)},${r1(y - h * 0.34)} C${r1(x - w * 0.42)},${r1(y - h * 1.1)} ${r1(x + w * 0.42)},${r1(y - h * 1.1)} ${r1(x + w * 0.42)},${r1(y - h * 0.34)} Z M${r1(x - 1)},${r1(y - h * 0.95)} L${r1(x)},${r1(y - h * 1.35)} L${r1(x + 1)},${r1(y - h * 0.95)} Z `;
}

/** Coconut palm: curved trunk and arching fronds. */
export function palm(x: number, base: number, h: number, lean: number): string {
  const topX = x + lean * h;
  const topY = base - h;
  const tw = Math.max(3, h * 0.022);
  let d = `M${r1(x - tw * 1.4)},${base + 10} Q${r1(x + lean * h * 0.2 - tw)},${r1(base - h * 0.55)} ${r1(topX - tw * 0.6)},${r1(topY)} L${r1(topX + tw * 0.6)},${r1(topY)} Q${r1(x + lean * h * 0.2 + tw)},${r1(base - h * 0.55)} ${r1(x + tw * 1.4)},${base + 10} Z `;
  const fronds = 8;
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI + (i / (fronds - 1)) * Math.PI + (lean * 0.4);
    const len = h * (0.34 + (i % 2) * 0.06);
    const droop = len * 0.45;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.35 + droop;
    const cx = topX + Math.cos(a) * len * 0.5;
    const cy = topY + Math.sin(a) * len * 0.5 - len * 0.12;
    const thick = len * 0.07;
    d += `M${r1(topX)},${r1(topY)} Q${r1(cx)},${r1(cy - thick)} ${r1(ex)},${r1(ey)} Q${r1(cx)},${r1(cy + thick)} ${r1(topX)},${r1(topY + 2)} Z `;
  }
  return d;
}

export function pine(x: number, base: number, h: number): string {
  const w = h * 0.32;
  let d = "";
  for (let i = 0; i < 3; i++) {
    const y = base - h * (0.25 + i * 0.25);
    const hw = (w / 2) * (1 - i * 0.25);
    d += `M${r1(x - hw)},${r1(y + h * 0.25)} L${r1(x)},${r1(y - h * 0.12)} L${r1(x + hw)},${r1(y + h * 0.25)} Z `;
  }
  d += `M${r1(x - 2)},${base + 10} L${r1(x - 2)},${r1(base - h * 0.2)} L${r1(x + 2)},${r1(base - h * 0.2)} L${r1(x + 2)},${base + 10} Z`;
  return d;
}

/** Ladakhi chorten / stupa. */
export function stupa(x: number, base: number, s: number): string {
  return (
    `M${r1(x - s)},${base + 10} L${r1(x - s)},${r1(base - s * 0.3)} L${r1(x - s * 0.8)},${r1(base - s * 0.3)} L${r1(x - s * 0.8)},${r1(base - s * 0.55)} L${r1(x + s * 0.8)},${r1(base - s * 0.55)} L${r1(x + s * 0.8)},${r1(base - s * 0.3)} L${r1(x + s)},${r1(base - s * 0.3)} L${r1(x + s)},${base + 10} Z ` +
    `M${r1(x - s * 0.62)},${r1(base - s * 0.54)} C${r1(x - s * 0.62)},${r1(base - s * 1.35)} ${r1(x + s * 0.62)},${r1(base - s * 1.35)} ${r1(x + s * 0.62)},${r1(base - s * 0.54)} Z ` +
    `M${r1(x - s * 0.14)},${r1(base - s * 1.1)} L${r1(x - s * 0.05)},${r1(base - s * 2)} L${r1(x + s * 0.05)},${r1(base - s * 2)} L${r1(x + s * 0.14)},${r1(base - s * 1.1)} Z`
  );
}

/** Monastery stacked up a hillside (Thiksey-style). */
export function monastery(rng: Rng, x: number, base: number, w: number, h: number): string {
  let d = `M${r1(x - w * 0.8)},${base + 10} C${r1(x - w * 0.4)},${r1(base - h * 0.4)} ${r1(x - w * 0.2)},${r1(base - h)} ${r1(x)},${r1(base - h)} C${r1(x + w * 0.2)},${r1(base - h)} ${r1(x + w * 0.4)},${r1(base - h * 0.4)} ${r1(x + w * 0.8)},${base + 10} Z `;
  for (let i = 0; i < 9; i++) {
    const bx = x + (rng() - 0.5) * w * (1 - i / 12);
    const by = base - h * (0.2 + (i / 9) * 0.75);
    const bw = between(rng, 16, 34);
    const bh = between(rng, 12, 22);
    d += `M${r1(bx - bw / 2)},${r1(by + 4)} L${r1(bx - bw / 2)},${r1(by - bh)} L${r1(bx + bw / 2)},${r1(by - bh)} L${r1(bx + bw / 2)},${r1(by + 4)} Z `;
  }
  return d;
}

/** Row of overwater villas on stilts with a jetty. */
export function overwaterVillas(x0: number, x1: number, y: number, count: number): { d: string; windows: string } {
  let d = `M${r1(x0 - 40)},${r1(y + 2)} L${r1(x1 + 60)},${r1(y + 2)} L${r1(x1 + 60)},${r1(y + 6)} L${r1(x0 - 40)},${r1(y + 6)} Z `;
  let windows = "";
  const step = (x1 - x0) / Math.max(1, count - 1);
  for (let i = 0; i < count; i++) {
    const x = x0 + i * step;
    const w = 58;
    const hh = 26;
    d += `M${r1(x - w / 2)},${r1(y)} L${r1(x - w / 2)},${r1(y - hh)} L${r1(x + w / 2)},${r1(y - hh)} L${r1(x + w / 2)},${r1(y)} Z `;
    d += `M${r1(x - w * 0.62)},${r1(y - hh + 2)} L${r1(x)},${r1(y - hh - 30)} L${r1(x + w * 0.62)},${r1(y - hh + 2)} Z `;
    for (const sx of [-w * 0.4, 0, w * 0.4]) d += `M${r1(x + sx - 1.5)},${r1(y)} L${r1(x + sx - 1.5)},${r1(y + 22)} L${r1(x + sx + 1.5)},${r1(y + 22)} L${r1(x + sx + 1.5)},${r1(y)} Z `;
    windows += `M${r1(x - 14)},${r1(y - 18)} h28 v10 h-28 Z `;
  }
  return { d, windows };
}

/** Kerala kettuvallam houseboat with its arched woven canopy. */
export function houseboat(x: number, y: number, w: number): { d: string; windows: string } {
  const h = w * 0.13;
  const hull = `M${r1(x - w / 2)},${r1(y - h * 0.5)} C${r1(x - w * 0.35)},${r1(y + h * 0.35)} ${r1(x + w * 0.35)},${r1(y + h * 0.35)} ${r1(x + w / 2)},${r1(y - h * 0.6)} L${r1(x + w * 0.4)},${r1(y - h * 0.15)} L${r1(x - w * 0.42)},${r1(y - h * 0.1)} Z `;
  const roof = `M${r1(x - w * 0.34)},${r1(y - h * 0.1)} C${r1(x - w * 0.32)},${r1(y - h * 1.9)} ${r1(x + w * 0.3)},${r1(y - h * 1.9)} ${r1(x + w * 0.32)},${r1(y - h * 0.1)} Z`;
  let windows = "";
  for (let i = 0; i < 5; i++) windows += `M${r1(x - w * 0.24 + i * w * 0.1)},${r1(y - h * 0.9)} h${r1(w * 0.05)} v${r1(h * 0.4)} h${r1(-w * 0.05)} Z `;
  return { d: hull + roof, windows };
}

/** Stacked, gently curving rice-terrace bands. */
export function terraces(rng: Rng, top: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const base = top + (i * (H - top)) / count;
    const pts: [number, number][] = [];
    const phase = rng() * 6.28;
    for (let x = -40; x <= W + 40; x += 40) {
      pts.push([x, base + Math.sin(x / 260 + phase) * 16 + Math.sin(x / 90 + i) * 4]);
    }
    out.push(closeDown(pts));
  }
  return out;
}

/** Suspension bridge (Brooklyn-style): gothic towers, deck and cables as strokes. */
export function suspensionBridge(x0: number, x1: number, deck: number, towerH: number): { solid: string; cables: string } {
  const t1 = x0 + (x1 - x0) * 0.22;
  const t2 = x0 + (x1 - x0) * 0.78;
  const tw = 46;
  const tower = (tx: number) =>
    `M${r1(tx - tw / 2)},${deck + 60} L${r1(tx - tw / 2)},${r1(deck - towerH)} L${r1(tx + tw / 2)},${r1(deck - towerH)} L${r1(tx + tw / 2)},${deck + 60} Z ` +
    `M${r1(tx - tw * 0.3)},${r1(deck - towerH * 0.25)} L${r1(tx - tw * 0.3)},${r1(deck - towerH * 0.72)} Q${r1(tx - tw * 0.3)},${r1(deck - towerH * 0.82)} ${r1(tx - tw * 0.05)},${r1(deck - towerH * 0.84)} L${r1(tx - tw * 0.05)},${r1(deck - towerH * 0.25)} Z`;
  const solid = `M${r1(x0 - 40)},${r1(deck)} L${r1(x1 + 40)},${r1(deck)} L${r1(x1 + 40)},${r1(deck + 12)} L${r1(x0 - 40)},${r1(deck + 12)} Z ` + tower(t1) + " " + tower(t2);
  let cables = `M${r1(x0 - 40)},${r1(deck - 10)} Q${r1((x0 + t1) / 2)},${r1(deck - towerH * 0.2)} ${r1(t1)},${r1(deck - towerH * 0.95)} Q${r1((t1 + t2) / 2)},${r1(deck - 30)} ${r1(t2)},${r1(deck - towerH * 0.95)} Q${r1((t2 + x1) / 2)},${r1(deck - towerH * 0.2)} ${r1(x1 + 40)},${r1(deck - 10)} `;
  for (let x = t1 + 30; x < t2 - 20; x += 34) {
    const t = (x - t1) / (t2 - t1);
    const cy = deck - towerH * 0.95 + (towerH * 0.95 - 30) * (1 - Math.pow(2 * t - 1, 2));
    cables += `M${r1(x)},${r1(cy)} L${r1(x)},${r1(deck)} `;
  }
  return { solid, cables };
}

/** Arched stone bridge across a river (Paris). */
export function archBridge(x0: number, x1: number, deck: number, arches: number): string {
  const span = (x1 - x0) / arches;
  let d = `M${r1(x0)},${r1(deck)} L${r1(x1)},${r1(deck)} L${r1(x1)},${r1(deck + 70)} `;
  for (let i = arches - 1; i >= 0; i--) {
    const ax1 = x0 + (i + 1) * span - 10;
    const ax0 = x0 + i * span + 10;
    d += `L${r1(ax1)},${r1(deck + 70)} Q${r1((ax0 + ax1) / 2)},${r1(deck + 8)} ${r1(ax0)},${r1(deck + 70)} `;
  }
  d += `L${r1(x0)},${r1(deck + 70)} Z`;
  return d;
}

/** Simple aircraft silhouette pointing right. */
export function aircraft(x: number, y: number, s: number): string {
  const p = (fx: number, fy: number) => `${r1(x + fx * s)},${r1(y + fy * s)}`;
  return (
    `M${p(-1, -0.03)} L${p(0.85, -0.05)} Q${p(1.02, 0)} ${p(0.85, 0.06)} L${p(-1, 0.05)} Z ` +
    `M${p(0.05, 0)} L${p(-0.25, -0.62)} L${p(-0.36, -0.62)} L${p(-0.18, 0)} Z ` +
    `M${p(0.05, 0.02)} L${p(-0.18, 0.4)} L${p(-0.28, 0.4)} L${p(-0.16, 0.02)} Z ` +
    `M${p(-0.88, -0.02)} L${p(-1.02, -0.3)} L${p(-0.95, -0.3)} L${p(-0.78, -0.02)} Z`
  );
}

/** Resort building with balconies and a warm window grid. */
export function resort(x: number, base: number, w: number, floors: number): { d: string; windows: string } {
  const fh = 46;
  const h = floors * fh;
  let d = `M${r1(x - w / 2)},${base + 10} L${r1(x - w / 2)},${r1(base - h)} L${r1(x + w / 2)},${r1(base - h)} L${r1(x + w / 2)},${base + 10} Z `;
  d += `M${r1(x - w / 2 - 24)},${r1(base - h - 6)} L${r1(x + w / 2 + 24)},${r1(base - h - 6)} L${r1(x + w / 2 + 24)},${r1(base - h + 4)} L${r1(x - w / 2 - 24)},${r1(base - h + 4)} Z `;
  let windows = "";
  for (let f = 0; f < floors; f++) {
    const y = base - h + f * fh + 12;
    d += `M${r1(x - w / 2 - 10)},${r1(y + fh - 16)} L${r1(x + w / 2 + 10)},${r1(y + fh - 16)} L${r1(x + w / 2 + 10)},${r1(y + fh - 12)} L${r1(x - w / 2 - 10)},${r1(y + fh - 12)} Z `;
    for (let wx = x - w / 2 + 14; wx < x + w / 2 - 30; wx += 44) windows += `M${r1(wx)},${r1(y)} h30 v22 h-30 Z `;
  }
  return { d, windows };
}

/** Catenary strings of warm bulbs for dining scenes. */
export function stringLights(o: { y: number; sag: number; spans: number }): { wire: string; bulbs: string } {
  let wire = "";
  let bulbs = "";
  const span = W / o.spans;
  for (let s = 0; s < o.spans; s++) {
    const x0 = s * span;
    const x1 = x0 + span;
    wire += `M${r1(x0)},${r1(o.y)} Q${r1((x0 + x1) / 2)},${r1(o.y + o.sag * 2)} ${r1(x1)},${r1(o.y)} `;
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      const bx = x0 + span * t;
      const by = o.y + o.sag * 4 * t * (1 - t);
      bulbs += `M${r1(bx - 3)},${r1(by + 4)} a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 Z `;
    }
  }
  return { wire, bulbs };
}

/** Tables with diners and umbrellas in silhouette. */
export function diningTables(rng: Rng, base: number, count: number): string {
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = 120 + (i * (W - 240)) / Math.max(1, count - 1) + (rng() - 0.5) * 40;
    const s = between(rng, 0.85, 1.15);
    d += `M${r1(x - 50 * s)},${r1(base - 44 * s)} L${r1(x + 50 * s)},${r1(base - 44 * s)} L${r1(x + 50 * s)},${r1(base - 38 * s)} L${r1(x - 50 * s)},${r1(base - 38 * s)} Z `;
    d += `M${r1(x - 3)},${r1(base - 40 * s)} L${r1(x - 3)},${base + 10} L${r1(x + 3)},${base + 10} L${r1(x + 3)},${r1(base - 40 * s)} Z `;
    for (const side of [-1, 1]) {
      const px = x + side * 70 * s;
      d += `M${r1(px - 12 * s)},${base + 10} L${r1(px - 12 * s)},${r1(base - 60 * s)} Q${r1(px)},${r1(base - 76 * s)} ${r1(px + 12 * s)},${r1(base - 60 * s)} L${r1(px + 12 * s)},${base + 10} Z `;
      d += `M${r1(px - 9 * s)},${r1(base - 78 * s)} a${r1(9 * s)},${r1(10 * s)} 0 1,0 ${r1(18 * s)},0 a${r1(9 * s)},${r1(10 * s)} 0 1,0 ${r1(-18 * s)},0 Z `;
    }
    d += `M${r1(x - 1.5)},${r1(base - 44 * s)} L${r1(x - 1.5)},${r1(base - 160 * s)} L${r1(x + 1.5)},${r1(base - 160 * s)} L${r1(x + 1.5)},${r1(base - 44 * s)} Z `;
    d += `M${r1(x - 90 * s)},${r1(base - 150 * s)} Q${r1(x)},${r1(base - 200 * s)} ${r1(x + 90 * s)},${r1(base - 150 * s)} Z `;
  }
  return d;
}

/** A small boat silhouette. */
export function boat(x: number, y: number, s: number, sail = false): string {
  let d = `M${r1(x - 40 * s)},${r1(y - 8 * s)} L${r1(x + 40 * s)},${r1(y - 8 * s)} L${r1(x + 28 * s)},${r1(y + 6 * s)} L${r1(x - 30 * s)},${r1(y + 6 * s)} Z `;
  if (sail) d += `M${r1(x)},${r1(y - 8 * s)} L${r1(x)},${r1(y - 70 * s)} L${r1(x + 30 * s)},${r1(y - 12 * s)} Z`;
  else d += `M${r1(x - 10 * s)},${r1(y - 8 * s)} L${r1(x - 10 * s)},${r1(y - 20 * s)} L${r1(x + 14 * s)},${r1(y - 20 * s)} L${r1(x + 14 * s)},${r1(y - 8 * s)} Z`;
  return d;
}

/** Airport: control tower, terminal and runway edge lights in perspective. */
export function airport(base: number): { d: string; lights: string } {
  const tx = 1180;
  let d = `M${r1(tx - 10)},${base + 10} L${r1(tx - 8)},${r1(base - 200)} L${r1(tx + 8)},${r1(base - 200)} L${r1(tx + 10)},${base + 10} Z M${r1(tx - 34)},${r1(base - 200)} L${r1(tx - 26)},${r1(base - 238)} L${r1(tx + 26)},${r1(base - 238)} L${r1(tx + 34)},${r1(base - 200)} Z M${r1(tx - 2)},${r1(base - 238)} L${r1(tx - 2)},${r1(base - 270)} L${r1(tx + 2)},${r1(base - 270)} L${r1(tx + 2)},${r1(base - 238)} Z `;
  d += `M200,${base + 10} L200,${r1(base - 60)} Q640,${r1(base - 110)} 1080,${r1(base - 60)} L1080,${base + 10} Z`;
  let lights = "";
  for (let i = 0; i < 16; i++) {
    const t = i / 16;
    const y = base + 20 + t * t * 320;
    const spread = 120 + t * t * 900;
    const s = 2 + t * 5;
    for (const side of [-1, 1]) lights += `M${r1(800 + side * spread - s / 2)},${r1(y)} h${r1(s)} v${r1(s * 0.6)} h${r1(-s)} Z `;
  }
  return { d, lights };
}

/** Thin vertical waterfall strands. */
export function waterfall(rng: Rng, x: number, top: number, bottom: number): string {
  let d = "";
  for (let i = 0; i < 5; i++) {
    const sx = x + (rng() - 0.5) * 18;
    const w = between(rng, 1.5, 4);
    d += `M${r1(sx)},${r1(top)} L${r1(sx + w)},${r1(top)} L${r1(sx + w * 1.4)},${r1(bottom)} L${r1(sx - w * 0.4)},${r1(bottom)} Z `;
  }
  return d;
}

/** Strands of prayer flags as small quads along a sagging line. */
export function prayerFlags(x0: number, x1: number, y: number, sag: number): string {
  let d = "";
  const n = Math.floor((x1 - x0) / 22);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const fy = y + sag * 4 * t * (1 - t);
    d += `M${r1(x)},${r1(fy)} L${r1(x + 14)},${r1(fy + 2)} L${r1(x + 13)},${r1(fy + 17)} L${r1(x - 1)},${r1(fy + 15)} Z `;
  }
  return d;
}

/** Camel in profile, walking right. `y` is ground level. */
export function camel(x: number, y: number, s: number): string {
  const p = (fx: number, fy: number) => `${r1(x + fx * s)},${r1(y - fy * s)}`;
  return (
    `M${p(-22, 30)} C${p(-20, 44)} ${p(-10, 50)} ${p(-4, 46)} C${p(0, 54)} ${p(8, 54)} ${p(12, 44)} L${p(18, 42)} C${p(22, 52)} ${p(24, 58)} ${p(30, 60)} L${p(34, 57)} L${p(30, 54)} C${p(28, 46)} ${p(26, 36)} ${p(18, 32)} L${p(14, 30)} Z ` +
    `M${p(-18, 31)} L${p(-19, 0)} L${p(-16, 0)} L${p(-14, 30)} Z M${p(-10, 31)} L${p(-9, 0)} L${p(-6, 0)} L${p(-6, 30)} Z ` +
    `M${p(6, 31)} L${p(7, 0)} L${p(10, 0)} L${p(10, 30)} Z M${p(12, 31)} L${p(15, 0)} L${p(18, 0)} L${p(15, 30)} Z`
  );
}

export function birds(rng: Rng, count: number, x: number, y: number): string {
  let d = "";
  for (let i = 0; i < count; i++) {
    const bx = x + (rng() - 0.5) * 260;
    const by = y + (rng() - 0.5) * 90;
    const s = between(rng, 5, 10);
    d += `M${r1(bx - s)},${r1(by - s * 0.4)} Q${r1(bx - s * 0.4)},${r1(by - s * 0.5)} ${r1(bx)},${r1(by)} Q${r1(bx + s * 0.4)},${r1(by - s * 0.5)} ${r1(bx + s)},${r1(by - s * 0.4)} Q${r1(bx + s * 0.4)},${r1(by - s * 0.2)} ${r1(bx)},${r1(by + 1.5)} Q${r1(bx - s * 0.4)},${r1(by - s * 0.2)} ${r1(bx - s)},${r1(by - s * 0.4)} Z `;
  }
  return d;
}
