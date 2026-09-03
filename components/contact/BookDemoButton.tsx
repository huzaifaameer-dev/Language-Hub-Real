"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DemoBooking } from "@/components/contact/DemoBooking";
import { cn } from "@/lib/utils";

/**
 * Primary "Book a Free Demo" button. Opens the structured demo-booking modal
 * (instead of the old WhatsApp-only flow). A dark "solid" and a light "ghost"
 * variant are provided.
 */
export function BookDemoButton({
  variant = "solid",
  className,
}: {
  variant?: "solid" | "ghost";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group inline-flex h-12 items-center gap-2.5 rounded-full px-7 font-display text-[0.9rem] font-bold transition-all duration-300",
          variant === "solid"
            ? "bg-ink text-ivory hover:bg-brand-deep"
            : "border border-ivory/25 text-ivory hover:border-gold-light/60 hover:text-gold-light",
          className
        )}
      >
        Book a Free Demo
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
      <DemoBooking open={open} onClose={() => setOpen(false)} />
    </>
  );
}
