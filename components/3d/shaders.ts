/**
 * GLSL for the TravelVerse globe. Kept as plain strings so the scene has no
 * shader-loader build step. All lighting uses a camera-relative sun so the
 * visible hemisphere is always lit with a crescent of night at one edge.
 */

export const surfaceVertex = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const surfaceFragment = /* glsl */ `
  uniform sampler2D uMask;
  uniform vec3 uSunDir;
  uniform vec3 uOceanDay;
  uniform vec3 uOceanNight;
  uniform vec3 uLand;
  uniform vec3 uRim;
  uniform float uGrid;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec2 vUv;

  float gridLine(float coord, float divisions) {
    float x = coord * divisions;
    float d = abs(fract(x - 0.5) - 0.5) / fwidth(x);
    return 1.0 - min(d, 1.0);
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float land = texture2D(uMask, vec2(vUv.x, 1.0 - vUv.y)).r;
    float light = dot(n, uSunDir);
    float day = smoothstep(-0.25, 0.45, light);

    vec3 ocean = mix(uOceanNight, uOceanDay, day);
    vec3 col = mix(ocean, uLand * (0.25 + 0.75 * day), land * 0.7);

    // Sun glint on open water.
    vec3 h = normalize(uSunDir + v);
    float spec = pow(max(dot(n, h), 0.0), 22.0) * (1.0 - land) * day;
    col += vec3(0.62, 0.72, 0.82) * spec * 0.16;

    // Faint graticule: every 15° of longitude and latitude.
    float g = max(gridLine(vUv.x, 24.0), gridLine(vUv.y, 12.0));
    col += vec3(0.55, 0.7, 0.85) * g * uGrid * (0.35 + 0.65 * day);

    // Fresnel rim.
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.6);
    col += uRim * fres * (0.35 + 0.65 * day);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const dotsVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vSeed;
  varying vec3 vNormalW;
  varying float vFacing;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(world.xyz);
    vec4 mv = viewMatrix * world;
    vec3 nView = normalize(mat3(viewMatrix) * vNormalW);
    vFacing = dot(nView, normalize(-mv.xyz));
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.85 + aSeed * 0.3) / -mv.z;
  }
`;

export const dotsFragment = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uDay;
  uniform vec3 uNight;
  uniform vec3 uCity;
  uniform float uTime;
  varying float vSeed;
  varying vec3 vNormalW;
  varying float vFacing;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float disc = smoothstep(0.5, 0.18, d);

    float light = dot(vNormalW, uSunDir);
    float day = smoothstep(-0.18, 0.4, light);
    vec3 col = mix(uNight, uDay, day);

    // City lights: a sparse subset glows warm on the night side.
    float city = step(0.83, vSeed) * (1.0 - day);
    float twinkle = 0.7 + 0.3 * sin(uTime * 1.3 + vSeed * 61.0);
    col = mix(col, uCity * (1.2 * twinkle), city);

    float limb = smoothstep(0.0, 0.32, vFacing);
    float alpha = disc * limb * mix(0.45, 1.0, max(day, city));
    gl_FragColor = vec4(col, alpha);
  }
`;

export const atmosphereVertex = /* glsl */ `
  varying vec3 vNormalV;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormalV;
  void main() {
    float i = pow(max(0.0, 0.66 - dot(vNormalV, vec3(0.0, 0.0, 1.0))), 3.2);
    gl_FragColor = vec4(uColor, 1.0) * i * uIntensity;
  }
`;

export const arcVertex = /* glsl */ `
  varying float vT;
  void main() {
    vT = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * uMode 0 = reveal (drawn once from origin to target, head keeps pulsing)
 * uMode 1 = traffic (a short comet travelling the arc on a loop)
 */
export const arcFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uProgress;
  uniform float uTime;
  uniform float uMode;
  uniform float uOpacity;
  varying float vT;
  void main() {
    float alpha;
    if (uMode < 0.5) {
      if (vT > uProgress) discard;
      float trail = smoothstep(0.0, 0.18, vT) * 0.55;
      float head = smoothstep(uProgress - 0.12, uProgress, vT);
      float p = fract(uTime * 0.3) * uProgress;
      float pulse = smoothstep(0.05, 0.0, abs(vT - p));
      alpha = trail + head * 0.6 + pulse * 0.35;
    } else {
      float h = fract(uTime);
      float dist = h - vT;
      alpha = dist >= 0.0 ? smoothstep(0.22, 0.0, dist) : 0.0;
      alpha *= smoothstep(0.0, 0.08, vT) * smoothstep(1.0, 0.92, vT);
    }
    gl_FragColor = vec4(uColor, alpha * uOpacity);
  }
`;
