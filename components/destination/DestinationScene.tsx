"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useInViewport } from "@/hooks/useInViewport";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { cn } from "@/lib/cn";
import { composeScene, withTime, type ComposedScene, type SceneId } from "@/lib/scene/compose";
import { rgba } from "@/lib/scene/color";
import type { SceneConfig, TimeOfDay } from "@/lib/types";

const cache = new Map<string, ComposedScene>();

function getScene(id: SceneId, config: SceneConfig, time?: TimeOfDay): ComposedScene {
  const palette = time ? withTime(config.palette, time) : config.palette;
  const key = `${id}|${config.seed}|${palette.time}|${palette.skyTop}|${palette.land}`;
  let scene = cache.get(key);
  if (!scene) {
    scene = composeScene(id, palette, config.seed);
    if (cache.size > 48) cache.delete(cache.keys().next().value as string);
    cache.set(key, scene);
  }
  return scene;
}

interface DestinationSceneProps {
  scene: SceneConfig;
  /** Render a journey stage set instead of the destination's own composition. */
  sceneId?: SceneId;
  time?: TimeOfDay;
  className?: string;
  parallax?: boolean;
  /** Compose immediately rather than waiting for the viewport (heroes). */
  priority?: boolean;
  /** Slow drift — for large, idle hero moments. */
  drift?: boolean;
  label?: string;
  image?: { src: string; alt: string };
  children?: ReactNode;
}

/**
 * Procedural destination imagery: layered silhouettes with aerial perspective,
 * sun/moon, water and lights. Deterministic, lightweight, and never 404s.
 * If a photograph is supplied it is shown instead, falling back to the scene on error.
 */
export function DestinationScene({ scene, sceneId, time, className, parallax, priority, drift, label, image, children }: DestinationSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[:«»]/g, "");
  const near = useInViewport(ref, { rootMargin: "400px", once: true });
  const [imageFailed, setImageFailed] = useState(false);
  const [mounted, setMounted] = useState(false);
  usePointerParallax(ref, !!parallax);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const ready = mounted && (priority || near);
  const composed = useMemo(() => (ready ? getScene(sceneId ?? scene.kind, scene, time) : null), [ready, sceneId, scene, time]);
  const palette = time ? withTime(scene.palette, time) : scene.palette;
  const showImage = image && !imageFailed;

  const skyStyle: CSSProperties = {
    background: `linear-gradient(180deg, ${palette.skyTop} 0%, ${palette.skyMid} 42%, ${palette.horizon} 68%, ${palette.land} 100%)`,
  };

  return (
    <div
      ref={ref}
      className={cn(/\b(absolute|fixed)\b/.test(className ?? "") ? undefined : "relative", "isolate overflow-hidden bg-ink-900", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className="absolute inset-0" style={skyStyle} />
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- optional remote/local photography with graceful fallback
        <img src={image.src} alt={image.alt} className="absolute inset-0 size-full object-cover" onError={() => setImageFailed(true)} loading={priority ? "eager" : "lazy"} />
      ) : (
        composed && (
          <div className={cn("absolute inset-0", drift && "animate-drift")}>
          <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="scene-fade-in absolute inset-0 size-full">
            <defs>
              <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={composed.sky.top} />
                <stop offset={(composed.horizonY / 1000) * 0.55} stopColor={composed.sky.mid} />
                <stop offset={composed.horizonY / 1000} stopColor={composed.sky.horizon} />
                <stop offset="1" stopColor={composed.sky.horizon} />
              </linearGradient>
              {composed.sun && (
                <radialGradient id={`${uid}-sun`}>
                  <stop offset="0" stopColor={composed.sun.color} stopOpacity={composed.sun.moon ? 0.35 : 0.65} />
                  <stop offset="0.35" stopColor={composed.sun.color} stopOpacity={composed.sun.moon ? 0.08 : 0.22} />
                  <stop offset="1" stopColor={composed.sun.color} stopOpacity="0" />
                </radialGradient>
              )}
              {composed.water && (
                <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={composed.water.highlight} />
                  <stop offset="0.35" stopColor={composed.water.color} />
                  <stop offset="1" stopColor={palette.land} />
                </linearGradient>
              )}
              <linearGradient id={`${uid}-haze`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={palette.horizon} stopOpacity="0" />
                <stop offset="0.6" stopColor={palette.horizon} stopOpacity="0.35" />
                <stop offset="1" stopColor={palette.horizon} stopOpacity="0" />
              </linearGradient>
              {composed.layers
                .filter((l) => l.clip)
                .map((l) => (
                  <clipPath key={l.key} id={`${uid}-clip-${l.key}`}>
                    <path d={l.clip} />
                  </clipPath>
                ))}
            </defs>

            <rect x="-100" y="-100" width="1800" height="1200" fill={`url(#${uid}-sky)`} />
            {composed.stars && <path d={composed.stars} fill="#ffffff" opacity={palette.time === "night" ? 0.75 : 0.4} />}
            {composed.sun && (
              <g className="scene-layer" style={{ "--depth": 0.04 } as CSSProperties}>
                <circle cx={composed.sun.x} cy={composed.sun.y} r={composed.sun.r * 6} fill={`url(#${uid}-sun)`} />
                <circle cx={composed.sun.x} cy={composed.sun.y} r={composed.sun.r} fill={composed.sun.color} opacity={composed.sun.moon ? 0.9 : 1} />
              </g>
            )}
            {composed.water && (
              <rect
                className="scene-layer"
                style={{ "--depth": 0.15 } as CSSProperties}
                x="-100"
                y={composed.water.top}
                width="1800"
                height={1100 - composed.water.top}
                fill={`url(#${uid}-water)`}
              />
            )}
            <rect x="-100" y={composed.horizonY - 140} width="1800" height="200" fill={`url(#${uid}-haze)`} />
            {composed.layers.map((l) => (
              <g key={l.key} className="scene-layer" style={{ "--depth": l.depth } as CSSProperties}>
                <path
                  d={l.d}
                  fill={l.fill}
                  opacity={l.opacity}
                  stroke={l.stroke ? rgba(palette.land, 1) : undefined}
                  strokeWidth={l.stroke}
                  clipPath={l.clip ? `url(#${uid}-clip-${l.key})` : undefined}
                />
              </g>
            ))}
          </svg>
          </div>
        )
      )}
      {children}
    </div>
  );
}
