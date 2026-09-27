"use client";

import { motion } from "framer-motion";
import { BadgeCheck, GraduationCap, MessageCircle, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const PILLS = [
  { icon: GraduationCap, title: "Live small-batch classes", sub: "Real speaking time, every session" },
  { icon: Mic, title: "All programmes", sub: "Spoken English · IELTS · PTE · Duolingo" },
  { icon: BadgeCheck, title: "Verified instructors", sub: "Founder-led specialist team" },
  { icon: MessageCircle, title: "Personal follow-up", sub: "WhatsApp-first student support" },
];

/** Professional "what you get" ribbon — static, truthful, no live numbers. */
export function LiveEnrollmentBanner({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className={cn("relative mx-auto max-w-6xl px-6 sm:px-12", className)}
    >
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/[0.07] bg-ink/[0.05] sm:grid-cols-2 lg:grid-cols-4">
        {PILLS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.06, ease }}
            className="flex items-start gap-3 bg-white px-5 py-5"
          >
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/[0.08] text-brand-deep">
              <p.icon className="h-4 w-4" strokeWidth={1.9} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-[0.82rem] font-bold text-ink">{p.title}</span>
              <span className="mt-1 text-[0.72rem] text-ink-2">{p.sub}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}