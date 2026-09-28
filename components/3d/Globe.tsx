"use client";

import dynamic from "next/dynamic";
import { Minus, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { OrbitLoader } from "@/components/ui/Loader";
import { useInViewport } from "@/hooks/useInViewport";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useWheelGuard } from "@/hooks/useWheelGuard";
import { cn } from "@/lib/cn";
import { GlobeFallback } from "./GlobeFallback";
import type { GlobeCommand, GlobeController, GlobeMarker, GlobeOrigin } from "./globeTypes";
import { WebGLErrorBoundary } from "./WebGLErrorBoundary";

const GlobeCanvas = dynamic(() => import("./GlobeCanvas"), {
  ssr: false,
  loading: () => <GlobeLoading />,
});

function GlobeLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <OrbitLoader label="Entering the world…" />
    </div>
  );
}

export interface GlobeProps {
  markers: GlobeMarker[];
  hoveredId?: string | null;
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  /** Imperative camera moves requested by the parent (focus, dive in). */
  command?: GlobeCommand | null;
  origin?: GlobeOrigin | null;
  initialView?: { lat: number; lng: number };
  /** Desktop horizontal offset of the globe, as a fraction of the canvas width. */
  offsetX?: number;
  className?: string;
  label?: string;
  showControls?: boolean;
  /** Keep marker labels clear of UI overlaid on the right edge (px). */
  labelInsetRight?: number;
}

/**
 * The 3D Destination Engine's globe, as a drop-in component.
 *
 * WebGL2 → lazy R3F scene. No WebGL or a GPU failure → 2D canvas globe.
 * Rendering pauses when off-screen. The wheel scrolls the page unless the
 * user pinches or holds ⌘/Ctrl, and the keyboard can rotate and zoom.
 */
export function Globe({
  markers,
  hoveredId = null,
  activeId = null,
  onHover = () => {},
  onSelect = () => {},
  command,
  origin = null,
  initialView = { lat: 18, lng: 72 },
  offsetX = 0,
  className,
  label = "Interactive globe of destinations",
  showControls = true,
  labelInsetRight = 0,
}: GlobeProps) {
  const webgl = useWebGLSupport();
  const [failed, setFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GlobeController | null>(null);
  const labelLayer = useRef<HTMLDivElement>(null);
  const inView = useInViewport(container, { rootMargin: "120px" });
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const hintId = useId();
  useWheelGuard(container);

  const markersRef = useRef(markers);
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    if (!command) return;
    const m = markersRef.current.find((x) => x.id === command.id);
    const ctrl = controllerRef.current;
    if (!m || !ctrl) return;
    if (command.type === "focus") ctrl.focus(m.lat, m.lng);
    else ctrl.enter(m.lat, m.lng);
  }, [command]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const ctrl = controllerRef.current;
    if (!ctrl || e.target !== e.currentTarget) return;
    const step = 0.35;
    const map: Record<string, () => void> = {
      ArrowLeft: () => ctrl.rotate(-step, 0),
      ArrowRight: () => ctrl.rotate(step, 0),
      ArrowUp: () => ctrl.rotate(0, -step * 0.6),
      ArrowDown: () => ctrl.rotate(0, step * 0.6),
      "+": () => ctrl.zoom(0.82),
      "=": () => ctrl.zoom(0.82),
      "-": () => ctrl.zoom(1.2),
    };
    const action = map[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  const useFallback = webgl === "unsupported" || failed;
  const effectiveOffset = isMobile ? 0 : offsetX;

  const fallback = (
    <GlobeFallback
      markers={markers}
      hoveredId={hoveredId}
      activeId={activeId}
      origin={origin}
      onHover={onHover}
      onSelect={onSelect}
      initialView={initialView}
      offsetX={effectiveOffset}
      reducedMotion={reducedMotion}
      controllerRef={controllerRef}
    />
  );

  const showAllLabels = !isMobile;

  return (
    <div
      ref={container}
      className={cn("globe-surface outline-none focus-visible:ring-1 focus-visible:ring-sand/50", className ?? "relative")}
      tabIndex={0}
      role="group"
      aria-roledescription="3D globe"
      aria-label={label}
      aria-describedby={hintId}
      onKeyDown={onKeyDown}
    >
      <p id={hintId} className="sr-only">
        Drag to rotate. Use arrow keys to rotate and plus or minus to zoom. Every destination on the globe is also listed as a button nearby.
      </p>

      {webgl === "checking" ? (
        <GlobeLoading />
      ) : useFallback ? (
        fallback
      ) : (
        <WebGLErrorBoundary onError={() => setFailed(true)} fallback={fallback}>
          <GlobeCanvas
            markers={markers}
            hoveredId={hoveredId}
            activeId={activeId}
            origin={origin}
            onHover={onHover}
            onSelect={onSelect}
            initialView={initialView}
            offsetX={effectiveOffset}
            distance={isMobile ? 4.1 : 3.95}
            quality={isMobile ? "low" : "high"}
            paused={!inView}
            reducedMotion={reducedMotion}
            controllerRef={controllerRef}
            labels={labelLayer}
            labelInsetRight={labelInsetRight}
            onContextLost={() => setFailed(true)}
          />
        </WebGLErrorBoundary>
      )}

      {/* Marker labels, positioned by the 3D scene each frame (the 2D fallback draws its own). */}
      {webgl === "supported" && !failed && (
        <div ref={labelLayer} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {markers.map((m) => {
            const emphasis = m.id === hoveredId || m.id === activeId;
            if (!showAllLabels && !emphasis) return null;
            return (
              <div key={m.id} data-label-id={m.id} className="group absolute left-0 top-0 opacity-0 will-change-transform">
                <div
                  className={cn(
                    "hud flex -translate-x-1/2 -translate-y-[170%] items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 backdrop-blur-md transition-[color,background-color,translate] duration-300 group-data-[below=1]:translate-y-[70%]",
                    emphasis ? "bg-bone text-ink-950" : "bg-ink-950/50 text-bone-dim",
                  )}
                >
                  <span>{m.name}</span>
                  {emphasis && m.subtitle && <span className="text-ink-950/55">{m.subtitle}</span>}
                </div>
              </div>
            );
          })}
          {origin && (
            <div data-label-id="__origin" className="absolute left-0 top-0 opacity-0 will-change-transform">
              <div className="hud -translate-x-1/2 translate-y-3 whitespace-nowrap text-[#9cc4e6]">From {origin.name}</div>
            </div>
          )}
        </div>
      )}

      {showControls && (
        <div className="absolute bottom-4 right-4 z-10 hidden flex-col gap-1.5 md:flex">
          <button
            type="button"
            className="glass grid size-9 place-items-center rounded-full text-bone-dim transition-colors hover:text-bone"
            aria-label="Zoom in"
            onClick={() => controllerRef.current?.zoom(0.8)}
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            className="glass grid size-9 place-items-center rounded-full text-bone-dim transition-colors hover:text-bone"
            aria-label="Zoom out"
            onClick={() => controllerRef.current?.zoom(1.25)}
          >
            <Minus className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
