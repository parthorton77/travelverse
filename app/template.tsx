"use client";

import { motion } from "framer-motion";

/**
 * Every route arrives with a short fade. Opacity only: a transform here would
 * become the containing block for fixed-position sheets and dialogs.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
