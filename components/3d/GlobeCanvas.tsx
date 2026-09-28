"use client";

import { OrbitControls, PerformanceMonitor, Stars } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { latLngToVector3 } from "@/lib/geo/land";
import { DestinationMarker, OriginMarker } from "./DestinationMarker";
import { Earth } from "./Earth";
import { FlightArc, TrafficArcs } from "./FlightArc";
import { GlobeRig } from "./GlobeRig";
import { LabelProjector } from "./LabelProjector";
import type { GlobeSceneProps } from "./globeTypes";

/** Shifts the rendered frame horizontally so the globe can sit off-centre beside copy. */
function ViewOffset({ offsetX }: { offsetX: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    if (!offsetX) {
      camera.clearViewOffset();
      return;
    }
    camera.setViewOffset(size.width, size.height, -offsetX * size.width, 0, size.width, size.height);
    camera.updateProjectionMatrix();
    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, size.width, size.height, offsetX]);
  return null;
}

/**
 * The WebGL globe. Loaded lazily (client-only) by <Globe>, which also provides
 * the fallback and error boundary around it.
 */
export default function GlobeCanvas(props: GlobeSceneProps) {
  const { markers, hoveredId, activeId, origin, onHover, onSelect, initialView, offsetX, distance, quality, paused, reducedMotion, controllerRef } =
    props;
  const [dprCap, setDprCap] = useState(quality === "high" ? 1.75 : 1.4);

  const initialPosition = useMemo(() => {
    const v = latLngToVector3(initialView.lat, initialView.lng, distance);
    return v as [number, number, number];
    // Only the first view matters; later moves are the rig's job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routeTarget = markers.find((m) => m.id === (hoveredId ?? activeId));

  return (
    <Canvas
      className="!absolute inset-0"
      frameloop={paused ? "never" : "always"}
      dpr={[1, dprCap]}
      camera={{ fov: 38, near: 0.01, far: 200, position: initialPosition }}
      gl={{ antialias: quality === "high", alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          props.onContextLost?.();
        });
        props.onReady?.();
      }}
      onPointerMissed={() => onHover(null)}
    >
      <PerformanceMonitor onDecline={() => setDprCap(1)} />
      <ViewOffset offsetX={offsetX} />
      <Stars radius={60} depth={45} count={quality === "high" ? 2600 : 1100} factor={2.8} saturation={0} fade speed={reducedMotion ? 0 : 0.35} />
      <Earth quality={quality} />
      {quality === "high" && <TrafficArcs reducedMotion={reducedMotion} />}
      {origin && <OriginMarker lat={origin.lat} lng={origin.lng} />}
      {origin && routeTarget && (
        <FlightArc key={routeTarget.id} from={origin} to={routeTarget} mode="reveal" color="#e8c99a" reducedMotion={reducedMotion} />
      )}
      {markers.map((m) => (
        <DestinationMarker
          key={m.id}
          marker={m}
          hovered={hoveredId === m.id}
          active={activeId === m.id}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      <LabelProjector markers={markers} origin={origin} labels={props.labels} insetRight={props.labelInsetRight} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.45}
        zoomSpeed={0.6}
        minDistance={1.55}
        maxDistance={6}
        autoRotateSpeed={0.35}
      />
      <GlobeRig controllerRef={controllerRef} hovering={!!hoveredId} reducedMotion={reducedMotion} defaultDistance={distance} />
    </Canvas>
  );
}
