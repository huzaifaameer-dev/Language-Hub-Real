"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/content";

/**
 * WhatsApp-first call-to-action. Renders nothing until the studio WhatsApp
 * number is set (`NEXT_PUBLIC_ACADEMY_WHATSAPP`, digits only, e.g.
 * "923001234567"), so the site degrades gracefully before deployment.
 */
export function WhatsAppCta({ variant = "hero" }: { variant?: "hero" | "footer" }) {
  const href = whatsappLink(
    variant === "footer"
      ? "Assalam o alaikum! Language Hub ke baare mein jaanna tha."
      : "Assalam o alaikum! Main Language Hub mein enroll karna chahta/aaraha hoon."
  );
  if (!href) return null;

  if (variant === "footer") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 font-display text-[0.78rem] font-bold text-ivory/75 transition-colors duration-300 hover:text-gold-light">
        <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
        WhatsApp the studio
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-[3.2rem] items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/5 font-display text-[0.95rem] font-bold text-emerald-700 transition-all duration-500",
        "hover:border-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-[0_18px_44px_-16px_rgb(16_185_129/0.6)]"
      )}
      style={{ paddingLeft: "1.6rem", paddingRight: "1.6rem" }}
    >
      <MessageCircle className="h-[1.05rem] w-[1.05rem]" strokeWidth={2.2} />
      WhatsApp us
    </a>
  );
}