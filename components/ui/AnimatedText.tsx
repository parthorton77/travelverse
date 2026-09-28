"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

interface AnimatedTextProps {
  text: string;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
  className?: string;
  /** Seconds before the first word animates. */
  delay?: number;
  stagger?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
}

/**
 * Word-by-word masked reveal. Screen readers get the sentence once, from a
 * visually hidden copy; the animated words are aria-hidden.
 */
export function AnimatedText({ text, as: Tag = "p", className, delay = 0, stagger = 0.06, immediate = false }: AnimatedTextProps) {
  const reduce = usePrefersReducedMotion();
  const words = text.split(" ");
  const trigger = immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "-12% 0px" } };

  return (
    <Tag className={cn(className)}>
      <span className="sr-only">{text}</span>
      <motion.span className="inline" initial={reduce ? "show" : "hide"} {...trigger} aria-hidden>
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className="inline-block will-change-transform"
              variants={{
                hide: { y: "105%", opacity: 0 },
                show: { y: "0%", opacity: 1, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: delay + i * stagger } },
              }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 && " "}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
