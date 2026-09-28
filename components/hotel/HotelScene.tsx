"use client";

import { CameraControls, ContactShadows, Environment, Lightformer, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { StaySpace, StaySpaceId } from "@/lib/types";
import { STAY_TIMES, type StayLighting, type StayTime } from "./stayTimes";

/**
 * Casa Maré — a concept resort built from primitives, lit like a place.
 * Units are metres. The sea lies toward −Z, the room wing faces it.
 */

// ── Materials ────────────────────────────────────────────────────────────────

function useMaterials(lighting: StayLighting) {
  const m = useMemo(
    () => ({
      stone: new THREE.MeshStandardMaterial({ color: "#d8c7a8", roughness: 0.92 }),
      plaster: new THREE.MeshStandardMaterial({ color: "#efe6d6", roughness: 0.85 }),
      interior: new THREE.MeshStandardMaterial({ color: "#e9dfcf", roughness: 0.9 }),
      wood: new THREE.MeshStandardMaterial({ color: "#8a6446", roughness: 0.7 }),
      darkWood: new THREE.MeshStandardMaterial({ color: "#4f3726", roughness: 0.65 }),
      linen: new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.95 }),
      terracotta: new THREE.MeshStandardMaterial({ color: "#b8653f", roughness: 0.85 }),
      sand: new THREE.MeshStandardMaterial({ color: "#d9c19b", roughness: 1 }),
      green: new THREE.MeshStandardMaterial({ color: "#3e5a3a", roughness: 0.9 }),
      palmLeaf: new THREE.MeshStandardMaterial({ color: "#4d6b3c", roughness: 0.8, side: THREE.DoubleSide }),
      trunk: new THREE.MeshStandardMaterial({ color: "#6b5440", roughness: 1 }),
      rock: new THREE.MeshStandardMaterial({ color: "#6e675e", roughness: 1, flatShading: true }),
      glass: new THREE.MeshPhysicalMaterial({ color: "#a9c9d8", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, envMapIntensity: 1.2 }),
      rail: new THREE.MeshPhysicalMaterial({ color: "#cfe3ec", roughness: 0.05, transparent: true, opacity: 0.22 }),
      metal: new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.4, metalness: 0.6 }),
      window: new THREE.MeshStandardMaterial({ color: "#1b1b1b", emissive: "#ffc98a", emissiveIntensity: 0 }),
      lamp: new THREE.MeshStandardMaterial({ color: "#fff3dc", emissive: "#ffcf8f", emissiveIntensity: 0.4 }),
      bulb: new THREE.MeshStandardMaterial({ color: "#ffe2b0", emissive: "#ffc27a", emissiveIntensity: 0.4 }),
      canvas: new THREE.MeshStandardMaterial({ color: "#efe5d2", roughness: 0.9, side: THREE.DoubleSide }),
    }),
    [],
  );

  useEffect(() => {
    m.window.emissiveIntensity = lighting.glow * 1.1;
    m.lamp.emissiveIntensity = 0.3 + lighting.glow * 1.6;
    m.bulb.emissiveIntensity = 0.2 + lighting.glow * 2.4;
  }, [m, lighting.glow]);

  useEffect(() => () => Object.values(m).forEach((mat) => mat.dispose()), [m]);
  return m;
}

type Mats = ReturnType<typeof useMaterials>;

function Box({ args, position, material, rotation, cast = true }: { args: [number, number, number]; position: [number, number, number]; material: THREE.Material; rotation?: [number, number, number]; cast?: boolean }) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={cast} receiveShadow>
      <boxGeometry args={args} />
    </mesh>
  );
}

// ── Sky & sea ────────────────────────────────────────────────────────────────

function Sky({ lighting }: { lighting: StayLighting }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSun: { value: new THREE.Vector3() },
          uSunColor: { value: new THREE.Color() },
        },
        vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunColor; varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, 0.0, 1.0);
            vec3 col = mix(uHorizon, uTop, pow(h, 0.55));
            float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
            col += uSunColor * (pow(s, 900.0) * 3.0 + pow(s, 12.0) * 0.35);
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  useEffect(() => {
    material.uniforms.uTop.value.set(lighting.skyTop);
    material.uniforms.uHorizon.value.set(lighting.skyHorizon);
    material.uniforms.uSun.value.set(...lighting.sunDir);
    material.uniforms.uSunColor.value.set(lighting.sunColor);
  }, [material, lighting]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  );
}

