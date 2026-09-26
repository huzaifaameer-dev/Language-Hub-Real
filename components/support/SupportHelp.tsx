"use client";

import { useMemo, useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  MessageSquareHeart,
  MonitorSmartphone,
  Search,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/hooks";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";
import { CONTACT, whatsappLink } from "@/lib/content";

type Category = "all" | "fees" | "courses" | "teachers" | "website" | "general";

const CATEGORIES: { key: Category; label: string; icon: typeof HelpCircle }[] = [
  { key: "all", label: "All", icon: HelpCircle },
  { key: "fees", label: "Fees & Payment", icon: CreditCard },
  { key: "courses", label: "Courses", icon: GraduationCap },
  { key: "teachers", label: "Teachers", icon: Users },
  { key: "website", label: "Website / Account", icon: MonitorSmartphone },
  { key: "general", label: "General", icon: BookOpen },
];

interface Faq {
  q: string;
  a: string;
  cat: Exclude<Category, "all">;
}

const FAQS: Faq[] = [
  { cat: "fees", q: "How much do the courses cost?", a: "Fees vary by programme. Spoken English, IELTS, PTE and Duolingo courses each have a clear monthly fee listed on the courses page — no hidden charges. Message us on WhatsApp for the exact current fee table and available instalment plans." },
  { cat: "fees", q: "How can I pay my course fee?", a: "You can pay online via card (Stripe) or use EasyPaisa / JazzCash. After enrolling you'll receive payment instructions instantly, and our team confirms your seat once the payment is received." },
  { cat: "fees", q: "Do you offer refunds?", a: "Yes — our refund policy is transparent. Review the full terms on the refund policy page, or ask us on WhatsApp and we'll explain the process for your situation." },
  { cat: "courses", q: "Which courses do you offer?", a: "We offer Spoken English, IELTS Preparation, PTE Preparation, and Duolingo English Test (DET) — all taught live in small batches Monday to Saturday, with afternoon, evening and night slots." },
  { cat: "courses", q: "What is the batch schedule and timing?", a: "Classes run Monday to Saturday between 3:00 PM and 12:00 AM. You can pick a batch time that fits your routine — afternoon, evening, or late-evening." },
  { cat: "courses", q: "Can I take the free Placement Test first?", a: "Absolutely. The free placement test (10 minutes, AI-powered) tells you your current level and recommends the best starting course. No commitment needed." },
  { cat: "teachers", q: "Who teaches the classes?", a: "Founder Ms. Javaria Malik leads the academy, supported by a specialist team of IELTS, PTE, DET and conversation trainers. Every session is conversation-first and student-focused." },
  { cat: "teachers", q: "How big are the batches?", a: "Batches are intentionally small (10–20 learners) so every student gets personal attention and real speaking time in every session." },
  { cat: "website", q: "How do I create an account or sign up?", a: "Click 'Sign up' in the navbar, enter your email and set a password. You'll get a verification email, then you can access your dashboard, courses and certificate progress." },
  { cat: "website", q: "How do I track my progress or get my certificate?", a: "Log in to your dashboard to view progress, classes, assignments and certificates. Once you complete 80% of the course, a certificate of completion is issued automatically." },
  { cat: "website", q: "I forgot my password — what now?", a: "Use the 'Forgot password' link on the login page. We'll email you a secure reset link. Still stuck? Contact our team via WhatsApp and we'll help immediately." },
  { cat: "website", q: "Where can I see the Daily News updates?", a: "Open the Daily News link in the navbar — a live feed of announcements, tips and updates from the academy, with likes and comments." },
  { cat: "general", q: "What is the academy's address and hours?", a: "Language Hub is based in Islamabad, Pakistan. Sessions run Monday to Saturday, 3:00 PM to 12:00 AM. Book a demo or WhatsApp us to arrange a visit." },
  { cat: "general", q: "How do I book a free demo class?", a: "Use the 'Book a demo' button anywhere on the site, pick your preferred date and time, and our team will confirm your slot instantly." },
  { cat: "general", q: "Do you help with IELTS/PTE exam bookings?", a: "We focus on preparation and coaching to help you reach your target band. For exam dates and official bookings we can point you to the right authority." },
];

const QUICK = ["Course fees?", "Batch timing?", "Free demo?", "Placement test?", "How to sign up?"];

const EMPTY_SUBSCRIBE = (): (() => void) => () => {};

/** True only on the client (server snapshot is `false`). */
function useIsClient(): boolean {
  return useSyncExternalStore(EMPTY_SUBSCRIBE, () => true, () => false);
}

export function SupportHelp() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category>("all");
  const [selected, setSelected] = useState<Faq | null>(null);
  const mounted = useIsClient();
  const reduce = useReducedMotion();
  const router = useRouter();

  useBodyScrollLock(open);
  useEscapeKey(() => setOpen(false), open);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (cat !== "all" && f.cat !== cat) return false;
      if (!q) return true;
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    });
  }, [query, cat]);

  const wa = whatsappLink("Assalam o alaikum! I have a question about Language Hub. Could you help me?");
  const email = CONTACT.email || "hello@languagehub.example";

  // Portal to <body> so the widget always positions against the true viewport —
  // immune to any transform/containing-block ancestor AND to `vh` overflow on
  // laptop/short screens, which used to push the panel's top (and close button)
  // above the visible area. Only rendered after hydration so the server/tree
  // matches (server returns null here) and the portal content is injected into
  // <body> post-hydration — otherwise React flags a hydration mismatch (#418).
  if (!mounted) return null;

  return createPortal(
    <>
{/* Floating actions — bottom right, side by side: Feedback + Help */}
      <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-3">
        {/* Feedback */}
        <button
          type="button"
          onClick={() => router.push("/feedback")}
          aria-label="Send feedback"
          className="group/df relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_16px_40px_-12px_rgb(245_158_11/0.85)] transition-all duration-300 hover:scale-110 hover:shadow-[0_22px_52px_-14px_rgb(245_158_11/1)] active:scale-95"
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-amber-400/60 blur-[10px]"
            animate={reduce ? undefined : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-white/30"
            animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
          <MessageSquareHeart
            className="relative h-6 w-6 transition-transform duration-300 group-hover/df:-rotate-6 group-hover/df:scale-110"
            strokeWidth={2}
          />
          <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-slate-700 opacity-0 shadow-lg transition-all duration-300 group-hover/df:opacity-100 sm:block">
            Send feedback
          </span>
        </button>

        {/* Help & Support */}
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Support & Help"
          whileHover={reduce ? undefined : { scale: 1.1 }}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          className="group/help relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D4AFF] text-white shadow-[0_16px_40px_-12px_rgb(37_99_235/0.9)] transition-shadow duration-300 hover:shadow-[0_22px_52px_-14px_rgb(109_74_255/1)]"
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[#6D4AFF]/50 blur-[10px]"
            animate={reduce ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.09, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-white/25"
            animate={reduce ? undefined : { scale: [1, 1.38, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <LifeBuoy
            className="relative h-6 w-6 transition-transform duration-300 group-hover/help:rotate-12"
            strokeWidth={2}
          />
          <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-slate-700 opacity-0 shadow-lg transition-all duration-300 group-hover/help:opacity-100 sm:block">
            Help &amp; Support
          </span>
        </motion.button>
      </div>

      {/* Backdrop + panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              aria-label="Close support"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[115] cursor-default bg-[#0B1B3A]/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              // Responsive: dynamic viewport height (dvh) + a hard top clamp so
              // the panel always fits between the bottom dock and the top edge —
              // the header (with the close button) is never pushed off-screen.
              className="fixed inset-x-4 bottom-24 z-[120] mx-auto flex h-[min(38rem,78dvh)] max-h-[calc(100dvh-8.5rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-[0_40px_90px_-40px_rgb(11_27_58/0.5)] sm:inset-x-auto sm:left-auto sm:right-6 sm:mx-0 sm:w-[24rem]"
              role="dialog"
              aria-modal="true"
              aria-label="Support & Help"
            >
              <FocusTrap active={open} className="flex h-full flex-col">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1B3A] via-[#1647C7] to-[#6D4AFF] px-5 py-5 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="flex items-center gap-1.5 font-mono text-[0.56rem] font-bold uppercase tracking-[0.26em] text-white/70">
                        <LifeBuoy className="h-3.5 w-3.5" /> Support &amp; Help
                      </p>
                      <h3 className="mt-1.5 font-display text-[1.2rem] font-extrabold tracking-tight">
                        How can we help you?
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                    >
                      <X className="h-4.5 w-4.5" strokeWidth={2} />
                    </button>
                  </div>
                  {/* Search */}
                  <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 backdrop-blur">
                    <Search className="h-4 w-4 text-white/70" strokeWidth={2} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search questions, fees, courses…"
                      className="w-full bg-transparent text-[0.85rem] text-white outline-none placeholder:text-white/60"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-1.5 overflow-x-auto border-b border-[#E2E8F0] bg-[#F8FAFF] px-3 py-2.5 no-scrollbar">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCat(c.key)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-[0.68rem] font-bold transition-all",
                        cat === c.key
                          ? "border-[#2563EB] bg-[#2563EB] text-white shadow"
                          : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#2563EB]/50 hover:text-[#2563EB]"
                      )}
                    >
                      <c.icon className="h-3.5 w-3.5" strokeWidth={2} />
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {/* Quick chips */}
                  {!query && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {QUICK.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuery(q.replace("?", ""))}
                          className="rounded-full bg-[#2563EB]/[0.07] px-3 py-1.5 text-[0.72rem] font-semibold text-[#1647C7] transition-colors hover:bg-[#2563EB]/[0.14]"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* FAQ list / answer */}
                  {selected ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelected(null)}
                        className="mb-3 inline-flex items-center gap-1 font-display text-[0.72rem] font-bold text-[#2563EB] hover:underline"
                      >
                        ← Back to questions
                      </button>
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFF] p-4">
                        <p className="font-display text-[0.95rem] font-extrabold text-[#0B1B3A]">{selected.q}</p>
                        <p className="mt-2 text-[0.85rem] leading-relaxed text-[#64748B]">{selected.a}</p>
                      </div>
                    </div>
                  ) : results.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {results.map((f) => (
                        <li key={f.q}>
                          <button
                            type="button"
                            onClick={() => setSelected(f)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-3 text-left transition-all hover:border-[#2563EB]/40 hover:shadow-[0_8px_24px_-16px_rgb(37_99_235/0.4)]"
                          >
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" strokeWidth={2} />
                            <span className="flex-1 font-display text-[0.83rem] font-bold text-[#0B1B3A]">{f.q}</span>
                            <ArrowRight className="h-4 w-4 text-[#94A3B8] transition-transform group-hover:translate-x-1 group-hover:text-[#2563EB]" strokeWidth={2.2} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    /* No match → contact team */
                    <div className="py-6 text-center">
                      <HelpCircle className="mx-auto h-9 w-9 text-[#94A3B8]" strokeWidth={1.6} />
                      <p className="mt-3 font-display text-[0.95rem] font-extrabold text-[#0B1B3A]">
                        No answers found
                      </p>
                      <p className="mx-auto mt-1 max-w-[16rem] text-[0.78rem] leading-relaxed text-[#64748B]">
                        Our team usually replies within minutes. Reach us any way you like:
                      </p>
                      <div className="mt-4 flex flex-col gap-2">
                        {wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-display text-[0.8rem] font-bold text-white transition-colors hover:bg-emerald-600"
                          >
                            <MessageCircle className="h-4 w-4" /> WhatsApp our team
                          </a>
                        ) : null}
                        <a
                          href={`mailto:${email}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-3 font-display text-[0.8rem] font-bold text-[#1647C7] transition-colors hover:bg-[#2563EB]/[0.05]"
                        >
                          <Mail className="h-4 w-4" /> Email us
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </FocusTrap>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}