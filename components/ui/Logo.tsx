import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** "light" renders straight onto the page; "chip" puts it on a white tile. */
  mode?: "light" | "chip";
  size?: "xs" | "sm" | "md" | "lg" | "hero";
  className?: string;
  priority?: boolean;
  eager?: boolean;
}

const LOGO_SRC = "/brand/language-hub-logo-teal.png";

const sizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "h-9 w-auto",
  sm: "h-12 w-auto",
  md: "h-16 w-auto",
  lg: "h-24 w-auto",
  hero: "h-[clamp(6rem,14vw,9.5rem)] w-auto",
};

const chipClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "h-9 w-9 p-1",
  sm: "h-[clamp(2.6rem,5.6vw,3.4rem)] w-[clamp(2.6rem,5.6vw,3.4rem)] p-1",
  md: "h-14 w-14 p-2",
  lg: "h-20 w-20 p-2.5",
  hero: "h-[clamp(6rem,14vw,9.5rem)] w-[clamp(6rem,14vw,9.5rem)] p-3",
};

/**
 * The Language Hub emblem — a teal three-dimensional "LH" monogram that
 * matches the academy's reference palette.
 *
 * The artwork ships on a white field, so on light surfaces it is composited
 * with `multiply`, which dissolves the white and leaves the mark floating
 * cleanly in the page. On dark surfaces it sits on a crisp white chip instead.
 */
export function Logo({
  mode = "light",
  size = "md",
  className,
  priority = false,
  eager = false,
}: LogoProps) {
  const loadProps = priority
    ? { priority: true }
    : { loading: (eager ? "eager" : "lazy") as "eager" | "lazy" };

  if (mode === "chip") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-[1.05rem] bg-white shadow-[0_14px_30px_-18px_rgb(10_78_67/0.55)] ring-1 ring-[#e3ede9]",
          chipClasses[size],
          className
        )}
      >
        <Image
          src={LOGO_SRC}
          alt="Language Hub logo"
          width={504}
          height={511}
          {...loadProps}
          className="h-full w-full rounded-[0.85rem] object-contain"
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center justify-center overflow-hidden", className)}>
      <Image
        src={LOGO_SRC}
        alt="Language Hub logo"
        width={504}
        height={511}
        {...loadProps}
        className={cn("object-contain mix-blend-multiply", sizeClasses[size])}
      />
    </span>
  );
}

/** The full lockup: emblem + crisp wordmark, used in the navbar and footer. */
export function Wordmark({
  className,
  tone = "dark",
  compact = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 flex-col leading-none", className)}>
      <span
        className={cn(
          "font-display font-extrabold tracking-[-0.035em]",
          compact ? "text-[1.02rem]" : "text-[1.16rem]",
          tone === "dark" ? "text-ink" : "text-white"
        )}
      >
        Language
        <span className={tone === "dark" ? "text-[#0f6b5c]" : "text-[#7ef0c9]"}> Hub</span>
      </span>
      {!compact ? (
        <span
          className={cn(
            "mt-1 font-sans text-[0.52rem] font-semibold uppercase tracking-[0.28em]",
            tone === "dark" ? "text-ink-3" : "text-white/55"
          )}
        >
          Hub of language excellence
        </span>
      ) : null}
    </span>
  );
}
