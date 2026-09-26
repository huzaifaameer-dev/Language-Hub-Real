import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Crown, GraduationCap, Quote, Users } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { ApplyButton } from "@/components/courses/ApplyButton";
import { appBaseUrl } from "@/lib/base-url";
import { ensureIndexesAndAdmin, getTeamMembersCollection } from "@/lib/db";
import { ACADEMY_STATS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our Teachers & Team | Language Hub",
  description:
    "Meet the specialist, founder-led teaching team at Language Hub — IELTS, PTE and Duolingo coaches and conversation specialists behind every student's progress.",
  alternates: { canonical: `${appBaseUrl()}/team` },
  openGraph: {
    title: "Our Teachers & Team — Language Hub",
    description: "Meet the specialist teaching team at Language Hub.",
    url: `${appBaseUrl()}/team`,
    siteName: "Language Hub",
    type: "website",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 300;

interface Member {
  name: string;
  role: string;
  headline: string | null;
  credentials: string[];
  bio: string;
  focus: string[];
  image: string | null;
  ceo: boolean;
}

async function getMembers(): Promise<Member[]> {
  try {
    await ensureIndexesAndAdmin();
    const col = await getTeamMembersCollection();
    const docs = await col
      .find({ active: true })
      .sort({ ceo: -1, order: 1 })
      .limit(60)
      .toArray();
    return docs.map((d) => ({
      name: d.name,
      role: d.role,
      headline: d.headline ?? null,
      credentials: d.credentials ?? [],
      bio: d.bio,
      focus: d.focus ?? [],
      image: d.image ?? null,
      ceo: !!d.ceo,
    }));
  } catch {
    // DB unreachable — render a friendly empty state instead of crashing.
    return [];
  }
}

function iniciales(name: string): string {
  return (name?.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("") || "LH").toUpperCase();
}

export default async function TeamPage() {
  const members = await getMembers();
  const ceo = members.find((m) => m.ceo) ?? null;
  const team = members.filter((m) => m !== ceo);

  const teamJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Language Hub",
    url: appBaseUrl(),
    employee: team.map((m) => ({
      "@type": "Person",
      name: m.name,
      jobTitle: m.role,
      description: m.bio,
    })),
    founder: ceo
      ? { "@type": "Person", name: ceo.name, jobTitle: ceo.role }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <header className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.24em] text-brand-deep">
              <GraduationCap className="h-3 w-3" /> The team
            </p>
            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.03em] text-ink">
              The people behind <span className="brand-text">the progress.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
              Founder-led and conversation-first. Every Language Hub trainer is specialist-trained,
              experienced, and genuinely invested in your growth.
            </p>
          </header>

          {members.length === 0 ? (
            <div className="mt-14 grid place-items-center rounded-[2rem] border border-dashed border-ink/15 py-24 text-center">
              <p className="font-display text-5xl font-extrabold text-slate-200">∅</p>
              <p className="mt-4 font-display text-[1.1rem] font-bold text-ink-2">The team page is being prepared</p>
              <p className="mt-1 font-mono text-[0.7rem] text-ink-3">Our trainers&apos; profiles will appear here soon.</p>
            </div>
          ) : (
            <>
              {/* ── CEO · Founder — premium flagship, always on top ── */}
              {ceo ? (
                <section className="relative mt-14 overflow-hidden rounded-[2rem] bg-ink text-ivory shadow-[0_50px_110px_-60px_rgb(11_27_58/0.85)]">
                  {/* ambient brand + gold glows */}
                  <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-brand/40 blur-[80px]" />
                    <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-gold/25 blur-[90px]" />
                    <div className="absolute right-10 bottom-8 select-none font-display text-[9rem] font-black leading-none text-ivory/[0.03]">
                      LH
                    </div>
                  </div>

                  {/* top bar */}
                  <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-ivory/[0.08] px-8 py-4 sm:px-10">
                    <p className="inline-flex items-center gap-2 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-gold-light">
                      <Crown className="h-4 w-4" /> Founder & CEO
                    </p>
                    <p className="hidden font-mono text-[0.58rem] uppercase tracking-[0.26em] text-ivory/40 sm:block">
                      A founder-led academy
                    </p>
                  </div>

                  <div className="relative flex flex-col gap-10 px-8 py-10 sm:px-10 lg:flex-row lg:items-center lg:gap-12 lg:py-14">
                    {/* Portrait */}
                    <div className="relative mx-auto shrink-0 lg:mx-0">
                      <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-gold/40 via-brand-magenta/30 to-transparent blur-xl" />
                      <span className="relative grid h-44 w-44 place-items-center overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-gold via-brand to-brand-magenta p-[3px] shadow-[0_34px_70px_-30px_rgb(110_90_224/0.9)] sm:h-56 sm:w-56">
                        <span className="grid h-full w-full place-items-center overflow-hidden rounded-[1.4rem] bg-ink">
                          {ceo.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ceo.image} alt={ceo.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-display text-6xl font-black text-white">{iniciales(ceo.name)}</span>
                          )}
                        </span>
                      </span>
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/40 bg-ink px-4 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-gold-light shadow-lg">
                        ♛ Chief Executive
                      </span>
                    </div>

                    {/* Identity */}
                    <div className="min-w-0 flex-1 text-center lg:text-left">
                      <p className="font-display text-[0.64rem] font-bold uppercase tracking-[0.38em] text-gold-light">
                        {ceo.role}
                      </p>
                      <h2 className="mt-2 font-display text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-tight tracking-[-0.02em]">
                        {ceo.headline ?? ceo.name}
                      </h2>
                      <p className="mt-1 font-display text-[1.05rem] font-bold text-ivory/80">
                        {ceo.name}
                      </p>

                      {ceo.credentials.length > 0 ? (
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                          {ceo.credentials.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1.5 rounded-full border border-ivory/15 bg-ivory/[0.06] px-3.5 py-1.5 font-display text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ivory/85 backdrop-blur"
                            >
                              <BadgeCheck className="h-3.5 w-3.5 text-gold-light" /> {c}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {ceo.focus.length > 0 ? (
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
                          {ceo.focus.map((f) => (
                            <span
                              key={f}
                              className="rounded-full border border-ivory/10 px-3 py-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ivory/50"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Quotation + proof */}
                    <div className="relative max-w-md lg:self-center">
                      <Quote className="absolute -left-3 -top-5 h-10 w-10 text-gold/40" aria-hidden />
                      <p className="font-serif text-[1.05rem] italic leading-relaxed text-ivory/90">
                        “{ceo.bio}”
                      </p>
                      <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-ivory/10">
                        {ACADEMY_STATS.map((s) => (
                          <div key={s.label} className="bg-ink/95 px-4 py-4 text-center">
                            <p className="font-display text-[1.35rem] font-extrabold text-gold-light">{s.value}</p>
                            <p className="mt-0.5 font-mono text-[0.52rem] uppercase tracking-[0.16em] text-ivory/50">
                              {s.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* ── Team grid ── */}
              {team.length > 0 ? (
                <>
                  <p className="mt-16 flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-brand-deep">
                    <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
                    The training faculty
                  </p>
                  <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {team.map((member) => (
                      <article
                        key={member.name}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_24px_50px_-30px_rgb(15_23_42/0.3)]"
                      >
                        <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-brand/[0.06] blur-2xl" />
                        <span className="relative mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-brand-magenta shadow-[0_16px_30px_-12px_rgb(110_90_224/0.6)]">
                          {member.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.image}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-display text-2xl font-black text-white">
                              {iniciales(member.name)}
                            </span>
                          )}
                        </span>
                        <h3 className="relative mt-4 font-display text-[1.05rem] font-extrabold text-ink">
                          {member.name}
                        </h3>
                        <p className="relative mt-0.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.16em] text-brand-deep">
                          {member.role}
                        </p>

                        {member.credentials.length > 0 ? (
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
                        ) : null}

                        <p className="relative mt-4 text-[0.82rem] leading-relaxed text-ink-2">
                          {member.bio}
                        </p>

                        {member.focus.length > 0 ? (
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
                        ) : null}
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}

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
              <ApplyButton
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-8 font-display text-[0.85rem] font-bold text-white shadow-[0_16px_40px_-16px_rgb(110_90_224/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
              >
                Enroll today <ArrowRight className="h-4 w-4" />
              </ApplyButton>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}