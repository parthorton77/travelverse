"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useId, useMemo } from "react";
import { DNA_META, rankDimensions } from "@/lib/dna";
import { DNA_DIMENSIONS, type TravelDNA } from "@/lib/types";

const RINGS = 14;
const R_MIN = 38;
const R_MAX = 232;

function smoothClosed(points: [number, number][], tension = 1): string {
  const n = points.length;
  const p = (i: number) => points[(i + n) % n];
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    const c1x = x1 + ((x2 - x0) / 6) * tension;
    const c1y = y1 + ((y2 - y0) / 6) * tension;
    const c2x = x2 - ((x3 - x1) / 6) * tension;
    const c2y = y2 - ((y3 - y1) / 6) * tension;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
  return `${d} Z`;
}

/**
 * A traveller's identity as a generative mark: fourteen concentric contours,
 * each shaped by the seven DNA dimensions and slightly twisted, like a
 * fingerprint drawn by where you want to go.
 */
export function DnaSignature({ dna, className }: { dna: TravelDNA; className?: string }) {
  const uid = useId().replace(/[:«»]/g, "");
  const reduce = usePrefersReducedMotion();
  const [primary, secondary] = rankDimensions(dna);

  const rings = useMemo(() => {
    return Array.from({ length: RINGS }, (_, k) => {
      const t = (k + 1) / RINGS;
      const twist = (k * 2.2 * Math.PI) / 180;
      const pts = DNA_DIMENSIONS.map((dim, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / DNA_DIMENSIONS.length + twist;
        const wobble = Math.sin(k * 1.7 + i * 2.3) * 3.5 * t;
        const r = R_MIN + (dna[dim] / 100) * (R_MAX - R_MIN) * (0.2 + 0.8 * t) + wobble + t * 6;
        return [Math.cos(angle) * r, Math.sin(angle) * r] as [number, number];
      });
      return { d: smoothClosed(pts), t };
    });
  }, [dna]);

  const axes = DNA_DIMENSIONS.map((dim, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / DNA_DIMENSIONS.length;
    const r = R_MIN + (dna[dim] / 100) * (R_MAX - R_MIN) + 6;
    return { dim, angle, tip: [Math.cos(angle) * r, Math.sin(angle) * r] as const, label: [Math.cos(angle) * (R_MAX + 38), Math.sin(angle) * (R_MAX + 38)] as const };
  });

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 70, damping: 18, mass: 0.8 };

  return (
    <svg viewBox="-380 -315 760 630" className={className} role="img" aria-label={`Travel DNA signature: strongest in ${DNA_META[primary].label} and ${DNA_META[secondary].label}`}>
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
          <motion.stop offset="0" animate={{ stopColor: DNA_META[primary].color }} transition={{ duration: 0.8 }} />
          <motion.stop offset="1" animate={{ stopColor: DNA_META[secondary].color }} transition={{ duration: 0.8 }} />
        </linearGradient>
        <radialGradient id={`${uid}-core`}>
          <stop offset="0" stopColor="#ede8df" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ede8df" stopOpacity="0" />
        </radialGradient>
      </defs>

      {axes.map((a) => (
        <line key={a.dim} x1={0} y1={0} x2={Math.cos(a.angle) * R_MAX} y2={Math.sin(a.angle) * R_MAX} stroke="rgba(255,255,255,0.06)" />
      ))}
      <circle r={R_MAX} fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 6" />

      {/* Rotate about the signature's own centre (user-space 0,0), not the viewBox box. */}
      <g className={reduce ? undefined : "animate-[orbit_140s_linear_infinite]"} style={{ transformOrigin: "0px 0px" }}>
        {rings.map((ring, k) => (
          <motion.path
            key={k}
            initial={false}
            animate={{ d: ring.d }}
            transition={spring}
            fill="none"
            stroke={`url(#${uid}-g)`}
            strokeWidth={k === RINGS - 1 ? 1.6 : 1}
            strokeOpacity={0.12 + 0.7 * ring.t}
          />
        ))}
      </g>

      {axes.map((a) => (
        <g key={`tip-${a.dim}`}>
          <motion.circle initial={false} animate={{ cx: a.tip[0], cy: a.tip[1] }} transition={spring} r={a.dim === primary ? 4 : 2.5} fill={DNA_META[a.dim].color} />
          <text
            x={a.label[0]}
            y={a.label[1]}
            textAnchor={Math.abs(a.label[0]) < 20 ? "middle" : a.label[0] > 0 ? "start" : "end"}
            dominantBaseline="middle"
            className="fill-current font-mono text-[11px] uppercase tracking-[0.18em]"
            fill={a.dim === primary ? "#ede8df" : "#8f949c"}
          >
            {DNA_META[a.dim].label}
          </text>
        </g>
      ))}
      <circle r="26" fill={`url(#${uid}-core)`} opacity="0.35" />
    </svg>
  );
}
