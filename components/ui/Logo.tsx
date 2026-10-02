import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Rendering context: "light" for ivory/cream backgrounds, "chip" for dark backgrounds. */
  mode?: "light" | "chip";
  size?: "xs" | "sm" | "md" | "lg" | "hero";
  className?: string;
  priority?: boolean;
  eager?: boolean;
}

const sizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "h-9 w-auto",
  sm: "h-12 w-auto",
  md: "h-16 w-auto",
  lg: "h-24 w-auto",
  hero: "h-[clamp(6rem,14vw,9.5rem)] w-auto",
};

const chipClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "h-9 w-9 p-1.5",
  sm: "h-[clamp(2.6rem,6vw,4rem)] w-[clamp(2.6rem,6vw,4rem)] p-2",
  md: "h-14 w-14 p-2.5",
  lg: "h-20 w-20 p-3",
  hero: "h-[clamp(6rem,14vw,9.5rem)] w-[clamp(6rem,14vw,9.5rem)] p-4",
};

/**
 * The official Language Hub logo. On dark surfaces it is presented on a
 * crisp white chip so the original artwork stays exactly as designed.
 */
export function Logo({ mode = "light", size = "md", className, priority = false, eager = false }: LogoProps) {
  const loadProps = priority
    ? { priority: true }
    : { loading: (eager ? "eager" : "lazy") as "eager" | "lazy" };

  if (mode === "chip") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_-12px_rgb(0_0_0/0.45)]",
          chipClasses[size],
          className
        )}
      >
        <Image
          src="/logo-lh.png"
          alt="Language Hub logo"
          width={640}
          height={640}
          {...loadProps}
          className="h-full w-full rounded-lg object-contain"
        />
      </span>
    );
  }

  return (
    <Image
      src="/logo-lh.png"
      alt="Language Hub logo"
      width={640}
      height={640}
      {...loadProps}
      className={cn("object-contain", sizeClasses[size], className)}
    />
  );
}
