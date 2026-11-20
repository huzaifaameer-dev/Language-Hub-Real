import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, MessageCircle, Sparkles } from "lucide-react";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { COURSE_FAQS, FAQS } from "@/lib/content";
import { appBaseUrl } from "@/lib/base-url";

export const metadata: Metadata = {
  title: "Questions & Answers | Language Hub",
  description:
    "Answers about batches, fees, demo classes, materials and how Language Hub works — plus a direct line to the team.",
  alternates: { canonical: `${appBaseUrl()}/faq` },
};

const COURSE_GROUPS = Object.entries(COURSE_FAQS);

export default function FaqPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-site pb-20 pt-[6.4rem]">
        {/* hero */}
        <section className="relative overflow-hidden border-b border-[#edf5f2] bg-[linear-gradient(180deg,#f2fbf7_0%,#f9fdfc_70%,#ffffff_100%)] px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-28 -top-20 h-[26rem] w-[26rem] rounded-full bg-[#14a08c]/10 blur-[120px]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 top-24 h-[22rem] w-[22rem] rounded-full bg-[#f5b93c]/12 blur-[120px]"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#cfe6dd] bg-white/80 px-4 py-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#0d6a58]">
              <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.4} />
              Questions & Answers
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink">
              Everything you want to know
              <span className="block bg-[linear-gradient(92deg,#0d6a58,#14a08c_55%,#f26a4a)] bg-clip-text text-transparent">
                before your first class.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-sans text-[0.95rem] leading-relaxed text-ink-3">
              Straight answers about batches, fees, materials and how the academy
              runs. If something is still unclear, the team replies within a day.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <BookDemoButton />
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-[#cfe6dd] bg-white px-6 font-display text-[0.85rem] font-bold text-[#0d5c4d] transition hover:-translate-y-0.5 hover:border-[#14a08c]/60"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
                Contact the team
              </Link>
            </div>
          </div>
        </section>

        {/* general questions */}
        <section className="mx-auto max-w-3xl px-5 pt-14 sm:px-8">
          <h2 className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#0d6a58]">
            The essentials
          </h2>
          <div className="mt-4 divide-y divide-[#e7f2ee] overflow-hidden rounded-3xl border border-[#e3efe9] bg-white shadow-[0_24px_60px_-46px_rgba(10,78,67,0.45)]">
            {FAQS.map((item) => (
              <details key={item.q} className="group px-5 py-4 sm:px-7 sm:py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display text-[0.94rem] font-bold text-ink marker:hidden">
                  {item.q}
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#cfe6dd] text-[#0d6a58] transition group-open:rotate-45 group-open:border-[#0d6a58] group-open:bg-[#0d6a58] group-open:text-white">
                    +
                  </span>
                </summary>
                <p className="mt-2.5 max-w-[58ch] font-sans text-[0.88rem] leading-relaxed text-ink-3">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* per-course questions */}
        {COURSE_GROUPS.map(([course, items]) => (
          <section key={course} className="mx-auto max-w-3xl px-5 pt-12 sm:px-8">
            <h2 className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#0d6a58]">
              {course}
            </h2>
            <div className="mt-4 divide-y divide-[#e7f2ee] overflow-hidden rounded-3xl border border-[#e3efe9] bg-white shadow-[0_24px_60px_-46px_rgba(10,78,67,0.45)]">
              {items.map((item) => (
                <details key={item.q} className="group px-5 py-4 sm:px-7 sm:py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display text-[0.94rem] font-bold text-ink marker:hidden">
                    {item.q}
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#cfe6dd] text-[#0d6a58] transition group-open:rotate-45 group-open:border-[#0d6a58] group-open:bg-[#0d6a58] group-open:text-white">
                      +
                    </span>
                  </summary>
                  <p className="mt-2.5 max-w-[58ch] font-sans text-[0.88rem] leading-relaxed text-ink-3">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* closing */}
        <section className="mx-auto max-w-3xl px-5 pt-14 sm:px-8">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0d5c4d] px-6 py-9 text-center sm:px-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#14a08c]/40 blur-3xl"
            />
            <Sparkles className="relative mx-auto h-6 w-6 text-[#f5c542]" strokeWidth={2.2} />
            <h2 className="relative mt-3 font-display text-[clamp(1.3rem,3vw,1.75rem)] font-extrabold tracking-[-0.02em] text-white">
              Still deciding? Try a free demo class.
            </h2>
            <p className="relative mx-auto mt-2 max-w-md font-sans text-[0.9rem] leading-relaxed text-white/70">
              Meet a teacher, watch a real session, and ask anything — no
              obligation.
            </p>
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
              <BookDemoButton variant="light" />
              <Link
                href="/courses"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 font-display text-[0.85rem] font-bold text-white transition hover:-translate-y-0.5 hover:border-[#7ef0c9]/60 hover:text-[#7ef0c9]"
              >
                See programmes
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
