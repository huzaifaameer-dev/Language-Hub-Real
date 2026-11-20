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
  variant?: "solid" | "ghost" | "light";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-12 items-center gap-2.5 rounded-full px-7 font-display text-[0.9rem] font-bold transition-colors duration-200",
          variant === "solid" && "bg-ink text-ivory hover:bg-brand-deep",
          variant === "ghost" &&
            "border border-ivory/25 text-ivory hover:border-gold-light/60 hover:text-gold-light",
          variant === "light" &&
            "bg-white text-[#073b33] shadow-[0_14px_30px_-18px_rgba(0,0,0,0.6)] hover:bg-[#e9fbf6]",
          className
        )}
      >
        Book a demo
        <ArrowRight className="h-4 w-4" />
      </button>
      <DemoBooking open={open} onClose={() => setOpen(false)} />
    </>
  );
}
