"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

interface LiveStats {
  students: number;
  yearsTeaching: number;
  programmes: number;
  dailyBatches: number;
  enrolledThisWeek?: number;
  totalSeats?: number;
}

/** Permanent social-proof strip: live "enrolled this week" + truthful scarcity. */
export function LiveEnrollmentBanner({ className }: { className?: string }) {
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (mounted && d) setStats(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Fallback: what we can show without the DB — never claim enrolled-this-week
  // until we actually know it, so it stays truthful.
  const show = stats?.enrolledThisWeek !== undefined;

  if (!show) return null;

  const week = stats.enrolledThisWeek ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className={cn(
        "relative mx-auto max-w-6xl px-6 sm:px-12",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 px-6 py-4 backdrop-blur-md">
        <span className="flex items-center gap-2 font-display text-[0.85rem] font-extrabold text-emerald-800">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <TrendingUp className="h-4 w-4" />
          {week} student{week !== 1 ? "s" : ""} enrolled this week
        </span>

        <span className="hidden h-5 w-px bg-emerald-200 sm:block" aria-hidden />

        <span className="flex items-center gap-1.5 font-display text-[0.8rem] font-bold text-emerald-700">
          <Users className="h-4 w-4" />
          {stats?.totalSeats ? `${stats.totalSeats} seats across ${stats.programmes} programmes` : `${stats?.programmes ?? 4} programmes`}
        </span>

        <span className="hidden h-5 w-px bg-emerald-200 sm:block" aria-hidden />

        <span className="flex items-center gap-1.5 font-display text-[0.78rem] font-semibold text-emerald-700">
          <Zap className="h-4 w-4 text-gold-deep" />
          {week > 8 ? "Popular right now — batches filling fast" : "Batches filling for this term"}
        </span>
      </div>
    </motion.div>
  );
}
