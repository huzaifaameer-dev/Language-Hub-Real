"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";

/**
 * Share row for a journal post. Uses the native share sheet where available,
 * and direct links otherwise — no third-party scripts, so no tracking pixels
 * and nothing extra in the CSP.
 */
export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the sheet — fall through to copying.
      }
    }
    void copy();
  };

  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfeae6] bg-white text-[#44615a] transition hover:-translate-y-0.5 hover:border-[#9fd8cb] hover:text-[#0d6a58]";

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 inline-flex items-center gap-1.5 font-display text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ink-3">
        <Share2 className="h-3 w-3" strokeWidth={2.4} /> Share
      </span>

      <button type="button" onClick={nativeShare} className={base} aria-label="Share this article">
        <Share2 className="h-4 w-4" strokeWidth={2.2} />
      </button>

      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noreferrer noopener"
        className={base}
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
      </a>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noreferrer noopener"
        className={base}
        aria-label="Share on X"
      >
        <span className="font-display text-[0.8rem] font-black">X</span>
      </a>

      <button type="button" onClick={copy} className={base} aria-label="Copy link">
        {copied ? (
          <Check className="h-4 w-4" strokeWidth={2.4} />
        ) : (
          <Link2 className="h-4 w-4" strokeWidth={2.2} />
        )}
      </button>

      {copied && (
        <span className="font-sans text-[0.68rem] font-semibold text-[#0d6a58]">
          Copied
        </span>
      )}
    </div>
  );
}
