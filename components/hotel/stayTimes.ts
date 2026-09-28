/** Time-of-day presets for the stay environment — "see it at the hour you'll be there". */
export type StayTime = "morning" | "sunset" | "night";

export interface StayLighting {
  label: string;
  skyTop: string;
  skyHorizon: string;
  sunDir: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  fog: string;
  water: string;
  /** Emissive strength for windows, lamps and string lights. */
  glow: number;
  exposure: number;
}

export const STAY_TIMES: Record<StayTime, StayLighting> = {
  morning: {
    label: "Morning",
    skyTop: "#4f86b8",
    skyHorizon: "#e9dcc6",
    sunDir: [0.55, 0.7, 0.35],
    sunColor: "#fff2de",
    sunIntensity: 2.6,
    hemiSky: "#c4dcf0",
    hemiGround: "#d9c4a2",
    hemiIntensity: 0.9,
    fog: "#dfe3e2",
    water: "#2f7b93",
    glow: 0,
    exposure: 1,
  },
  sunset: {
    label: "Sunset",
    skyTop: "#27305a",
    skyHorizon: "#f29a5e",
    sunDir: [-0.15, 0.1, -1],
    sunColor: "#ffb07a",
    sunIntensity: 2.8,
    hemiSky: "#7a6f9e",
    hemiGround: "#e3a574",
    hemiIntensity: 0.7,
    fog: "#e8a57e",
    water: "#3d4d74",
    glow: 0.55,
    exposure: 1.05,
  },
  night: {
    label: "Night",
    skyTop: "#02040b",
    skyHorizon: "#1a2448",
    sunDir: [0.3, 0.55, -0.75],
    sunColor: "#9fb4ff",
    sunIntensity: 0.35,
    hemiSky: "#2b3766",
    hemiGround: "#1c1510",
    hemiIntensity: 0.4,
    fog: "#0c1328",
    water: "#0f1c33",
    glow: 1.6,
    exposure: 1.15,
  },
};
