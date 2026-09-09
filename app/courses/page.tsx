import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award as AwardIcon,
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  Languages,
  Laptop,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { getCoursesCollection } from "@/lib/db";
import { FALLBACK_COURSES, courseSlug, formatPKR, type CourseInfo } from "@/lib/course-data";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Courses & Programmes | Language Hub",
  description:
    "Spoken English, IELTS, PTE and Duolingo — live small-batch classes, real conversation practice, transparent monthly fees and flexible timings.",
};

const ACCENTS = ["#6e5ae0", "#2bb3d8", "#d63a8c", "#2e9e6b"];
const ICONS = [MessageCircle, GraduationCap, Laptop, Languages];

async function getCourses(): Promise<CourseInfo[]> {
  try {
    const col = await getCoursesCollection();
    const docs = await col.find({ active: true }).sort({ order: 1 }).limit(40).toArray();
    if (docs.length > 0) return docs as unknown as CourseInfo[];
  } catch {
    // fall through to seed
  }
  return FALLBACK_COURSES;
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Language Hub Programmes",
            itemListElement: courses.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: { "@type": "Course", name: c.name, description: c.description },
            })),
          }),
        }}
      />
      <Navbar />
      <main className="min-h-screen bg-[#faf8f4] pt-24">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-10 sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(900px 520px at 85% -10%, rgb(99 102 241 / 0.12), transparent 60%), radial-gradient(700px 480px at -5% 30%, rgb(139 92 246 / 0.1), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl pt-8">
            <Reveal>
            <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
              <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
              {courses.length} programmes · live small-batch classes
            </p>
          </Reveal>
          <Reveal delay={0.08} y={22}>
            <h1 className="mt-4 font-display text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink">
              Every course, <span className="brand-text">fully detailed.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16} y={18}>
            <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-ink-2">
              Spoken English, IELTS, PTE and Duolingo — with transparent fees,
              schedules, batches and the exact syllabus you will cover. Choose a
              path and start today.
            </p>
          </Reveal>
          </div>
        </section>

        {/* Big detailed cards */}
        <section className="px-6 pb-24 sm:px-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-10">
            {courses.map((c, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              const Icon = ICONS[i % ICONS.length];
              const years = c.modules ?? [];
              return (
                <Reveal key={c.name} delay={i * 0.06} y={40} blur>
                <article
                  className="group relative overflow-hidden rounded-[2rem] border border-ink/[0.07] bg-white shadow-[0_34px_90px_-40px_rgb(15_23_42/0.28)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_50px_120px_-46px_rgb(15_23_42/0.42)]"
                  id={courseSlug(c.name)}
                >
                  {/* accent ribbon */}
                  <div className="relative h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}25)` }} />
                  {/* soft accent glow + ghost number */}
                  <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-[0.08] blur-3xl transition-opacity duration-700 group-hover:opacity-[0.16]" style={{ background: accent }} />
                  <span aria-hidden className="pointer-events-none absolute right-6 top-8 select-none font-display text-[6.5rem] font-extrabold leading-none text-ink/[0.04] transition-colors duration-700 group-hover:text-ink/[0.06]">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
                    {/* Left: identity + outcomes */}
                    <div className="p-7 sm:p-10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span
                            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
                            style={{ background: `linear-gradient(145deg, ${accent}, ${accent}b3)`, boxShadow: `0 16px 34px -16px ${accent}` }}
                          >
                            <Icon className="h-7 w-7" strokeWidth={1.8} />
                          </span>
                          <div>
                            <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                              Programme {String(i + 1).padStart(2, "0")}
                            </p>
                            <h2 className="font-display text-[1.7rem] font-extrabold tracking-[-0.02em] text-ink sm:text-2xl">
                              {c.name}
                            </h2>
                          </div>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-3 py-1 font-display text-[0.62rem] font-bold uppercase tracking-[0.14em]"
                          style={{ backgroundColor: `${accent}15`, color: accent }}
                        >
                          {c.duration}
                        </span>
                      </div>

                      <p className="mt-4 max-w-xl font-serif text-[1.02rem] italic leading-relaxed text-ink-2">
                        {c.description}
                      </p>

                      {/* Meta strip */}
                      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.84rem] text-ink-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4" style={{ color: accent }} /> {c.schedule}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4" style={{ color: accent }} /> Small batches 10–20
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" style={{ color: accent }} /> {c.modules?.length ?? 0} syllabus modules
                        </span>
                      </div>

                      {/* Outcomes */}
                      <div className="mt-6">
                        <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-ink-3">
                          What you&apos;ll achieve
                        </p>
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                          {(c.outcomes ?? []).map((o) => (
                            <li key={o} className="flex items-start gap-2 text-[0.88rem] leading-snug text-ink-2">
                              <svg aria-hidden viewBox="0 0 12 12" fill="none" className="mt-1 h-3.5 w-3.5 shrink-0">
                                <path d="M2.2 6.4 4.8 9l4.9-6" stroke={accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right: price, batches, syllabus, CTAs */}
                    <div className="border-t border-ink/[0.06] bg-[#fbfcff] p-7 sm:p-10 lg:border-l lg:border-t-0">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                            Monthly fee
                          </p>
                          <p className="font-display text-[2rem] font-extrabold leading-none text-ink">
                            {formatPKR(c.fee)}
                            <span className="text-[0.8rem] font-semibold text-ink-3">/month</span>
                          </p>
                        </div>
                        <div className="rounded-2xl border border-ink/[0.08] bg-white px-4 py-3">
                          <p className="flex items-center gap-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                            <Wallet className="h-3.5 w-3.5" style={{ color: accent }} /> Fee in PKR
                          </p>
                          <p className="mt-0.5 font-mono text-[0.8rem] font-semibold text-ink-2">Clear · no hidden charges</p>
                        </div>
                      </div>

                      {/* Batches */}
                      <div className="mt-6">
                        <p className="flex items-center gap-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-ink-3">
                          <CalendarDays className="h-3.5 w-3.5" style={{ color: accent }} /> Batches & timings
                        </p>
                        <div className="mt-3 flex flex-col gap-2">
                          {(c.batches ?? []).map((b) => (
                            <div key={b.name} className="flex items-center justify-between gap-3 rounded-xl border border-ink/[0.07] bg-white px-4 py-3">
                              <span className="font-display text-[0.9rem] font-bold text-ink">{b.name}</span>
                              <span className="font-mono text-[0.78rem] font-semibold text-ink-2">{b.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Syllabus preview */}
                      {years.length > 0 && (
                        <div className="mt-6">
                          <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-ink-3">
                            Syllabus preview
                          </p>
                          <ol className="mt-3 space-y-2">
                            {years.slice(0, 4).map((m) => (
                              <li key={m.title} className="flex items-baseline gap-2 text-[0.88rem]">
                                <span className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full" style={{ backgroundColor: accent }} />
                                <span className="font-semibold text-ink">{m.title}</span>
                                <span className="ml-auto shrink-0 font-mono text-[0.62rem] text-ink-3">{m.weeks}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* CTAs */}
                      <div className="mt-7 flex flex-col gap-2.5">
                        <Link
                          href="/signup"
                          className="group/apply relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 font-display text-[0.78rem] font-bold uppercase tracking-[0.18em] text-white transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
                          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 18px 40px -16px ${accent}` }}
                        >
                          <span aria-hidden className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/apply:translate-x-[150%]" />
                          <Sparkles className="h-4 w-4" /> Apply now
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/apply:translate-x-1" />
                        </Link>
                        <Link
                          href={`/courses/${courseSlug(c.name)}`}
                          className="group/sec inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-ink/[0.14] font-display text-[0.74rem] font-bold uppercase tracking-[0.18em] text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white hover:shadow-[0_16px_36px_-18px_rgb(15_23_42/0.5)]"
                        >
                          Explore this course
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/sec:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 pb-16 sm:px-12">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="text-center">
                <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-gold-deep">
                  Simple &amp; transparent
                </p>
                <h2 className="mt-3 font-display text-[clamp(1.6rem,4vw,2.5rem)] font-extrabold tracking-[-0.02em] text-ink">
                  From here to <span className="brand-text">fluent</span>
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
                  Four steps, no surprises — pick a course, tell us your goal, pay
                  the one clear fee, and start speaking in a small live class.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Choose your course",
                  text: "Spoken English, IELTS, PTE or Duolingo — matched to your goal.",
                  icon: BookOpen,
                },
                {
                  step: "02",
                  title: "Apply & get reviewed",
                  text: "Your application is reviewed instantly — you hear back the moment you submit.",
                  icon: Send,
                },
                {
                  step: "03",
                  title: "Pay securely",
                  text: "EasyPaisa, JazzCash, debit/credit card or bank — one clear monthly fee.",
                  icon: ShieldCheck,
                },
                {
                  step: "04",
                  title: "Start learning",
                  text: "Live small batches, a personal syllabus and a completion certificate.",
                  icon: AwardIcon,
                },
              ].map((s, i) => (
                <Reveal key={s.step} delay={i * 0.08} y={26}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-ink/[0.07] bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_24px_54px_-26px_rgb(99_102_241/0.45)]">
                    <span aria-hidden className="pointer-events-none absolute -right-3 -top-4 select-none font-display text-[4.5rem] font-extrabold text-ink/[0.04]">
                      {s.step}
                    </span>
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-magenta text-white shadow-[0_12px_26px_-12px_rgb(124_58_237/0.7)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                      <s.icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <h3 className="mt-4 font-display text-[1.05rem] font-extrabold text-ink">{s.title}</h3>
                    <p className="mt-1.5 text-[0.86rem] leading-relaxed text-ink-2">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="px-6 pb-24 sm:px-12">
          <Reveal>
            <div className="mx-auto grid max-w-6xl gap-4 rounded-2xl border border-ink/[0.07] bg-white p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
              {[
                { icon: Users, label: "Small batches 10–20", sub: "Everyone speaks every session" },
                { icon: MessageCircle, label: "Real conversation", sub: "Practice from day one" },
                { icon: Wallet, label: "One transparent fee", sub: "No hidden charges" },
                { icon: AwardIcon, label: "Certificate on completion", sub: "Share your result card" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/[0.08] text-brand-deep">
                    <t.icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <span>
                    <span className="block font-display text-[0.88rem] font-extrabold text-ink">{t.label}</span>
                    <span className="block text-[0.72rem] text-ink-3">{t.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}