function Ocean({ lighting, reducedMotion }: { lighting: StayLighting; reducedMotion: boolean }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSun: { value: new THREE.Vector3() },
          uSunColor: { value: new THREE.Color() },
        },
        vertexShader: /* glsl */ `
          uniform float uTime; varying vec3 vPos; varying float vWave;
          void main(){
            vec3 p = position;
            float w = sin(p.x * 0.18 + uTime * 0.9) * 0.12 + sin(p.y * 0.23 - uTime * 0.7) * 0.1;
            p.z += w; vWave = w;
            vec4 world = modelMatrix * vec4(p, 1.0); vPos = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunColor; uniform float uTime;
          varying vec3 vPos; varying float vWave;
          void main(){
            vec3 v = normalize(cameraPosition - vPos);
            float fres = pow(1.0 - max(v.y, 0.0), 3.0);
            vec3 col = mix(uColor, uHorizon, fres * 0.85);
            // Perturb the reflection normal with the waves for a soft, moving sun path.
            vec3 n = normalize(vec3(sin(vPos.x * 0.35 + uTime) * 0.06, 1.0, cos(vPos.z * 0.3 - uTime * 0.8) * 0.06));
            vec3 r = reflect(-v, n);
            float s = pow(max(dot(r, normalize(uSun)), 0.0), 40.0);
            col += uSunColor * s * 0.9;
            col += vWave * 0.12;
            float d = length(vPos.xz - cameraPosition.xz);
            col = mix(col, uHorizon, smoothstep(60.0, 320.0, d));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  useEffect(() => {
    material.uniforms.uColor.value.set(lighting.water);
    material.uniforms.uHorizon.value.set(lighting.skyHorizon);
    material.uniforms.uSun.value.set(...lighting.sunDir);
    material.uniforms.uSunColor.value.set(lighting.sunColor);
  }, [material, lighting]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((s) => {
    if (!reducedMotion) material.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh material={material} rotation-x={-Math.PI / 2} position={[0, -0.35, -180]}>
      <planeGeometry args={[900, 300, 120, 60]} />
    </mesh>
  );
}

function PoolWater({ reducedMotion }: { reducedMotion: boolean }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vPos; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec2 vUv; varying vec3 vPos;
          void main(){
            vec2 p = vPos.xz * 1.6;
            float c = sin(p.x + uTime) * sin(p.y * 1.3 - uTime * 0.8) + sin((p.x + p.y) * 0.7 + uTime * 1.2);
            c = smoothstep(0.9, 1.6, c);
            vec3 deep = vec3(0.05, 0.42, 0.52);
            vec3 light = vec3(0.45, 0.85, 0.88);
            vec3 col = mix(deep, light, 0.35 + c * 0.45);
            vec3 v = normalize(cameraPosition - vPos);
            col = mix(col, vec3(0.8, 0.9, 0.95), pow(1.0 - v.y, 4.0) * 0.5);
            gl_FragColor = vec4(col, 0.92);
          }`,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((s) => {
    if (!reducedMotion) material.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh material={material} rotation-x={-Math.PI / 2} position={[0, 0.42, -8]} receiveShadow>
      <planeGeometry args={[16, 6]} />
    </mesh>
  );
}

// ── Vegetation ───────────────────────────────────────────────────────────────

const PALMS: [number, number, number, number][] = [
  // x, z, height, lean direction (radians)
  [-24, 4, 8.5, 0.4],
  [-21, -8, 9.5, -0.6],
  [-15, -24, 8, 1.2],
  [-2, -26, 9, -0.3],
  [9, -24, 7.5, 0.8],
  [24, -12, 9, 2.2],
  [25, 6, 8, 2.8],
  [-26, 14, 7, 0.2],
  [3, 12, 7.8, 1.6],
  [-9, 13, 8.8, -1.2],
  [16, -20, 8.4, 1.9],
  [-12, -12, 7.2, 0.9],
];

