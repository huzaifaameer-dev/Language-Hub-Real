"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Book, type BookData } from "@/components/resources/Book";
import { BookOpen } from "@/components/resources/BookOpen";
import { useMediaQuery, usePrefersReducedMotion, useSceneProgress, useHorizontalTrackX } from "@/lib/hooks";
import { scrollToId } from "@/lib/lenis";
import { cn } from "@/lib/utils";

const BOOKS: BookData[] = [
  { id: "voice", title: "A Voice of Your Own", note: "On finding the words that sound like you", quote: "Confidence is not born ready — it is practiced into being.", from: "#6e5ae0", to: "#8f7ae8" },
  { id: "travel", title: "Words That Travel", note: "On communicating across every border", quote: "Words travel further than any ticket ever can.", from: "#2bb3d8", to: "#63cfea" },
  { id: "sound", title: "The Sound of Confidence", note: "On speaking without hesitation", quote: "The voice you are afraid to use is the one the world is waiting to hear.", from: "#d63a8c", to: "#e567a8" },
  { id: "ink", title: "Ideas in Ink", note: "On turning thoughts into writing", quote: "Writing is thinking, made visible.", from: "#c2a05c", to: "#dfc68d" },
  { id: "counts", title: "Every Conversation Counts", note: "On the small talks that change things", quote: "Every conversation is a small chance to begin again.", from: "#2e9e6b", to: "#5fc094" },
  { id: "grow", title: "Room to Grow", note: "On learning as a lifetime habit", quote: "Growth is not a destination. It is the habit of showing up.", from: "#7b4fd0", to: "#a07be8" },
];

