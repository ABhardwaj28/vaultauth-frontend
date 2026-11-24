import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div id={id} className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? (
        <div className={`inline-flex items-center gap-2 text-[13px] font-medium text-[#F07A26] ${align === "center" ? "justify-center" : ""}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#F07A26]" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="mt-4 font-display text-3xl font-bold leading-[1.14] tracking-[-0.03em] text-white sm:text-[42px]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-[75ch] text-[15px] leading-7 text-[#94A3B8] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export const ctaPrimary =
  "inline-flex items-center justify-center rounded-lg bg-[#F07A26] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#e06d1b] hover:shadow-[0_12px_30px_-12px_rgba(240,122,38,0.8)]";

/** Primary CTA with dark ink for WCAG contrast outside the header. */
export const ctaPrimaryInk = `${ctaPrimary} va-amber-ink`;

export const ctaSecondary =
  "inline-flex items-center justify-center rounded-lg border border-white/35 bg-white/[0.09] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-16px_rgba(0,0,0,0.9)] transition-all hover:border-white/60 hover:bg-white/[0.15]";

/** Small, quiet link that points a claim at the live portal. */
export function SeeLive({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#F07A26] transition-opacity hover:opacity-80"
    >
      <span className="h-1 w-1 rounded-full bg-[#F07A26]" />
      {children}
    </a>
  );
}

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`${className} inline-flex shrink-0 items-center justify-center rounded-[10px] bg-[#F07A26]`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