function Palms({ mats }: { mats: Mats }) {
  const { trunkGeo, frondGeo } = useMemo(() => {
    // Unit palm (height 1), scaled per instance. Crown sits at (0.32, 1, 0).
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.06, 0.45, 0), new THREE.Vector3(0.18, 0.8, 0), new THREE.Vector3(0.32, 1, 0)]);
    const trunk = new THREE.TubeGeometry(curve, 16, 0.022, 6, false);
    // Fronds: tapered, drooping leaf strips radiating from the crown.
    const fronds: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const leaf = new THREE.PlaneGeometry(0.5, 0.075, 8, 1);
      const pos = leaf.attributes.position as THREE.BufferAttribute;
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v) + 0.25;
        const taper = 1 - x / 0.5;
        pos.setY(v, pos.getY(v) * taper);
        pos.setZ(v, -x * x * 0.9);
        pos.setX(v, x);
      }
      leaf.rotateX(-Math.PI / 2);
      leaf.rotateZ(0.25);
      leaf.rotateY((i / 9) * Math.PI * 2);
      leaf.translate(0.32, 1, 0);
      fronds.push(leaf);
    }
    const merged = mergeGeometries(fronds);
    fronds.forEach((f) => f.dispose());
    return { trunkGeo: trunk, frondGeo: merged };
  }, []);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const frondRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    PALMS.forEach(([x, z, h, lean], i) => {
      q.setFromEuler(new THREE.Euler(0, lean, 0));
      m.compose(new THREE.Vector3(x, 0.3, z), q, new THREE.Vector3(h, h, h));
      trunkRef.current?.setMatrixAt(i, m);
      frondRef.current?.setMatrixAt(i, m);
    });
    if (trunkRef.current) trunkRef.current.instanceMatrix.needsUpdate = true;
    if (frondRef.current) frondRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useEffect(() => () => {
    trunkGeo.dispose();
    frondGeo.dispose();
  }, [trunkGeo, frondGeo]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeo, mats.trunk, PALMS.length]} castShadow />
      <instancedMesh ref={frondRef} args={[frondGeo, mats.palmLeaf, PALMS.length]} castShadow />
    </group>
  );
}

