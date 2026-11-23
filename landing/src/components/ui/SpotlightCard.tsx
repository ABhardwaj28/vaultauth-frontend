import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/** Card with a restrained cursor-tracked radial highlight. */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "240,122,38",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const sx = useSpring(x, { stiffness: 250, damping: 28 });
  const sy = useSpring(y, { stiffness: 250, damping: 28 });
  const background = useTransform(
    [sx, sy],
    ([mx, my]: number[]) =>
      `radial-gradient(320px circle at ${mx}px ${my}px, rgba(${spotlightColor},0.14), transparent 70%)`
  );

  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
      }}
      onMouseLeave={() => {
        x.set(-500);
        y.set(-500);
      }}
      className={`group relative overflow-hidden ${className}`}
    >
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={{ background }} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