function BookSlot({
  k,
  progress,
  onOpen,
}: {
  k: number;
  progress: MotionValue<number> | null;
  onOpen: (b: BookData) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(0.4 + (k - 1) * 0.04);

  useEffect(() => {
    const update = () => {
      const host = ref.current?.closest("[data-track]") as HTMLElement | null;
      if (!host || !ref.current) return;
      const hw = host.offsetWidth;
      if (hw <= 0) return;
      const vw = host.parentElement?.clientWidth ?? window.innerWidth;
      const maxX = Math.max(0, hw - vw);
      if (maxX <= 0) return;
      const hr = host.getBoundingClientRect();
      const sr = ref.current.getBoundingClientRect();
      const abs = sr.left - hr.left + sr.width / 2;
      setCenter((abs - vw / 2) / maxX);
    };
    const raf = window.requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    const track = ref.current?.closest("[data-track]") as HTMLElement | null;
    if (track) ro.observe(track);
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const p = useSceneProgress(
    progress,
    Math.max(0, center - 0.026),
    Math.min(1, center + 0.026),
    ref
  );
  const data = BOOKS[k - 1];

  const ty = useTransform(p, [0, 0.5, 1], [0, -52, 0]);
  const scale = useTransform(p, [0, 0.5, 1], [0.8, 1.16, 0.8]);
  const ry = useTransform(p, [0, 0.5, 1], [-24, -9, -24]);
  const dim = useTransform(p, [0, 0.25, 0.75, 1], [0.5, 1, 1, 0.5]);
  const chip = useTransform(p, [0.35, 0.5, 0.9, 1], [0, 1, 1, 0]);
  const shadow = useTransform(p, [0, 0.5, 1], [0.5, 1, 0.5]);

  return (
    <div ref={ref} className="relative shrink-0" style={{ perspective: 1100 }}>
      <motion.div
        className="relative"
        style={{ y: ty, scale, rotateY: ry, opacity: dim }}
      >
        <motion.span
          className="absolute -top-4 left-1/2 z-10 h-8 w-10 -translate-x-1/2"
          style={{ opacity: chip }}
          aria-hidden="true"
        />
        <Book data={data} onOpen={() => onOpen(data)} />
      </motion.div>
      <motion.div
        className="absolute -bottom-6 left-1/2 h-4 w-28 -translate-x-1/2 rounded-[100%] bg-ink/25 blur-[6px]"
        style={{ scale: shadow, opacity: dim }}
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute -bottom-16 left-1/2 w-44 -translate-x-1/2 text-center"
        style={{ opacity: chip }}
      >
        <p className="font-display text-[0.8rem] font-extrabold tracking-tight text-ink">{data.title}</p>
        <p className="mt-0.5 font-serif text-[0.72rem] italic text-ink-3">{data.note}</p>
      </motion.div>
    </div>
  );
}

export function Bookshelf() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reduced = usePrefersReducedMotion();
  const pinned = desktop && !reduced;
  const [openBook, setOpenBook] = useState<BookData | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useHorizontalTrackX(scrollYProgress, trackRef, pinned);

  const outroOpacity = useTransform(scrollYProgress, [0.9, 0.96], [0, 1]);
  const outroY = useTransform(scrollYProgress, [0.9, 0.96], [44, 0]);

  const introPanel = (
    <div className="relative flex h-[100svh] min-h-[640px] w-screen shrink-0 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center sm:px-12">
      <div className="pointer-events-none absolute inset-0 bg-cream" />
      <div className="pointer-events-none absolute inset-0 grain" />
      <div className="aurora-blob right-[-16%] top-[-14%] h-[48vh] w-[48vh] bg-gold/15" />
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <p className="mb-6 flex items-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-deep">
          <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
          The Reading Room
          <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
        </p>
        <h2 className="font-display text-[clamp(2.4rem,7vw,5.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
          SIX BOOKS.
          <br />
          <span className="gold-text">ONE KIND OF MAGIC.</span>
        </h2>
        <p className="mt-7 max-w-lg text-balance text-[1.02rem] leading-relaxed text-ink-2">
          Books are not just read — they are experienced. Scroll to move down the
          shelf, and open one when it steps forward.
        </p>
      </motion.div>
    </div>
  );

  const outroPanel = (
    <div className="relative flex h-[100svh] min-h-[640px] w-screen shrink-0 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center sm:px-12">
      <div className="pointer-events-none absolute inset-0 bg-cream" />
      <div className="pointer-events-none absolute inset-0 grain" />
      <motion.div
        className="relative z-10 flex flex-col items-center"
        style={{ opacity: outroOpacity, y: outroY }}
      >
        <p className="font-serif text-[clamp(1.3rem,2.6vw,2rem)] italic leading-relaxed text-ink-2">
          Every page is a conversation worth having.
        </p>
        <button
          type="button"
          onClick={() => scrollToId("voice")}
          className="group mt-9 inline-flex h-[3.1rem] items-center gap-3 rounded-full bg-ink px-8 font-display text-[0.92rem] font-bold text-ivory transition-all duration-500 hover:bg-brand-deep"
        >
          Keep growing
          <span className="inline-block transition-transform duration-500 group-hover:translate-y-1">↓</span>
        </button>
      </motion.div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id="resources"
      data-section
      className={cn("relative", pinned ? "h-[800vh]" : "bg-cream py-24")}
      aria-label="Reading room"
    >
      <div
        className={cn("relative overflow-hidden", pinned ? "sticky top-0 h-screen bg-cream" : "mx-auto max-w-6xl px-6")}
        style={pinned ? { transform: "translateZ(0)" } : undefined}
      >
        {pinned ? (
          <motion.div ref={trackRef} data-track className="flex h-full w-max items-center" style={{ x }}>
            {introPanel}
            <div className="relative flex h-full items-center px-[8vw]">
              <span className="absolute bottom-[16vh] left-0 right-0 h-px bg-ink/15" aria-hidden="true" />
              <span className="absolute bottom-[15vh] left-0 right-0 h-10 rounded-[100%] bg-ink/5 blur-2xl" aria-hidden="true" />
              <div className="flex items-end gap-[5.5vw]">
                {BOOKS.map((b, i) => (
                  <BookSlot key={b.id} k={i + 1} progress={scrollYProgress} onOpen={setOpenBook} />
                ))}
              </div>
            </div>
            {outroPanel}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-24">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="flex items-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-deep">
                <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
                The Reading Room
                <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
              </p>
              <h2 className="font-display text-[clamp(2rem,5.6vw,4rem)] font-extrabold tracking-[-0.03em] text-ink">
                SIX BOOKS. <span className="gold-text">ONE KIND OF MAGIC.</span>
              </h2>
            </div>

            <div className="w-full">
              <div className="no-scrollbar flex gap-10 overflow-x-auto px-8 pb-16 pt-6 snap-x snap-mandatory">
                {BOOKS.map((b) => (
                  <div key={b.id} className="flex shrink-0 snap-center flex-col items-center gap-7">
                    <Book data={b} onOpen={() => setOpenBook(b)} label="Open" />
                    <p className="font-display text-[0.8rem] font-extrabold tracking-tight text-ink">{b.title}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-ink-3">
                Swipe to browse · tap a book to open it
              </p>
            </div>
          </div>
        )}
      </div>
      <BookOpen book={openBook} onClose={() => setOpenBook(null)} />
    </section>
  );
}