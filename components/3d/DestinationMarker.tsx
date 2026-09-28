"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { latLngToVector3 } from "@/lib/geo/land";
import type { GlobeMarker } from "./globeTypes";

interface DestinationMarkerProps {
  marker: GlobeMarker;
  hovered: boolean;
  active: boolean;
  reducedMotion: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const SAND = new THREE.Color("#d9ba8c");
const BONE = new THREE.Color("#f4efe6");
const tmp = new THREE.Vector3();

/**
 * A destination hotspot: a glowing core, a pulse ring lying on the surface and
 * a light beam that rises on hover. Labels are drawn by <LabelProjector>.
 */
export function DestinationMarker({ marker, hovered, active, reducedMotion, onHover, onSelect }: DestinationMarkerProps) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const facingRef = useRef(1);

  const position = useMemo(() => new THREE.Vector3(...latLngToVector3(marker.lat, marker.lng, 1.004)), [marker.lat, marker.lng]);
  const normal = useMemo(() => position.clone().normalize(), [position]);
  const phase = useMemo(() => (Math.abs(marker.lat * 13.7 + marker.lng * 7.3) % 1) as number, [marker.lat, marker.lng]);

  useLayoutEffect(() => {
    group.current?.lookAt(tmp.copy(position).multiplyScalar(2));
  }, [position]);

  const emphasis = hovered || active;

  useFrame((state, delta) => {
    const facing = normal.dot(tmp.copy(state.camera.position).normalize());
    facingRef.current = facing;
    const k = 1 - Math.exp(-delta * 10);

    if (ring.current) {
      const t = reducedMotion ? 0.35 : (state.clock.elapsedTime * 0.55 + phase) % 1;
      const s = 1 + t * (emphasis ? 2.8 : 1.9);
      ring.current.scale.setScalar(s);
      const mat = ring.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * (marker.dimmed ? 0.12 : emphasis ? 0.95 : 0.6);
    }
    if (core.current) {
      const target = emphasis ? 1.7 : marker.dimmed ? 0.7 : 1;
      core.current.scale.setScalar(THREE.MathUtils.lerp(core.current.scale.x, target, k));
      (core.current.material as THREE.MeshBasicMaterial).color.copy(emphasis ? BONE : SAND);
    }
    if (beam.current) {
      const h = emphasis ? 0.16 : marker.dimmed ? 0.02 : 0.055;
      const next = THREE.MathUtils.lerp(beam.current.scale.y, h, k);
      beam.current.scale.y = next;
      beam.current.position.z = next / 2;
      (beam.current.material as THREE.MeshBasicMaterial).opacity = marker.dimmed ? 0.15 : emphasis ? 0.9 : 0.5;
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (facingRef.current < 0.15) return;
    onHover(marker.id);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    onHover(null);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6 || facingRef.current < 0.15) return;
    onSelect(marker.id);
  };

  return (
    <group ref={group} position={position}>
      <mesh ref={core}>
        <sphereGeometry args={[0.0085, 16, 16]} />
        <meshBasicMaterial color={SAND} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.0125, 0.0155, 48]} />
        <meshBasicMaterial color={SAND} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={beam} rotation-x={Math.PI / 2} scale={[1, 0.055, 1]}>
        <cylinderGeometry args={[0.0011, 0.0011, 1, 6]} />
        <meshBasicMaterial color={SAND} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Generous invisible hit area, so hotspots are easy to hover and tap. */}
      <mesh position-z={0.012} onPointerOver={over} onPointerOut={out} onClick={click}>
        <sphereGeometry args={[0.042, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Where the traveller departs from — a quiet ocean-blue ring, never interactive. */
export function OriginMarker({ lat, lng }: { lat: number; lng: number }) {
  const position = useMemo(() => new THREE.Vector3(...latLngToVector3(lat, lng, 1.004)), [lat, lng]);
  const group = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    group.current?.lookAt(tmp.copy(position).multiplyScalar(2));
  }, [position]);
  return (
    <group ref={group} position={position}>
      <mesh>
        <ringGeometry args={[0.009, 0.0125, 40]} />
        <meshBasicMaterial color="#7fb3de" transparent opacity={0.95} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
