"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { BookData } from "@/components/resources/Book";

interface BookOpenProps {
  book: BookData | null;
  onClose: () => void;
}

function TurnedBook({ book }: { book: BookData }) {
  const [pageTurned, setPageTurned] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPageTurned(true), 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative flex overflow-hidden rounded-r-xl shadow-[0_60px_120px_-40px_rgb(0_0_0/0.75)]"
      style={{
        width: "min(88vw, 560px)",
        height: "min(60vw, 380px)",
        transformStyle: "preserve-3d",
        background: "linear-gradient(100deg, #fdfaf3 0%, #f7f1e4 100%)",
      }}
    >
      <div
        className="absolute inset-y-0 left-0 z-20 w-1/2 origin-left transition-transform duration-[1.1s] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transform: pageTurned ? "rotateY(-177deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="absolute inset-0 flex flex-col justify-between p-6 text-white"
          style={{
            backfaceVisibility: "hidden",
            background: `radial-gradient(130% 90% at 82% 8%, rgb(255 255 255 / 0.24), transparent 46%), linear-gradient(158deg, ${book.from} 0%, ${book.to} 100%)`,
          }}
        >
          <div className="absolute inset-3 rounded-md border border-ivory/40" aria-hidden="true" />
          <div className="absolute inset-5 rounded-sm border border-ivory/15" aria-hidden="true" />
          <span className="relative z-10 flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 rotate-[-8deg] items-center justify-center rounded-full font-display text-[0.7rem] font-extrabold"
              style={{ color: book.to, background: "rgb(255 255 255 / 0.92)", boxShadow: "0 2px 12px rgb(0 0 0 / 0.3)" }}
              aria-hidden="true"
            >
              LH
            </span>
            <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgb(255 255 255 / 0.7), transparent)" }} aria-hidden="true" />
          </span>

          <span className="relative z-10 flex flex-col gap-1.5">
            <span
              className="font-serif text-[clamp(1.4rem,3.4vw,2rem)] font-bold leading-tight tracking-[0.02em]"
              style={{ textShadow: "0 2px 18px rgb(0 0 0 / 0.35)" }}
            >
              {book.title}
            </span>
            <span className="h-px w-11" style={{ background: "linear-gradient(90deg, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.1))" }} aria-hidden="true" />
            <span className="font-serif text-[0.78rem] italic leading-snug text-ivory/90">{book.note}</span>
          </span>

          <span className="relative z-10 flex items-center justify-between">
            <span className="font-display text-[0.56rem] font-bold uppercase tracking-[0.3em] opacity-75">Language Hub</span>
            <span className="font-serif text-[0.64rem] italic opacity-75">Press</span>
          </span>
        </div>
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: `linear-gradient(160deg, ${book.to}, ${book.from})`,
          }}
          aria-hidden="true"
        />
      </div>

      <div
        className="absolute inset-y-0 left-1/2 z-10 w-1/2 origin-left transition-transform duration-[1s] delay-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transform: pageTurned ? "rotateY(-176deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(100deg, #fdfaf3, #f3ecdb)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "repeating-linear-gradient(0deg, #fdfaf3 0px, #fdfaf3 2px, #f6f0e2 3px)",
          }}
          aria-hidden="true"
        >
          <span className="font-display text-[1.1rem] font-extrabold uppercase tracking-[0.3em] text-ink/15">
            {book.title.split(" ")[0]}
          </span>
        </div>
      </div>

      <div
        className="absolute inset-y-0 right-0 z-20 flex w-1/2 flex-col items-center justify-center p-6 text-center sm:p-10"
        style={{ transition: "opacity 0.8s ease 0.9s", opacity: pageTurned ? 1 : 0, transform: "translateZ(0.1px)" }}
      >
        <p className="font-display text-[0.56rem] font-bold uppercase tracking-[0.4em] text-gold-deep">
          The Language Hub Reading Room
        </p>
        <h3 className="mt-4 font-serif text-[clamp(1.3rem,3vw,2rem)] italic leading-snug text-ink">
          “{book.quote}”
        </h3>
        <span aria-hidden="true" className="mt-5 h-px w-16 gold-underline" />
        <p className="mt-4 font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink-3">
          {book.title}
        </p>
      </div>

      <div
        className="absolute inset-0 z-30 rounded-r-xl pointer-events-none"
        style={{
          background: "linear-gradient(90deg, rgb(34 30 43 / 0.12), transparent 18%, transparent 82%, rgb(34 30 43 / 0.08))",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

export function BookOpen({ book, onClose }: BookOpenProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && book) onClose();
      if (e.key === "Enter" && book) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book, onClose]);

  return (
    <AnimatePresence>
      {book && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[125] flex flex-col items-center justify-center bg-night/75 p-5 backdrop-blur-md sm:p-10"
          style={{ perspective: "1800px" }}
          role="dialog"
          aria-modal="true"
          aria-label={`Book: ${book.title}`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the book"
            className="absolute inset-0 cursor-default"
            tabIndex={-1}
          />
          <div className="relative z-10 w-full max-w-[640px]">
            <motion.div
              initial={{ scale: 0.72, y: 60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 40, opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="mx-auto"
              style={{ transformStyle: "preserve-3d" }}
            >
              <TurnedBook key={book.id} book={book} />
            </motion.div>

            <p className="mt-7 text-center font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-ivory/60">
              Click anywhere or press escape to close
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close the book"
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}