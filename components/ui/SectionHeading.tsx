import type { ReactNode } from "react";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  index?: string;
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  id?: string;
}

export function SectionHeading({ index, eyebrow, title, lede, align = "left", className, titleClassName, id }: SectionHeadingProps) {
  return (
    <header className={cn("max-w-5xl", align === "center" && "mx-auto text-center", className)}>
      <Reveal>
        <p className={cn("eyebrow flex items-center gap-3", align === "center" && "justify-center")}>
          {index && <span className="text-sand">{index}</span>}
          {index && <span aria-hidden className="h-px w-8 bg-line-strong" />}
          <span>{eyebrow}</span>
        </p>
      </Reveal>
      <AnimatedText as="h2" text={title} className={cn("mt-6 text-headline font-semibold text-balance-pretty", titleClassName)} />
      {lede && (
        <Reveal delay={0.15}>
          <div id={id} className={cn("mt-6 max-w-xl text-lg leading-relaxed text-bone-dim", align === "center" && "mx-auto")}>
            {lede}
          </div>
        </Reveal>
      )}
    </header>
  );
}
