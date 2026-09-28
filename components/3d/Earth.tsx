"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { LANDMASK_COLS, LANDMASK_ROWS } from "@/lib/geo/landmask";
import { createLandDots, getLandGrid } from "@/lib/geo/land";
import { atmosphereFragment, atmosphereVertex, dotsFragment, dotsVertex, surfaceFragment, surfaceVertex } from "./shaders";

/** World-space sun direction, updated every frame relative to the camera. */
export const sunDirection = new THREE.Vector3(1, 0.3, 0.5).normalize();
const UP = new THREE.Vector3(0, 1, 0);

function createMaskTexture() {
  const grid = getLandGrid();
  const data = new Uint8Array(grid.length);
  for (let i = 0; i < grid.length; i++) data[i] = grid[i] * 255;
  const tex = new THREE.DataTexture(data, LANDMASK_COLS, LANDMASK_ROWS, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function Earth({ quality }: { quality: "high" | "low" }) {
  const dpr = useThree((s) => s.viewport.dpr);

  const mask = useMemo(() => createMaskTexture(), []);

  const surface = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: surfaceVertex,
        fragmentShader: surfaceFragment,
        uniforms: {
          uMask: { value: mask },
          uSunDir: { value: sunDirection.clone() },
          uOceanDay: { value: new THREE.Color("#0f1c28") },
          uOceanNight: { value: new THREE.Color("#04070b") },
          uLand: { value: new THREE.Color("#233340") },
          uRim: { value: new THREE.Color("#2c5a84") },
          uGrid: { value: 0.05 },
        },
      }),
    [mask],
  );

  const dots = useMemo(() => {
    const land = createLandDots(quality === "high" ? 110_000 : 50_000);
    const geo = new THREE.BufferGeometry();
    const pos = land.positions.slice();
    for (let i = 0; i < pos.length; i++) pos[i] *= 1.0035;
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(land.seeds, 1));
    geo.computeBoundingSphere();
    return geo;
  }, [quality]);

  const dotsMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dotsVertex,
        fragmentShader: dotsFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uSize: { value: quality === "high" ? 4.6 : 5.4 },
          uPixelRatio: { value: dpr },
          uSunDir: { value: sunDirection.clone() },
          uDay: { value: new THREE.Color("#eadfca") },
          uNight: { value: new THREE.Color("#2b4763") },
          uCity: { value: new THREE.Color("#ffb46a") },
          uTime: { value: 0 },
        },
      }),
    // dpr is synced in the frame loop; rebuilding the material for it is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quality],
  );

  const atmosphere = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color("#3e73a8") }, uIntensity: { value: 0.85 } },
      }),
    [],
  );

  useEffect(
    () => () => {
      mask.dispose();
      surface.dispose();
      dots.dispose();
      dotsMaterial.dispose();
      atmosphere.dispose();
    },
    [mask, surface, dots, dotsMaterial, atmosphere],
  );

  useFrame((state) => {
    // Sun sits ahead-right of the camera so a crescent of night (with city lights) frames the left limb.
    sunDirection.copy(state.camera.position).normalize().applyAxisAngle(UP, 1.18);
    sunDirection.y += 0.3;
    sunDirection.normalize();
    surface.uniforms.uSunDir.value.copy(sunDirection);
    dotsMaterial.uniforms.uSunDir.value.copy(sunDirection);
    dotsMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    dotsMaterial.uniforms.uPixelRatio.value = state.viewport.dpr;
  });

  return (
    <group>
      {/* The surface occludes pointer events so markers on the far side can't be hovered through it. */}
      <mesh material={surface} onPointerMove={(e) => e.stopPropagation()} onPointerOver={(e) => e.stopPropagation()}>
        <sphereGeometry args={[1, quality === "high" ? 112 : 64, quality === "high" ? 112 : 64]} />
      </mesh>
      <points geometry={dots} material={dotsMaterial} renderOrder={2} />
      <mesh scale={1.17} material={atmosphere} renderOrder={1}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
    </group>
  );
}
