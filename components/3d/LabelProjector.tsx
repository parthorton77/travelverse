"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { latLngToVector3 } from "@/lib/geo/land";
import type { GlobeMarker, GlobeOrigin } from "./globeTypes";

const v = new THREE.Vector3();
const camDir = new THREE.Vector3();

interface LabelProjectorProps {
  markers: GlobeMarker[];
  origin: GlobeOrigin | null;
  /** Layer whose children carry `data-label-id`; owned by <Globe>, outside the canvas. */
  labels: { current: HTMLElement | null };
  insetRight?: number;
}

/**
 * Projects marker positions to screen space every frame and moves plain DOM
 * labels that live outside the canvas. One pass, no extra React roots, and
 * labels fade out as their marker rotates behind the limb.
 */
export function LabelProjector({ markers, origin, labels, insetRight = 0 }: LabelProjectorProps) {
  const size = useThree((s) => s.size);
  const points = useMemo(() => {
    const map = new Map<string, { pos: THREE.Vector3; dimmed: boolean }>();
    for (const m of markers) map.set(m.id, { pos: new THREE.Vector3(...latLngToVector3(m.lat, m.lng, 1.03)), dimmed: !!m.dimmed });
    if (origin) map.set("__origin", { pos: new THREE.Vector3(...latLngToVector3(origin.lat, origin.lng, 1.01)), dimmed: false });
    return map;
  }, [markers, origin]);

  useFrame(({ camera }) => {
    const layer = labels.current;
    if (!layer) return;
    camDir.copy(camera.position).normalize();
    const placed: { x: number; y: number }[] = [];
    let origin: { el: HTMLElement; x: number; y: number; opacity: number } | null = null;
    for (const child of Array.from(layer.children)) {
      const el = child as HTMLElement;
      const id = el.dataset.labelId;
      const p = id ? points.get(id) : undefined;
      if (!p) continue;
      const facing = v.copy(p.pos).normalize().dot(camDir);
      v.copy(p.pos).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const edgeFade = insetRight ? Math.max(0, Math.min(1, (size.width - insetRight - x) / 60)) : 1;
      const opacity = facing < 0.2 ? 0 : Math.min(1, (facing - 0.2) / 0.15) * (p.dimmed ? 0.35 : 1) * edgeFade;
      if (id === "__origin") {
        origin = { el, x, y, opacity };
        continue;
      }
      el.style.opacity = opacity.toFixed(2);
      // Neighbouring labels would collide: flip this one below its marker.
      if (opacity > 0) {
        const clash = placed.some((q) => Math.abs(q.x - x) < 110 && Math.abs(q.y - y) < 30);
        const below = clash ? "1" : "0";
        if (el.dataset.below !== below) el.dataset.below = below;
        placed.push({ x, y: clash ? y + 40 : y });
      }
    }
    // The origin label is secondary: it yields to any destination label nearby.
    if (origin) {
      const o = origin;
      const crowded = placed.some((q) => Math.abs(q.x - o.x) < 120 && Math.abs(q.y - (o.y + 40)) < 34);
      o.el.style.opacity = crowded ? "0" : o.opacity.toFixed(2);
    }
  });

  return null;
}