/** Minimal geometry merge (avoids pulling in BufferGeometryUtils for one call). */
function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = nonIndexed.reduce((s, g) => s + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  let o = 0;
  for (const g of nonIndexed) {
    g.computeVertexNormals();
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  return out;
}

// ── Architecture ─────────────────────────────────────────────────────────────

function Lobby({ mats }: { mats: Mats }) {
  const cols: [number, number][] = [
    [-18, 0],
    [-8, 0],
    [-18, 8],
    [-8, 8],
    [-13, 0],
    [-13, 8],
  ];
  return (
    <group>
      <Box args={[12.5, 0.35, 10.5]} position={[-13, 4.55, 4]} material={mats.plaster} />
      <Box args={[12.8, 0.08, 10.8]} position={[-13, 4.34, 4]} material={mats.wood} cast={false} />
      {cols.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 2.4, z]} material={mats.plaster} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 4.2, 16]} />
        </mesh>
      ))}
      <Box args={[4.5, 1.1, 1]} position={[-13, 0.85, 6.4]} material={mats.darkWood} />
      <Box args={[7, 3.6, 0.3]} position={[-13, 2.1, 8.6]} material={mats.wood} />
      {[-15, -13, -11].map((x) => (
        <group key={x}>
          <mesh position={[x, 3.2, 5]} material={mats.lamp}>
            <sphereGeometry args={[0.28, 20, 20]} />
          </mesh>
          <mesh position={[x, 3.85, 5]} material={mats.metal}>
            <cylinderGeometry args={[0.01, 0.01, 1, 4]} />
          </mesh>
        </group>
      ))}
      {[-17.2, -8.8].map((x) => (
        <group key={x} position={[x, 0.3, 2]}>
          <Box args={[0.9, 0.9, 0.9]} position={[0, 0.45, 0]} material={mats.terracotta} />
          <mesh position={[0, 1.6, 0]} material={mats.green} castShadow>
            <icosahedronGeometry args={[0.8, 0]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RoomWing({ mats }: { mats: Mats }) {
  const bays = [5, 9, 13, 17];
  return (
    <group>
      {/* slabs */}
      <Box args={[16.4, 0.3, 7.4]} position={[13, 4.15, 4.5]} material={mats.plaster} />
      <Box args={[16.6, 0.4, 7.6]} position={[13, 8.3, 4.5]} material={mats.plaster} />
      {/* back and side walls */}
      <Box args={[16.4, 8.2, 0.3]} position={[13, 4.2, 8.15]} material={mats.plaster} />
      <Box args={[0.3, 8.2, 7.4]} position={[4.85, 4.2, 4.5]} material={mats.plaster} />
      <Box args={[0.3, 8.2, 7.4]} position={[21.15, 4.2, 4.5]} material={mats.plaster} />
      {bays.map((x0) => (
        <group key={x0}>
          {/* partitions */}
          {x0 > 5 && <Box args={[0.2, 8, 7]} position={[x0, 4.2, 4.6]} material={mats.interior} />}
          {[0.3, 4.3].map((floorY) => {
            const hero = x0 === 13 && floorY === 4.3;
            return (
              <group key={floorY}>
                {/* balcony slab + glass rail */}
                <Box args={[3.8, 0.2, 1.9]} position={[x0 + 2, floorY - 0.05, 0.05]} material={mats.plaster} />
                <mesh position={[x0 + 2, floorY + 0.6, -0.88]} material={mats.rail}>
                  <boxGeometry args={[3.8, 1.1, 0.03]} />
                </mesh>
                {/* sliding glass */}
                <mesh position={[x0 + 2, floorY + 1.8, 1.02]} material={mats.glass}>
                  <boxGeometry args={[3.6, 3.5, 0.04]} />
                </mesh>
                {/* back glow of non-hero rooms reads as lit interiors at night */}
                {!hero && <Box args={[3.6, 3.4, 0.05]} position={[x0 + 2, floorY + 1.8, 7.9]} material={mats.window} cast={false} />}
                {/* daybed on balcony */}
                <Box args={[1.8, 0.35, 0.8]} position={[x0 + 1.4, floorY + 0.25, -0.3]} material={mats.linen} />
              </group>
            );
          })}
        </group>
      ))}
      <HeroRoom mats={mats} />
    </group>
  );
}

/** The one room you can stand inside: first floor, third bay. */
function HeroRoom({ mats }: { mats: Mats }) {
  const y = 4.3;
  return (
    <group>
      <Box args={[3.8, 0.04, 6.8]} position={[15, y + 0.02, 4.6]} material={mats.wood} cast={false} />
      <Box args={[2.6, 0.03, 2.2]} position={[15, y + 0.05, 3.6]} material={mats.canvas} cast={false} />
      {/* bed facing the sea */}
      <Box args={[2.1, 0.45, 2.2]} position={[15, y + 0.3, 5.9]} material={mats.darkWood} />
      <Box args={[2.0, 0.22, 2.1]} position={[15, y + 0.62, 5.85]} material={mats.linen} />
      <Box args={[2.6, 1.3, 0.12]} position={[15, y + 0.9, 7.05]} material={mats.wood} />
      {[14.45, 15.55].map((x) => (
        <Box key={x} args={[0.8, 0.22, 0.4]} position={[x, y + 0.85, 6.75]} material={mats.linen} />
      ))}
      <Box args={[2.05, 0.08, 0.8]} position={[15, y + 0.76, 5.2]} material={mats.terracotta} cast={false} />
      {/* nightstands + lamps */}
      {[13.5, 16.5].map((x) => (
        <group key={x}>
          <Box args={[0.5, 0.5, 0.45]} position={[x, y + 0.25, 6.8]} material={mats.darkWood} />
          <mesh position={[x, y + 0.75, 6.8]} material={mats.lamp}>
            <cylinderGeometry args={[0.14, 0.18, 0.3, 16]} />
          </mesh>
        </group>
      ))}
      {/* armchair by the window */}
      <Box args={[0.8, 0.4, 0.8]} position={[16.4, y + 0.25, 1.9]} material={mats.canvas} />
      <Box args={[0.8, 0.6, 0.15]} position={[16.4, y + 0.6, 2.25]} material={mats.canvas} />
      {/* art */}
      <Box args={[0.04, 1.1, 1.6]} position={[13.15, y + 2, 4.2]} material={mats.terracotta} cast={false} />
      <pointLight position={[15, y + 2.8, 4.5]} intensity={3} distance={7} color="#ffd6a0" />
    </group>
  );
}

function Pool({ mats, reducedMotion }: { mats: Mats; reducedMotion: boolean }) {
  return (
    <group>
      {/* basin walls (sea-side edge left open: infinity edge) */}
      <Box args={[16.6, 0.5, 0.3]} position={[0, 0.3, -4.85]} material={mats.stone} />
      <Box args={[0.3, 0.5, 6.3]} position={[-8.15, 0.3, -8]} material={mats.stone} />
      <Box args={[0.3, 0.5, 6.3]} position={[8.15, 0.3, -8]} material={mats.stone} />
      <Box args={[16.6, 0.9, 0.2]} position={[0, -0.05, -11.1]} material={mats.stone} />
      <PoolWater reducedMotion={reducedMotion} />
      {/* loungers */}
      {[-6, -3.5, -1, 1.5, 4, 6.5].map((x) => (
        <group key={x} position={[x, 0.3, -3.4]}>
          <Box args={[0.75, 0.15, 1.9]} position={[0, 0.2, 0]} material={mats.wood} />
          <Box args={[0.7, 0.1, 1.2]} position={[0, 0.32, -0.3]} material={mats.linen} />
          <Box args={[0.7, 0.1, 0.7]} position={[0, 0.55, 0.62]} rotation={[-0.7, 0, 0]} material={mats.linen} />
        </group>
      ))}
      {/* umbrellas */}
      {[-4.75, 0.25, 5.25].map((x) => (
        <group key={x} position={[x, 0.3, -2.4]}>
          <mesh position={[0, 1.2, 0]} material={mats.wood}>
            <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
          </mesh>
          <mesh position={[0, 2.35, 0]} material={mats.canvas} castShadow>
            <coneGeometry args={[1.5, 0.5, 16, 1, true]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BeachPavilion({ mats }: { mats: Mats }) {
  const posts: [number, number][] = [
    [-10, -15],
    [-2, -15],
    [-10, -21],
    [-2, -21],
  ];
  const bulbs = useMemo(() => {
    const out: [number, number, number][] = [];
    const spans: [[number, number], [number, number]][] = [
      [[-10, -15], [-2, -15]],
      [[-10, -21], [-2, -21]],
      [[-10, -15], [-10, -21]],
      [[-2, -15], [-2, -21]],
      [[-10, -15], [-2, -21]],
    ];
    for (const [[x0, z0], [x1, z1]] of spans) {
      for (let i = 1; i < 10; i++) {
        const t = i / 10;
        out.push([x0 + (x1 - x0) * t, 3.1 - Math.sin(t * Math.PI) * 0.45, z0 + (z1 - z0) * t]);
      }
    }
    return out;
  }, []);
  return (
    <group>
      <Box args={[10, 0.3, 7.5]} position={[-6, 0.0, -18]} material={mats.wood} />
      {posts.map(([x, z]) => (
        <Box key={`${x}${z}`} args={[0.22, 3.4, 0.22]} position={[x, 1.7, z]} material={mats.darkWood} />
      ))}
      {[-15, -18, -21].map((z) => (
        <Box key={z} args={[8.6, 0.14, 0.14]} position={[-6, 3.35, z]} material={mats.darkWood} />
      ))}
      {bulbs.map((p, i) => (
        <mesh key={i} position={p} material={mats.bulb}>
          <sphereGeometry args={[0.07, 8, 8]} />
        </mesh>
      ))}
      {[
        [-8, -16.8],
        [-4, -16.8],
        [-8, -19.4],
        [-4, -19.4],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0.15, z]}>
          <mesh position={[0, 0.75, 0]} material={mats.linen} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.05, 24]} />
          </mesh>
          <mesh position={[0, 0.38, 0]} material={mats.darkWood}>
            <cylinderGeometry args={[0.05, 0.05, 0.75, 8]} />
          </mesh>
          <mesh position={[0, 0.84, 0]} material={mats.lamp}>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
          </mesh>
          {[0, Math.PI].map((a) => (
            <Box key={a} args={[0.45, 0.45, 0.45]} position={[Math.sin(a) * 0.9, 0.23, Math.cos(a) * 0.9]} material={mats.canvas} />
          ))}
        </group>
      ))}
      <Box args={[3.5, 1.1, 0.8]} position={[-6, 0.7, -21.9]} material={mats.darkWood} />
    </group>
  );
}

function Landscape({ mats }: { mats: Mats }) {
  return (
    <group>
      {/* sand field and the terrace platform */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -7.5]} material={mats.sand} receiveShadow>
        <planeGeometry args={[220, 65]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2 - 0.05} position={[0, -0.25, -44]} material={mats.sand} receiveShadow>
        <planeGeometry args={[260, 12]} />
      </mesh>
      <Box args={[46, 0.6, 26]} position={[0, 0, 2]} material={mats.stone} cast={false} />
      <Box args={[46, 0.1, 0.6]} position={[0, 0.35, -11]} material={mats.stone} cast={false} />
      {[
        [-14, -30, 1.4],
        [-11, -32, 0.9],
        [12, -31, 1.2],
        [28, -28, 1.8],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, 0, z]} scale={s} material={mats.rock} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {/* path lights */}
      {[-20, -14, -8, 8, 14, 20].map((x) => (
        <mesh key={x} position={[x, 0.55, 12]} material={mats.lamp}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
        </mesh>
      ))}
    </group>
  );
}

// ── Camera & lighting ────────────────────────────────────────────────────────

function Lights({ lighting, shadows }: { lighting: StayLighting; shadows: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    scene.fog = new THREE.Fog(lighting.fog, 60, 360);
    gl.toneMappingExposure = lighting.exposure;
  }, [scene, gl, lighting]);
  const dir = new THREE.Vector3(...lighting.sunDir).normalize().multiplyScalar(60);
  return (
    <>
      <hemisphereLight args={[lighting.hemiSky, lighting.hemiGround, lighting.hemiIntensity]} />
      <directionalLight
        ref={sun}
        position={dir}
        intensity={lighting.sunIntensity}
        color={lighting.sunColor}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
      />
      {lighting.glow > 0 && (
        <>
          <pointLight position={[-13, 3.4, 4.5]} intensity={6 * lighting.glow} distance={14} color="#ffc98a" />
          <pointLight position={[-6, 2.6, -18]} intensity={7 * lighting.glow} distance={14} color="#ffc27a" />
          <pointLight position={[0, 0.9, -8]} intensity={4 * lighting.glow} distance={12} color="#6fe0e6" />
        </>
      )}
    </>
  );
}

function CameraDirector({ space, onUserMove }: { space: StaySpace; onUserMove: () => void }) {
  const controls = useRef<CameraControls>(null);
  const first = useRef(true);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const [px, py, pz] = space.camera.position;
    const [tx, ty, tz] = space.camera.target;
    void c.setLookAt(px, py, pz, tx, ty, tz, !first.current);
    first.current = false;
  }, [space]);
  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.85}
      minDistance={0.5}
      maxDistance={70}
      maxPolarAngle={Math.PI * 0.49}
      dollySpeed={0.4}
      truckSpeed={0}
      onStart={onUserMove}
    />
  );
}

