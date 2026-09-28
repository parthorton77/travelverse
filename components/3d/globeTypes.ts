/** Public types for the reusable Globe ("3D Destination Engine"). */

export interface GlobeMarker {
  id: string;
  name: string;
  subtitle?: string;
  lat: number;
  lng: number;
  /** Faded and non-interactive-looking (e.g. filtered out by category). */
  dimmed?: boolean;
}

export interface GlobeOrigin {
  name: string;
  lat: number;
  lng: number;
}

export type GlobeCommand =
  | { type: "focus"; id: string; nonce: number }
  | { type: "enter"; id: string; nonce: number };

export interface GlobeController {
  focus: (lat: number, lng: number, distance?: number) => void;
  enter: (lat: number, lng: number) => void;
  zoom: (factor: number) => void;
  rotate: (dAzimuth: number, dPolar: number) => void;
}

export interface GlobeSceneProps {
  markers: GlobeMarker[];
  hoveredId: string | null;
  activeId: string | null;
  origin: GlobeOrigin | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  initialView: { lat: number; lng: number };
  /** Horizontal shift of the globe within the canvas, as a fraction of width. */
  offsetX: number;
  distance: number;
  quality: "high" | "low";
  paused: boolean;
  reducedMotion: boolean;
  controllerRef: { current: GlobeController | null };
  /** DOM label layer (owned by <Globe>) whose children the scene positions each frame. */
  labels: { current: HTMLElement | null };
  /** Labels closer than this many px to the right edge are hidden (keeps overlaid UI clear). */
  labelInsetRight: number;
  onReady?: () => void;
  onContextLost?: () => void;
}
