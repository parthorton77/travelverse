"use client";

import { DestinationScene } from "@/components/destination/DestinationScene";
import type { SceneId } from "@/lib/scene/compose";
import type { SceneConfig, StaySpaceId, TimeOfDay } from "@/lib/types";
import type { StayTime } from "./stayTimes";

const SPACE_SET: Record<StaySpaceId, SceneId> = {
  surroundings: "coast",
  lobby: "hotel",
  room: "sea",
  balcony: "sea",
  pool: "hotel",
  restaurant: "dining",
};

const TIME_MAP: Record<StayTime, TimeOfDay> = { morning: "day", sunset: "golden", night: "night" };

/**
 * 2D stand-in for the walkable stay when WebGL is unavailable: the same
 * spaces and times, framed like the view you'd have from each one.
 */
export function HotelFallback({ scene, space, time }: { scene: SceneConfig; space: StaySpaceId; time: StayTime }) {
  return (
    <DestinationScene scene={scene} sceneId={SPACE_SET[space]} time={TIME_MAP[time]} priority parallax className="absolute inset-0">
      {space === "room" && (
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 border-[5vw] border-[#1d1712]" />
          <div className="absolute inset-y-[5vw] left-1/2 w-3 -translate-x-1/2 bg-[#1d1712]" />
          <div className="absolute inset-x-[12%] bottom-0 h-[22%] rounded-t-[40px] bg-[#e9e1d3] shadow-[0_-10px_40px_rgba(0,0,0,0.4)]" />
        </div>
      )}
      {space === "balcony" && (
        <div aria-hidden className="absolute inset-x-0 bottom-[16%] h-[18%] border-t-4 border-[#cfe3ec]/60 bg-[#cfe3ec]/10" />
      )}
      {space === "lobby" && (
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[12%] bg-[#e9e1d3]" />
          {[8, 32, 58, 84].map((l) => (
            <div key={l} className="absolute bottom-0 top-[12%] w-[3%] bg-[#e9e1d3]" style={{ left: `${l}%` }} />
          ))}
        </div>
      )}
    </DestinationScene>
  );
}
