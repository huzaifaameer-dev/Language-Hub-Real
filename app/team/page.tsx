import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, GraduationCap } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { ApplyButton } from "@/components/courses/ApplyButton";
import { FounderSpotlight } from "@/components/about/FounderSpotlight";
import { appBaseUrl } from "@/lib/base-url";
import { listTeam } from "@/lib/server/catalog";
import { jsonLdScript } from "@/lib/seo";

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
    const rows = await listTeam(true);
    return rows.map((d) => ({
      name: d.name,
      role: d.role,
      headline: d.headline ?? null,
      credentials: d.credentials,
      bio: d.bio,
      focus: d.focus,
      image: d.image,
      ceo: d.ceo,
    }));
  } catch {
    // Database unreachable — render the friendly empty state instead.
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
        dangerouslySetInnerHTML={{ __html: jsonLdScript(teamJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-6xl px-5 pt-12 lg:px-8">
          <header className="text-center">
            <span className="eyebrow-ref eyebrow-ref-center">The team</span>
            <h1 className="mt-4 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
              The people behind <span className="text-[#0f6b5c]">the progress.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
              Founder-led and conversation-first. Every Language Hub trainer is specialist-trained,
              experienced, and genuinely invested in your growth.
            </p>
          </header>
        </div>

        {/* ── CEO · Founder — the exact homepage profile card ── */}
        <FounderSpotlight />

        <div className="mx-auto max-w-6xl px-5 pb-12 lg:px-8">
          {team.length > 0 ? (
            <>
              <p className="eyebrow-ref">The training faculty</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {team.map((member) => (
                  <article
                    key={member.name}
                    className="surface-card group relative flex h-full flex-col overflow-hidden text-center"
                  >
                    <span aria-hidden className="card-sheen" />

                    {/* profile header band */}
                    <div className="relative h-24 overflow-hidden bg-[linear-gradient(135deg,#0f6b5c_0%,#0a4e43_62%,#073b33_100%)]">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-70"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 18px)",
                        }}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -right-1 -bottom-3 select-none font-display text-[5rem] font-black leading-none tracking-[-0.04em] text-white/10"
                      >
                        {iniciales(member.name)}
                      </span>
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#7ef0c9,#14a08c,#f5b93c,#fb6a47)]"
                      />
                    </div>

                    <div className="relative -mt-11 flex flex-1 flex-col px-6 pb-6">
                      <span className="relative mx-auto block">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute -inset-2 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,rgba(20,160,140,0.32),transparent_72%)] opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100"
                        />
                        <span className="relative grid h-[5.5rem] w-[5.5rem] place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#14a08c] to-[#0a4e43] ring-4 ring-white shadow-[0_18px_34px_-18px_rgba(10,78,67,0.6)]">
                          {member.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.image}
                              alt={member.name}
                              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                            />
                          ) : (
                            <span className="font-display text-[1.55rem] font-black tracking-tight text-white">
                              {iniciales(member.name)}
                            </span>
                          )}
                        </span>
                      </span>

                      <h3 className="relative mt-3 font-display text-[1.08rem] font-extrabold tracking-[-0.01em] text-ink">
                        {member.name}
                      </h3>
                      <p className="relative mt-1 font-display text-[0.56rem] font-bold uppercase tracking-[0.16em] text-[#0f6b5c]">
                        {member.role}
                      </p>

                      {member.credentials.length > 0 ? (
                        <div className="relative mt-3 flex flex-wrap items-center justify-center gap-1.5">
                          {member.credentials.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1 rounded-full border border-[#d7f0e9] bg-[#f3fbf8] px-2.5 py-1 font-display text-[0.52rem] font-bold uppercase tracking-[0.08em] text-[#0a4e43]"
                            >
                              <BadgeCheck className="h-3 w-3 text-[#14a08c]" /> {c}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <p className="relative mt-4 line-clamp-4 font-sans text-[0.83rem] leading-[1.75] text-ink-2">
                        {member.bio}
                      </p>

                      {member.focus.length > 0 ? (
                        <div className="relative mt-auto flex flex-wrap items-center justify-center gap-1.5 border-t border-line pt-4">
                          {member.focus.map((f) => (
                            <span
                              key={f}
                              className="rounded-full border border-line bg-[#f9fdfc] px-2.5 py-1 font-display text-[0.52rem] font-bold uppercase tracking-[0.1em] text-ink-2"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="grid place-items-center rounded-[2rem] border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf7f3] text-[#0f6b5c]">
                <GraduationCap className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="mt-4 font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#d9532f]">
                The training faculty
              </p>
              <p className="mt-2 font-display text-[1.05rem] font-bold text-ink-2">
                Trainer profiles are on the way
              </p>
              <p className="mt-1 text-[0.86rem] text-ink-3">
                Our trainers&apos; profiles will appear here soon.
              </p>
            </div>
          )}

          {/* CTA — one clear primary, one quiet secondary, one text link */}
          <div className="mt-12 text-center">
            <p className="font-display text-[0.9rem] font-bold text-ink-2">
              Ready to learn with a team that cares?
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <ApplyButton className="btn-teal h-12 px-8 text-[0.84rem]">
                Enroll today <ArrowRight className="h-4 w-4" strokeWidth={2.3} />
              </ApplyButton>
              <Link href="/success-stories" className="btn btn-outline h-12 px-8 text-[0.84rem]">
                See student results
              </Link>
            </div>
            <p className="mt-4 text-[0.84rem] text-ink-3">
              Not sure where to start?{" "}
              <Link
                href="/placement-test"
                className="font-semibold text-brand-deep underline decoration-brand/30 underline-offset-4 transition-colors hover:text-brand"
              >
                Take the free placement test
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}