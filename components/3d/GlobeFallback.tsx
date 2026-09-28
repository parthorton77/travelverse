"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createLandDots, type LandDots } from "@/lib/geo/land";
import type { GlobeController, GlobeMarker, GlobeOrigin } from "./globeTypes";

interface GlobeFallbackProps {
  markers: GlobeMarker[];
  hoveredId: string | null;
  activeId: string | null;
  origin: GlobeOrigin | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  initialView: { lat: number; lng: number };
  offsetX: number;
  reducedMotion: boolean;
  controllerRef: { current: GlobeController | null };
}

let dotsCache: LandDots | null = null;
const RAD = Math.PI / 180;

/**
 * High-quality 2D globe for devices without WebGL (or after a GPU failure).
 * Same land data, orthographic projection, drag to rotate, click markers.
 */
export function GlobeFallback(props: GlobeFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  // The draw loop reads the latest props without restarting.
  useLayoutEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    dotsCache ??= createLandDots(16000);
    const dots = dotsCache;

    const view = { lng: propsRef.current.initialView.lng, lat: Math.max(-35, Math.min(35, propsRef.current.initialView.lat)), zoom: 1 };
    const target = { ...view };
    let dragging: { x: number; y: number; lng: number; lat: number } | null = null;
    let lastInteraction = 0;
    let frame = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const geometry = () => {
      const R = Math.min(w, h) * 0.36 * view.zoom;
      return { R, cx: w * (0.5 + propsRef.current.offsetX), cy: h / 2 };
    };

    const project = (lat: number, lng: number) => {
      const { R, cx, cy } = geometry();
      const φ = lat * RAD;
      const λ = (lng - view.lng) * RAD;
      const φ0 = view.lat * RAD;
      const cosc = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ);
      return {
        x: cx + R * Math.cos(φ) * Math.sin(λ),
        y: cy - R * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ)),
        visible: cosc > 0,
        depth: cosc,
      };
    };

    propsRef.current.controllerRef.current = {
      focus: (lat, lng) => {
        target.lng = lng;
        target.lat = Math.max(-35, Math.min(35, lat));
        lastInteraction = performance.now();
      },
      enter: (lat, lng) => {
        target.lng = lng;
        target.lat = Math.max(-35, Math.min(35, lat));
        target.zoom = 2.6;
        lastInteraction = performance.now() + 1e9;
      },
      zoom: (f) => {
        target.zoom = Math.max(0.7, Math.min(2.2, target.zoom / f));
      },
      rotate: (dAz, dPolar) => {
        target.lng -= dAz / RAD;
        target.lat = Math.max(-35, Math.min(35, target.lat + dPolar / RAD));
        lastInteraction = performance.now();
      },
    };

    const draw = () => {
      const p = propsRef.current;
      const { R, cx, cy } = geometry();
      const idle = performance.now() - lastInteraction > 3500;
      if (!dragging && idle && !p.reducedMotion && !p.hoveredId) target.lng += 0.04;
      const k = p.reducedMotion ? 1 : 0.08;
      let dl = target.lng - view.lng;
      dl = ((dl + 540) % 360) - 180;
      view.lng += dl * k;
      view.lat += (target.lat - view.lat) * k;
      view.zoom += (target.zoom - view.zoom) * k;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
      halo.addColorStop(0, "rgba(77,143,208,0.35)");
      halo.addColorStop(1, "rgba(77,143,208,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(cx + R * 0.35, cy - R * 0.3, R * 0.1, cx, cy, R);
      body.addColorStop(0, "#132433");
      body.addColorStop(1, "#04070b");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Batch dots into brightness buckets to keep draw calls low.
      const buckets: Path2D[] = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      const size = Math.max(1.2, R / 190);
      for (let i = 0; i < dots.count; i++) {
        const pt = project(dots.coords[i * 2], dots.coords[i * 2 + 1]);
        if (!pt.visible) continue;
        const light = Math.min(1, Math.max(0, (pt.x - cx) / R * 0.55 + 0.6)) * Math.min(1, pt.depth * 3);
        buckets[Math.min(3, Math.floor(light * 4))].rect(pt.x - size / 2, pt.y - size / 2, size, size);
      }
      const shades = ["rgba(60,95,130,0.55)", "rgba(140,150,160,0.6)", "rgba(210,200,182,0.75)", "rgba(236,226,206,0.95)"];
      buckets.forEach((b, i) => {
        ctx.fillStyle = shades[i];
        ctx.fill(b);
      });

      if (p.origin) {
        const o = project(p.origin.lat, p.origin.lng);
        if (o.visible) {
          ctx.strokeStyle = "#7fb3de";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(o.x, o.y, 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const t = performance.now() / 1000;
      ctx.font = "500 10px ui-monospace, monospace";
      for (const m of p.markers) {
        const pt = project(m.lat, m.lng);
        if (!pt.visible || pt.depth < 0.15) continue;
        const emphasis = m.id === p.hoveredId || m.id === p.activeId;
        const alpha = m.dimmed ? 0.3 : 1;
        // Positive modulo: southern latitudes must not produce a negative radius.
        const pulse = p.reducedMotion ? 0.4 : (((t * 0.6 + m.lat) % 1) + 1) % 1;
        ctx.strokeStyle = `rgba(217,186,140,${(1 - pulse) * 0.7 * alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4 + pulse * (emphasis ? 16 : 10), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = emphasis ? "#f4efe6" : `rgba(217,186,140,${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, emphasis ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        if (emphasis || w > 700) {
          ctx.fillStyle = emphasis ? "#f4efe6" : `rgba(189,184,174,${0.8 * alpha})`;
          ctx.fillText(m.name.toUpperCase(), pt.x + 9, pt.y - 8);
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    const hit = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      let best: { id: string; d: number } | null = null;
      for (const m of propsRef.current.markers) {
        const pt = project(m.lat, m.lng);
        if (!pt.visible || pt.depth < 0.15) continue;
        const d = Math.hypot(pt.x - x, pt.y - y);
        if (d < 22 && (!best || d < best.d)) best = { id: m.id, d };
      }
      return best?.id ?? null;
    };

    let moved = 0;
    const onDown = (e: PointerEvent) => {
      dragging = { x: e.clientX, y: e.clientY, lng: target.lng, lat: target.lat };
      moved = 0;
      lastInteraction = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - dragging.x;
        const dy = e.clientY - dragging.y;
        moved = Math.max(moved, Math.hypot(dx, dy));
        const { R } = geometry();
        target.lng = dragging.lng - (dx / R) * 57;
        target.lat = Math.max(-35, Math.min(35, dragging.lat + (dy / R) * 57));
        lastInteraction = performance.now();
      } else {
        const id = hit(e.clientX, e.clientY);
        if (id !== propsRef.current.hoveredId) propsRef.current.onHover(id);
        canvas.style.cursor = id ? "pointer" : "grab";
      }
    };
    const onUp = (e: PointerEvent) => {
      if (dragging && moved < 6) {
        const id = hit(e.clientX, e.clientY);
        if (id) propsRef.current.onSelect(id);
      }
      dragging = null;
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      propsRef.current.controllerRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full touch-pan-y" aria-hidden />;
}
