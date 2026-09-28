"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { latLngToVector3 } from "@/lib/geo/land";
import { arcFragment, arcVertex } from "./shaders";

interface Point {
  lat: number;
  lng: number;
}

function buildArc(from: Point, to: Point, radius: number) {
  const a = new THREE.Vector3(...latLngToVector3(from.lat, from.lng, 1.004));
  const b = new THREE.Vector3(...latLngToVector3(to.lat, to.lng, 1.004));
  const angle = a.angleTo(b);
  const lift = 0.06 + angle * 0.3;
  const mid = a.clone().add(b).normalize().multiplyScalar(1 + lift);
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  return { geometry: new THREE.TubeGeometry(curve, 120, radius, 6, false), curve };
}

interface FlightArcProps {
  from: Point;
  to: Point;
  color?: string;
  /** "reveal" draws once from origin to destination; "traffic" loops a comet. */
  mode?: "reveal" | "traffic";
  speed?: number;
  opacity?: number;
  phase?: number;
  reducedMotion?: boolean;
}

/** Great-circle-ish flight path rendered as a thin tube with an animated shader. */
export function FlightArc({ from, to, color = "#d9ba8c", mode = "reveal", speed = 0.25, opacity = 1, phase = 0, reducedMotion }: FlightArcProps) {
  const { geometry, curve } = useMemo(
    () => buildArc({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }, mode === "reveal" ? 0.0026 : 0.0016),
    [from.lat, from.lng, to.lat, to.lng, mode],
  );
  const plane = useRef<THREE.Mesh>(null);
  const progress = useRef(reducedMotion ? 1 : 0);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: arcVertex,
        fragmentShader: arcFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uProgress: { value: reducedMotion ? 1 : 0 },
          uTime: { value: 0 },
          uMode: { value: mode === "reveal" ? 0 : 1 },
          uOpacity: { value: opacity },
        },
      }),
    [color, mode, opacity, reducedMotion],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((state, delta) => {
    if (mode === "reveal") {
      progress.current = Math.min(1, progress.current + delta / 1.1);
      material.uniforms.uProgress.value = 1 - Math.pow(1 - progress.current, 3);
      material.uniforms.uTime.value = state.clock.elapsedTime;
      if (plane.current) {
        const p = material.uniforms.uProgress.value as number;
        plane.current.position.copy(curve.getPoint(p));
        plane.current.visible = p < 0.999;
      }
    } else {
      material.uniforms.uTime.value = reducedMotion ? 0.5 : state.clock.elapsedTime * speed + phase;
    }
  });

  return (
    <group>
      <mesh geometry={geometry} material={material} renderOrder={3} />
      {mode === "reveal" && (
        <mesh ref={plane} renderOrder={4}>
          <sphereGeometry args={[0.007, 12, 12]} />
          <meshBasicMaterial color="#fff6e6" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** Ambient air traffic between real hubs, so the planet feels inhabited. */
const ROUTES: [Point, Point][] = [
  [{ lat: 19.08, lng: 72.88 }, { lat: 25.2, lng: 55.27 }], // Mumbai → Dubai
  [{ lat: 28.61, lng: 77.21 }, { lat: 51.47, lng: -0.45 }], // Delhi → London
  [{ lat: 25.2, lng: 55.27 }, { lat: 40.64, lng: -73.78 }], // Dubai → New York
  [{ lat: 1.36, lng: 103.99 }, { lat: 35.55, lng: 139.78 }], // Singapore → Tokyo
  [{ lat: 12.97, lng: 77.59 }, { lat: 1.36, lng: 103.99 }], // Bengaluru → Singapore
  [{ lat: 48.86, lng: 2.35 }, { lat: 40.64, lng: -73.78 }], // Paris → New York
  [{ lat: 1.36, lng: 103.99 }, { lat: -8.75, lng: 115.17 }], // Singapore → Bali
];

export function TrafficArcs({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      {ROUTES.map(([a, b], i) => (
        <FlightArc
          key={i}
          from={a}
          to={b}
          mode="traffic"
          color="#8fb8dc"
          opacity={0.55}
          speed={0.09 + (i % 3) * 0.025}
          phase={i * 0.37}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
