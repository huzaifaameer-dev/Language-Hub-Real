"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useIsTouch } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
  /** apply a subtle inner-shine sweep on hover (desktop only) */
  glare?: boolean;
}

/** Desktop-only magnetic pull — subtle, never fights the user. */
export function Magnetic({ children, strength = 0.18, className, glare = false }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouch();
  const reduceMotion = useReducedMotion();
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.4 });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current || reduceMotion) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  if (isTouch || reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn(glare && "shine-sweep", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        reset();
      }}
      whileHover={hovering ? { scale: 1.02 } : undefined}
      data-magnetic
    >
      {children}
    </motion.div>
  );
}
