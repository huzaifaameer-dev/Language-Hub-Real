import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
}

/** Consistent premium section heading used across the site. */
export function SectionHeader({ eyebrow, title, subtitle, center = true }: SectionHeaderProps) {
  return (
    <div className={center ? "flex flex-col items-center text-center" : "flex flex-col"}>
      <span className="inline-flex items-center gap-2.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-gold-deep">
        <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
        {eyebrow}
        {center && <span aria-hidden="true" className="h-px w-8 bg-gold/60" />}
      </span>
      <h2 className="mt-5 font-display text-[clamp(1.9rem,4.4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {subtitle ? (
        <p className={center ? "mt-5 max-w-2xl text-[1rem] leading-relaxed text-ink-2" : "mt-5 max-w-2xl text-[1rem] leading-relaxed text-ink-2"}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
