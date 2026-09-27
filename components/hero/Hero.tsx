"use client";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Award, BookOpen, MessageSquareHeart, PlayCircle, Sparkles, User } from "lucide-react";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { useLang } from "@/components/LanguageProvider";
const ease = [0.16, 1, 0.3, 1] as const;

/** Lazy scroll — only pulls in Lenis/GSAP on first anchor click. */
async function goTo(id: string) {
  const { scrollToId } = await import("@/lib/lenis");
  scrollToId(id);
}
/* ─── Curved arrow doodle ─── */
function ArrowDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" fill="none" className={className} aria-hidden>
      <path d="M4 34 C 20 30, 20 8, 50 6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <path d="M44 12 L 53 5 L 52 15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}
export function Hero() {
  const { lang } = useLang();
  const isUr = lang === "ur";
  const reduce = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(() => document.getElementById("home")?.style.setProperty("--flash", "1"), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <section
      id="home"
      data-section
      className="relative overflow-hidden"
      dir={isUr ? "rtl" : "ltr"}
      aria-label="Welcome to Language Hub"
      style={{ background: "#F8FAFF" }}
    >
      {/* ─── Background atmosphere ─── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Cool-white → pale-blue base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #F8FAFF 0%, #F3F7FF 55%, #EEF1FF 100%)",
          }}
        />
        {/* Large organic blobs — visible, soft boundaries */}
        <div className="absolute -right-48 -top-44 h-[40rem] w-[40rem] rounded-[50%]" style={{ background: "radial-gradient(50% 50% at 50% 50%, #B9CFFF 0%, rgba(185,207,255,0) 70%)", opacity: 0.8 }} />
        <div className="absolute -left-40 top-16 h-[34rem] w-[34rem] rounded-[50%]" style={{ background: "radial-gradient(50% 50% at 50% 50%, #E0D9FF 0%, rgba(224,217,255,0) 70%)", opacity: 0.85 }} />
        <div className="absolute bottom-0 right-1/4 h-[26rem] w-[26rem] rounded-[50%]" style={{ background: "radial-gradient(50% 50% at 50% 50%, #C9DFFF 0%, rgba(201,223,255,0) 70%)", opacity: 0.75 }} />
        {/* Soft radial light near content */}
        <div className="absolute -left-10 top-1/3 h-96 w-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)" }} />
        {/* Subtle diagonal/curved shape entering upper-left */}
        <svg viewBox="0 0 600 600" className="absolute -left-32 -top-20 h-[34rem] w-[34rem] opacity-90" fill="none" aria-hidden>
          <path d="M60 20 C 220 120, 260 320, 120 540 C 90 480, 70 260, 40 40 Z" fill="#E1EBFF" opacity="0.95" />
          <path d="M120 10 C 280 100, 330 300, 200 520" stroke="#9DB8F5" strokeWidth="2" strokeLinecap="round" opacity="1" />
        </svg>
        {/* Right-side tiny decorations — visible dot grid */}
        <div
          className="absolute inset-y-0 right-0 w-1/2 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(rgb(37 99 235 / 0.34) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at 62% 42%, black 15%, transparent 76%)",
            WebkitMaskImage: "radial-gradient(ellipse at 62% 42%, black 15%, transparent 76%)",
          }}
        />
        {/* Extra secondary dot patch near content left */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgb(109 74 255 / 0.22) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            maskImage: "radial-gradient(ellipse at 30% 60%, black 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at 30% 60%, black 10%, transparent 70%)",
          }}
        />
        <svg viewBox="0 0 300 500" className="absolute right-8 top-16 hidden w-56 lg:block" fill="none" aria-hidden>
          <circle cx="150" cy="60" r="3.5" fill="#6D4AFF" opacity="0.9" />
          <circle cx="205" cy="110" r="2.5" fill="#2563EB" opacity="0.9" />
          <circle cx="240" cy="80" r="3" fill="#2563EB" opacity="0.95" />
          <circle cx="270" cy="120" r="2" fill="#6D4AFF" opacity="0.9" />
          <circle cx="225" cy="200" r="2.5" fill="#2563EB" opacity="0.85" />
          <circle cx="250" cy="300" r="3" fill="#6D4AFF" opacity="0.85" />
          <path d="M230 40 C 260 140, 240 220, 260 300" stroke="#9DB8F5" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" opacity="1" />
          <path d="M20 140 A 90 90 0 0 1 170 120" stroke="#B9D1FF" strokeWidth="2" strokeLinecap="round" opacity="1" />
          <path d="M60 320 A 80 80 0 0 0 190 300" stroke="#B9CFFF" strokeWidth="1.5" strokeDasharray="2 10" strokeLinecap="round" opacity="0.9" />
          <path d="M120 40 C 150 70, 180 100, 200 150" stroke="#C9DAFF" strokeWidth="1.5" strokeDasharray="1 8" strokeLinecap="round" opacity="0.9" />
        </svg>
      </div>
      {/* ─── Main grid ─── */}
      <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-6 pt-24 pb-6 sm:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6 lg:px-14 lg:pt-28 lg:pb-8 2xl:px-16">
        {/* ═══════════════ LEFT — Content ═══════════════ */}
        <div className="max-w-2xl" dir={isUr ? "rtl" : "ltr"}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex items-center gap-2"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white/80 px-4 py-2 text-[0.8rem] font-semibold text-[#1647C7] shadow-[0_8px_24px_-12px_rgb(11_27_58/0.15)] backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-[#f59e0b]" strokeWidth={2} />
              Hub of Language Excellence
              <span className="ml-1 rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-[#1647C7]">
                EST. 8+ yrs
              </span>
            </span>
          </motion.div>
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="mt-7 max-w-[700px] font-display font-extrabold leading-[1.0] tracking-[-0.02em] text-[#0B1B3A]"
            style={{ fontSize: "clamp(2.9rem, 6.4vw, 4.85rem)" }}
          >
            <motion.span
              className="block"
              initial={{ opacity: 0, y: reduce ? 0 : 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.08 }}
            >
              Master{" "}
              <span className="relative inline-block">
                <span style={{ backgroundImage: "linear-gradient(135deg,#2563EB,#6D4AFF)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  English
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden>
                  <path d="M3 9C60 3 150 3 197 7" stroke="url(#lhh)" strokeWidth="4" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="lhh" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#2563EB" />
                      <stop offset="1" stopColor="#6D4AFF" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </motion.span>
            <motion.span
              className="block"
              initial={{ opacity: 0, y: reduce ? 0 : 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.16 }}
            >
              and speak with
            </motion.span>
            <motion.span
              className="block"
              initial={{ opacity: 0, y: reduce ? 0 : 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.24 }}
            >
              <span style={{ backgroundImage: "linear-gradient(135deg,#2563EB,#6D4AFF)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                confidence.
              </span>
            </motion.span>
          </motion.h1>
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.34 }}
            className="mt-6 max-w-lg text-[#64748B]"
            style={{ fontSize: "1.05rem", lineHeight: 1.55 }}
          >
            Learn to speak, score, and express yourself fluently through live, small-batch
            classes built around real conversation.
          </motion.p>
          {/* Instructor line */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.4 }}
            className="mt-4 flex items-center gap-2 text-[#0B1B3A]"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2563EB]/10">
              <User className="h-3.5 w-3.5 text-[#1647C7]" strokeWidth={2.2} />
            </span>
            <span className="font-display text-[0.98rem] font-semibold">Javaria Malik.</span>
          </motion.div>
          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.46 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <BookDemoButton variant="solid" className="px-8 text-[0.95rem]" />
            <button
              type="button"
              onClick={() => goTo("courses")}
              className="group inline-flex h-[3.4rem] items-center gap-2.5 rounded-full border border-[#BFD3FF]/70 bg-white px-8 font-display text-[0.95rem] font-semibold text-[#1647C7] shadow-[0_10px_24px_-14px_rgb(11_27_58/0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2563EB]/50 hover:shadow-[0_16px_36px_-16px_rgb(37_99_235/0.3)]"
            >
              <PlayCircle className="h-5 w-5 text-[#1647C7]" strokeWidth={1.8} />
              Explore Courses
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.2} />
            </button>
          </motion.div>
          {/* Trust / differentiators row — service promises, not repeated numbers */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.54 }}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4"
          >
            <TrustItem icon={<BookOpen className="h-4 w-4" />} title="Free placement test" sub="AI-powered · 10 minutes" />
            <span className="hidden h-8 w-px bg-[#E2E8F0] sm:block" />
            <TrustItem icon={<Award className="h-4 w-4" />} title="Certificate on completion" sub="Issued at 80% progress" />
            <span className="hidden h-8 w-px bg-[#E2E8F0] sm:block" />
            <TrustItem icon={<MessageSquareHeart className="h-4 w-4" />} title="Fast support" sub="WhatsApp · reply in 24h" />
          </motion.div>
        </div>
        {/* ═══════════════ RIGHT — Student Character ═══════════════ */}
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none lg:pl-4">
          {/* Organic abstract shape behind the character — more visible */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[4%] h-[125%] w-[125%] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 42%, #DCE9FF 0%, #EAF2FF 35%, rgba(234,242,255,0) 72%)",
              opacity: 0.85,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 h-[96%] w-[92%] -translate-x-[66%] -translate-y-1/2 rounded-[50%]"
            style={{
              border: "2px solid rgba(37,99,235,0.42)",
              boxShadow: "inset 0 0 42px -22px rgba(37,99,235,0.38), 0 0 54px -26px rgba(37,99,235,0.55)",
            }}
          />
          {/* Handwritten annotation (top-left of character) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute left-0 top-2 z-30 hidden lg:block"
          >
            <ArrowDoodle className="absolute -left-12 top-14 w-16" />
            <p className="font-hand text-[1.8rem] font-semibold leading-[1.05] text-[#1647C7]" style={{ fontFamily: "var(--font-hand)" }}>
              Better<br />English.<br />Bigger<br />Opportunities.
            </p>
          </motion.div>
          {/* Character — large foreground, no rectangular frame */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.2 }}
            className="relative z-10 mx-auto w-[88%] max-w-[31rem] lg:w-auto lg:max-w-none"
          >
            <motion.img
              src="/hero-student.webp"
              alt="Student learning English at Language Hub"
              className="h-auto w-full object-contain"
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          {/* Paper-plane + dotted flight path */}
          <motion.svg
            viewBox="0 0 200 160"
            fill="none"
            className="absolute left-2 top-[38%] z-10 hidden w-32 lg:block"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <path
              d="M10 150 C 60 130, 90 60, 150 30"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray="2 8"
              strokeLinecap="round"
              opacity="0.95"
            />
            <g transform="translate(150 30)">
              <path d="M0 0 L14 -6 L6 2 L16 5 L0 10 Z" fill="#2563EB" opacity="0.95" />
            </g>
            <circle cx="60" cy="110" r="3.5" fill="#6D4AFF" opacity="0.95" />
            <circle cx="100" cy="70" r="3" fill="#2563EB" opacity="0.9" />
            <circle cx="128" cy="48" r="2.5" fill="#6D4AFF" opacity="0.85" />
          </motion.svg>
        </div>
      </div>
      {/* ─── Bottom soft curve — elegant, clearly visible, no text ─── */}
      <div className="pointer-events-none -mt-6" aria-hidden>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="block h-[52px] w-full sm:h-[68px]">
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#DCE9FF" />
              <stop offset="50%" stopColor="#C9DAFF" />
              <stop offset="100%" stopColor="#E9E3FF" />
            </linearGradient>
          </defs>
          <path
            fill="url(#curveGrad)"
            d="M0,0 C180,70 360,16 560,44 C760,72 940,86 1140,58 C1280,34 1360,22 1440,40 L1440,100 L0,100 Z"
          />
          <path
            fill="none"
            stroke="#A7C3FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
            d="M0,92 C180,64 360,24 560,48 C760,72 940,88 1140,60 C1280,38 1360,30 1440,44"
          />
        </svg>
      </div>
    </section>
  );
}
function TrustItem({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#BFD3FF]/70 text-[#1647C7]">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[0.88rem] font-bold text-[#0B1B3A]">{title}</span>
        <span className="text-[0.72rem] text-[#64748B]">{sub}</span>
      </span>
    </div>
  );
}