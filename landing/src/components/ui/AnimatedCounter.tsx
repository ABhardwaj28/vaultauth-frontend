import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

type ValueProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
};

/** Counts up once when scrolled into view. */
export function AnimatedCounter({ value, prefix = "", suffix = "", decimals = 0 }: ValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setCurrent(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1200, 1);
      setCurrent(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Static value with a restrained fade-in — used where counting reads oddly. */
export function FadeInValue({ value, prefix = "", suffix = "", decimals = 0 }: ValueProps) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      className="inline-block tabular-nums"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1.2, ease: "linear" }}
    >
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </motion.span>
  );
}
