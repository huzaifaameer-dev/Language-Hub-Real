import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, GraduationCap, Quote, Users } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { TEAM, FOUNDER } from "@/lib/content";
import { appBaseUrl } from "@/lib/base-url";

const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  title: "Our Teachers & Team | Language Hub",
  description:
    "Meet the certified, founder-led teaching team at Language Hub — IELTS, PTE and Duolingo coaches and conversation specialists behind every student's progress.",
  alternates: { canonical: `${baseUrl}/team` },
  openGraph: {
    title: "Our Teachers & Team — Language Hub",
    description: "Meet the certified teaching team at Language Hub.",
    url: `${baseUrl}/team`,
    siteName: "Language Hub",
    type: "website",
  },
};

const teamJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Language Hub",
  url: baseUrl,
  employee: TEAM.map((m) => ({
    "@type": "Person",
    name: m.name,
    jobTitle: m.role,
    description: m.bio,
  })),
  founder: {
    "@type": "Person",
    name: FOUNDER.name,
    jobTitle: "Founder & Lead Trainer",
  },
};

export default function TeamPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <header className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.24em] text-brand-deep">
              <GraduationCap className="h-3 w-3" /> The team
            </p>
            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.03em] text-ink">
              The people behind <span className="brand-text">the progress.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
              Founder-led and conversation-first. Every Language Hub trainer is certified,
              experienced, and genuinely invested in your growth.
            </p>
          </header>

          {/* Team grid */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <article
                key={member.name}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_24px_50px_-30px_rgb(15_23_42/0.3)]"
              >
                <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-brand/[0.06] blur-2xl" />
                <span className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-magenta font-display text-2xl font-black text-white shadow-[0_16px_30px_-12px_rgb(110_90_224/0.6)]">
                  {member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <h3 className="relative mt-4 font-display text-[1.05rem] font-extrabold text-ink">
                  {member.name}
                </h3>
                <p className="relative mt-0.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.16em] text-brand-deep">
                  {member.role}
                </p>

                <div className="relative mt-4 flex flex-wrap items-center justify-center gap-1.5">
                  {member.credentials.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-display text-[0.55rem] font-bold text-emerald-700"
                    >
                      <BadgeCheck className="h-3 w-3" /> {c}
                    </span>
                  ))}
                </div>

                <p className="relative mt-4 text-[0.82rem] leading-relaxed text-ink-2">
                  {member.bio}
                </p>

                <div className="relative mt-4 flex flex-wrap items-center justify-center gap-1.5 border-t border-ink/[0.06] pt-4">
                  {member.focus.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-ink/10 bg-[#faf8f4] px-2.5 py-1 font-display text-[0.55rem] font-bold uppercase tracking-[0.12em] text-ink-2"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Founder inset */}
          <section className="relative mt-12 flex flex-col items-center gap-8 overflow-hidden rounded-[2rem] bg-ink px-8 py-12 text-ivory lg:flex-row">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brand/40 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-gold/20 blur-3xl" />
            </div>
            <div className="relative shrink-0">
              <span className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-brand to-brand-magenta font-display text-3xl font-black text-white shadow-[0_24px_50px_-16px_rgb(110_90_224/0.8)]">
                {FOUNDER.name.split(" ").map((w) => w[0]).join("")}
              </span>
            </div>
            <div className="relative flex-1 text-center lg:text-left">
              <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.34em] text-gold-light">
                {FOUNDER.role}
              </p>
              <h3 className="mt-2 font-display text-2xl font-extrabold">{FOUNDER.headline}</h3>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {FOUNDER.credentials.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-ivory/15 bg-ivory/[0.05] px-4 py-1.5 font-display text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ivory/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative max-w-md lg:self-center">
              <Quote className="absolute -left-3 -top-4 h-9 w-9 text-gold/30" aria-hidden />
              <p className="font-serif text-[1rem] italic leading-relaxed text-ivory/90">
                “{FOUNDER.quote}”
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="font-display text-[0.9rem] font-bold text-ink-2">
              Ready to learn with a team that cares?
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/success-stories"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-brand/25 bg-white px-8 font-display text-[0.85rem] font-bold text-brand-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-deep hover:text-white"
              >
                See student results
              </Link>
              <Link
                href="/placement-test"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-8 font-display text-[0.85rem] font-bold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                <Users className="h-4 w-4" /> Take the free placement test
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-8 font-display text-[0.85rem] font-bold text-white shadow-[0_16px_40px_-16px_rgb(110_90_224/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
              >
                Enroll today <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
