"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { DestinationScene } from "@/components/destination/DestinationScene";
import { EstimateTag } from "@/components/ui/EstimateTag";
import { formatINR, pad2 } from "@/lib/format";
import { stageFor } from "@/lib/scene/compose";
import type { JourneyStop, SceneConfig } from "@/lib/types";
import { STOP_ICON } from "./stopMeta";

interface JourneyStageProps {
  stop: JourneyStop;
  index: number;
  total: number;
  direction: number;
  scene: SceneConfig;
  className?: string;
  compact?: boolean;
}

/**
 * The "camera". Each stop is a world; moving between them pans in the travel
 * direction with a gentle push-in, and the light follows the time of day.
 */
export function JourneyStage({ stop, index, total, direction, scene, className, compact }: JourneyStageProps) {
  const reduce = usePrefersReducedMotion();
  const Icon = STOP_ICON[stop.kind];
  const variants = {
    enter: (dir: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: `${dir * 9}%`, scale: 1.1, filter: "blur(6px)" }),
    center: { opacity: 1, x: "0%", scale: 1, filter: "blur(0px)" },
    exit: (dir: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: `${-dir * 12}%`, scale: 1.04, filter: "blur(4px)" }),
  };

  return (
    <div className={`relative overflow-hidden bg-ink-900 ${className ?? ""}`}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={stop.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduce ? 0.3 : 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <DestinationScene scene={scene} sceneId={stageFor(stop.kind, scene.kind)} time={stop.timeOfDay} priority parallax={!compact} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-ink-950/30" />
        </motion.div>
      </AnimatePresence>

      {/* Viewfinder corners: this is a camera, not a card. */}
      {!compact && (
        <div aria-hidden className="pointer-events-none absolute inset-5 md:inset-8">
          {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((c) => (
            <span key={c} className={`absolute size-5 border-bone/40 ${c}`} />
          ))}
        </div>
      )}

      <div className={`absolute inset-0 flex flex-col justify-between ${compact ? "p-4" : "p-7 md:p-12"}`}>
        <div className="flex items-start justify-between gap-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={`meta-${stop.id}`}
              className="hud flex items-center gap-2 text-bone"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Icon className="size-3.5 text-sand" aria-hidden />
              {stop.subtitle.startsWith("Day") ? stop.subtitle.split(" · ").slice(0, 2).join(" · ") : `Day ${pad2(stop.day)}`}
            </motion.p>
          </AnimatePresence>
          {!compact && (
            <p className="hud text-bone-dim tabular-nums">
              {pad2(index + 1)} / {pad2(total)}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`copy-${stop.id}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            transition={{ duration: 0.7, delay: reduce ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            {!compact && <p className="font-mono text-xs tracking-[0.3em] text-sand">{stop.label}</p>}
            <p className={compact ? "text-lg font-semibold" : "mt-3 text-[clamp(2rem,4.4vw,4rem)] font-semibold leading-[0.95] tracking-[-0.035em]"}>{stop.title}</p>
            {!compact && <p className="mt-4 max-w-xl leading-relaxed text-bone-dim">{stop.description}</p>}
            {!compact && (stop.cost || stop.duration || stop.tips?.length) ? (
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {stop.duration && <span className="text-bone">{stop.duration}</span>}
                {stop.cost ? (
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{formatINR(stop.cost)}</span>
                    <EstimateTag />
                  </span>
                ) : null}
                {stop.tips?.slice(0, 2).map((t) => (
                  <span key={t} className="text-bone-dim">
                    · {t}
                  </span>
                ))}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
