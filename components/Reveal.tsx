"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useInViewport } from "@/lib/useInViewport";

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewport(ref, { once: true, offset: 40 });
  const show = reduce || inView;

  return (
    <motion.div
      ref={ref}
      data-reveal
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