export interface HotelSceneProps {
  space: StaySpace;
  time: StayTime;
  quality: "high" | "low";
  paused: boolean;
  reducedMotion: boolean;
  onUserMove: () => void;
  onContextLost: () => void;
}

export default function HotelScene({ space, time, quality, paused, reducedMotion, onUserMove, onContextLost }: HotelSceneProps) {
  const lighting = STAY_TIMES[time];
  const shadows = quality === "high";
  return (
    <Canvas
      className="!absolute inset-0"
      shadows={shadows}
      frameloop={paused ? "never" : "always"}
      dpr={[1, quality === "high" ? 1.6 : 1.25]}
      camera={{ fov: 50, near: 0.1, far: 900, position: space.camera.position }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost();
        });
      }}
    >
      <SceneContents lighting={lighting} shadows={shadows} reducedMotion={reducedMotion} />
      <Lights lighting={lighting} shadows={shadows} />
      {time === "night" && <Stars radius={200} depth={60} count={1500} factor={6} fade speed={reducedMotion ? 0 : 0.3} />}
      <Environment resolution={64} frames={1} key={time}>
        <Lightformer form="rect" intensity={time === "night" ? 0.4 : 1.4} color={lighting.skyHorizon} scale={[40, 10, 1]} position={[0, 4, -30]} />
        <Lightformer form="rect" intensity={time === "night" ? 0.2 : 0.8} color={lighting.skyTop} scale={[40, 40, 1]} position={[0, 30, 0]} rotation-x={Math.PI / 2} />
      </Environment>
      <CameraDirector space={space} onUserMove={onUserMove} />
    </Canvas>
  );
}

function SceneContents({ lighting, shadows, reducedMotion }: { lighting: StayLighting; shadows: boolean; reducedMotion: boolean }) {
  const mats = useMaterials(lighting);
  return (
    <group>
      <Sky lighting={lighting} />
      <Ocean lighting={lighting} reducedMotion={reducedMotion} />
      <Landscape mats={mats} />
      <Lobby mats={mats} />
      <RoomWing mats={mats} />
      <Pool mats={mats} reducedMotion={reducedMotion} />
      <BeachPavilion mats={mats} />
      <Palms mats={mats} />
      {!shadows && <ContactShadows position={[0, 0.31, 0]} scale={60} blur={2.4} opacity={0.35} far={10} frames={1} />}
    </group>
  );
}

export type { StaySpaceId };
