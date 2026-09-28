"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { DnaProvider } from "./DnaProvider";
import { TransitionProvider } from "./TransitionProvider";
import { TripProvider } from "./TripProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <DnaProvider>
        <TripProvider>
          <TransitionProvider>{children}</TransitionProvider>
        </TripProvider>
      </DnaProvider>
    </MotionConfig>
  );
}
