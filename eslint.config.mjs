import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber scenes animate by mutating three.js objects (uniforms,
    // materials, fog, camera) inside useFrame/effects — the idiomatic R3F
    // pattern that avoids re-rendering React every frame. The React Compiler
    // immutability rule can't model that, and the compiler isn't enabled here.
    files: ["components/3d/**/*.tsx", "components/hotel/HotelScene.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
