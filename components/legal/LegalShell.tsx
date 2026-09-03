import type { ReactNode } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

/**
 * Shared server layout for legal pages (Privacy / Terms / Refund Policy).
 * Consistent premium styling, fully server-rendered for fast, indexable HTML.
 */
export function LegalShell({
  kicker,
  title,
  updated,
  intro,
  sections,
}: {
  kicker: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <div className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
          <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
            <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
            {kicker}
          </p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] font-extrabold tracking-[-0.03em] text-ink">
            {title}
          </h1>
          <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-widest text-ink-3">
            Last updated · {updated}
          </p>
          <p className="mt-6 text-[1rem] leading-relaxed text-ink-2">{intro}</p>

          <div className="mt-10 flex flex-col gap-8">
            {sections.map((s, i) => (
              <section key={i}>
                <h2 className="flex items-center gap-3 font-display text-[1.3rem] font-extrabold tracking-tight text-ink">
                  <span aria-hidden className="font-mono text-[0.72rem] font-black text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.heading}
                </h2>
                <div className="mt-3 space-y-3 text-[0.96rem] leading-relaxed text-ink-2">{s.body}</div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-brand/15 bg-brand/5 px-5 py-4 text-[0.9rem] leading-relaxed text-ink-2">
            Questions about this policy? Reach us anytime — we&apos;re happy to
            explain anything in plain language.
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}