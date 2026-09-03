"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

interface ReferralData {
  code: string;
  discountPercent: number;
  redemptions: number;
  shareUrl: string;
  shareText: string;
}

export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let on = true;
    fetch("/api/referral", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (on && d?.code) setData(d);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  if (!data) return null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(data.shareText);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className="glass-dash relative overflow-hidden rounded-[2rem] border-amber-200/60 p-6 sm:p-7"
    >
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-gold/20 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600">
          <Gift className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-amber-600">Refer & Reward</p>
          <p className="font-display text-[1rem] font-extrabold">
            Share {data.discountPercent}% off — earn rewards
          </p>
        </div>
      </div>

      <p className="relative mt-4 text-[0.88rem] leading-relaxed text-ink-2">
        Refer a friend to Language Hub and they get <b className="text-amber-700">{data.discountPercent}% off</b> their course.
        Share your code below.
      </p>

      <div className="relative mt-4 flex items-center gap-2">
        <code className="flex-1 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 font-mono text-[0.95rem] font-black tracking-wider text-amber-800">
          {data.code}
        </code>
        <button
          type="button"
          onClick={copyCode}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-600 text-white transition-all hover:bg-amber-700"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-4 w-4" strokeWidth={3} /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={shareWhatsApp}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 font-display text-[0.72rem] font-bold text-white transition-all hover:bg-emerald-600"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>

      <p className="relative mt-3 flex items-center justify-between font-mono text-[0.6rem] text-ink-3">
        <span>Friends referred: <b className="text-amber-700">{data.redemptions}</b></span>
        <a href={data.shareUrl} target="_blank" rel="noopener noreferrer" className="text-brand-deep hover:underline">
          View share link →
        </a>
      </p>
    </motion.section>
  );
}
