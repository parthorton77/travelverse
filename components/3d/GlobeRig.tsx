"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { latLngToVector3 } from "@/lib/geo/land";
import type { GlobeController } from "./globeTypes";

interface Flight {
  fromDir: THREE.Vector3;
  rotation: THREE.Quaternion;
  fromDist: number;
  toDist: number;
  t: number;
  duration: number;
  hold: boolean;
}

const MIN_DIST = 1.55;
const MAX_DIST = 6;
const IDLE_BEFORE_SPIN_MS = 3500;
const identity = new THREE.Quaternion();
const q = new THREE.Quaternion();
const dir = new THREE.Vector3();

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface GlobeRigProps {
  controllerRef: { current: GlobeController | null };
  hovering: boolean;
  reducedMotion: boolean;
  defaultDistance: number;
}

/**
 * Owns every scripted camera move: focusing a destination, diving in for the
 * cinematic transition, keyboard rotation and zoom. Free orbiting is left to
 * OrbitControls; the rig only takes over while a move is in flight.
 */
export function GlobeRig({ controllerRef, hovering, reducedMotion, defaultDistance }: GlobeRigProps) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const flight = useRef<Flight | null>(null);
  const lastInteraction = useRef(0);
  const hoveringRef = useRef(hovering);
  useEffect(() => {
    hoveringRef.current = hovering;
  }, [hovering]);

  useEffect(() => {
    if (!controls) return;
    const mark = () => {
      lastInteraction.current = performance.now();
      flight.current = flight.current?.hold ? flight.current : null;
    };
    controls.addEventListener("start", mark);
    controls.addEventListener("end", mark);
    return () => {
      controls.removeEventListener("start", mark);
      controls.removeEventListener("end", mark);
    };
  }, [controls]);

  useEffect(() => {
    const flyTo = (target: THREE.Vector3, toDist: number, duration: number, hold = false) => {
      const fromDir = camera.position.clone().normalize();
      const rotation = new THREE.Quaternion().setFromUnitVectors(fromDir, target.clone().normalize());
      flight.current = {
        fromDir,
        rotation,
        fromDist: camera.position.length(),
        toDist: THREE.MathUtils.clamp(toDist, 1.2, MAX_DIST),
        t: 0,
        duration: reducedMotion ? 0.001 : duration,
        hold,
      };
      lastInteraction.current = performance.now();
    };

    controllerRef.current = {
      focus: (lat, lng, distance) => {
        // Aim slightly south of the target so the marker sits a touch above centre.
        const v = new THREE.Vector3(...latLngToVector3(lat - 6, lng));
        flyTo(v, distance ?? Math.min(camera.position.length(), defaultDistance), 1.3);
      },
      enter: (lat, lng) => {
        const v = new THREE.Vector3(...latLngToVector3(lat - 2, lng));
        flyTo(v, 1.24, 1.55, true);
      },
      zoom: (factor) => {
        const d = THREE.MathUtils.clamp(camera.position.length() * factor, MIN_DIST, MAX_DIST);
        flyTo(camera.position.clone(), d, 0.45);
      },
      rotate: (dAzimuth, dPolar) => {
        const s = new THREE.Spherical().setFromVector3(camera.position);
        s.theta += dAzimuth;
        s.phi = THREE.MathUtils.clamp(s.phi + dPolar, 0.35, Math.PI - 0.35);
        flyTo(new THREE.Vector3().setFromSpherical(s), s.radius, 0.4);
      },
    };
    return () => {
      controllerRef.current = null;
    };
  }, [camera, controllerRef, defaultDistance, reducedMotion]);

  useFrame((_, delta) => {
    const f = flight.current;
    if (controls) {
      const idle = performance.now() - lastInteraction.current > IDLE_BEFORE_SPIN_MS;
      controls.autoRotate = !reducedMotion && idle && !hoveringRef.current && !f;
      controls.enabled = !f?.hold;
    }
    if (!f) return;
    f.t = Math.min(1, f.t + delta / f.duration);
    const e = ease(f.t);
    q.copy(identity).slerp(f.rotation, e);
    dir.copy(f.fromDir).applyQuaternion(q);
    camera.position.copy(dir.multiplyScalar(THREE.MathUtils.lerp(f.fromDist, f.toDist, e)));
    camera.lookAt(0, 0, 0);
    if (f.t >= 1 && !f.hold) {
      flight.current = null;
      controls?.update();
    }
  });

  return null;
}
