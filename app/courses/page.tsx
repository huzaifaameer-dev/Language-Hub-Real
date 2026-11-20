import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award as AwardIcon,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { FALLBACK_COURSES, type CourseInfo } from "@/lib/course-data";
import { listCourses, toCourseInfo } from "@/lib/server/catalog";
import { CourseCatalogue } from "@/components/courses/CourseCatalogue";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { jsonLdScript } from "@/lib/seo";

/** ISR: courses cached at the edge, revalidated every 30s (admin changes publish fast). */
export const revalidate = 30;

export const metadata: Metadata = {
  title: "Courses & Programmes | Language Hub",
  description:
    "Spoken English, IELTS General & Academic, PTE · GRE · Duolingo and Writing & Communication — live small-batch classes, transparent fees and flexible timings.",
};

async function getCourses(): Promise<CourseInfo[]> {
  try {
    const rows = await listCourses(true);
    if (rows.length > 0) return rows.map(toCourseInfo);
  } catch {
    // fall through to the static seed
  }
  return FALLBACK_COURSES;
}

const STEPS = [
  {
    step: "01",
    title: "Choose your programme",
    text: "Pick the path that matches your goal — fluency, an exam score or sharper writing.",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Apply in two minutes",
    text: "Tell us your target and current level. Applications are reviewed the moment you submit.",
    icon: Send,
  },
  {
    step: "03",
    title: "Pay one clear fee",
    text: "EasyPaisa, JazzCash, card or bank — a single monthly fee, no hidden charges.",
    icon: ShieldCheck,
  },
  {
    step: "04",
    title: "Start speaking",
    text: "Join a live small batch with a personal syllabus and a teacher who knows your name.",
    icon: AwardIcon,
  },
];

export default async function CoursesPage() {
  const courses = await getCourses();
  const totalModules = courses.reduce((sum, c) => sum + (c.modules?.length ?? 0), 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
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

      <main className="min-h-screen bg-site pt-[6.4rem]">
        {/* ── hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-[#edf5f2] bg-[linear-gradient(180deg,#f2fbf7_0%,#f9fdfc_70%,#ffffff_100%)] px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
          <span aria-hidden className="pointer-events-none absolute -left-28 -top-20 h-[26rem] w-[26rem] rounded-full bg-[#14a08c]/10 blur-[120px]" />
          <span aria-hidden className="pointer-events-none absolute -right-24 top-24 h-[22rem] w-[22rem] rounded-full bg-[#f5b93c]/12 blur-[120px]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col gap-9 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Reveal>
                  <span className="eyebrow-ref">
                    <Sparkles className="h-3.5 w-3.5" />
                    {courses.length} programmes · live small-batch classes
                  </span>
                </Reveal>

                <Reveal delay={0.06} y={22}>
                  <h1 className="section-title-ref mt-4">
                    Find the course that{" "}
                    <span className="relative inline-block text-[#0f6b5c]">
                      fits your goal.
                      <svg
                        aria-hidden
                        viewBox="0 0 240 12"
                        fill="none"
                        className="absolute -bottom-1 left-0 h-2 w-full"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M2 8.5C58 4.5 160 4 238 7"
                          stroke="#fb6a47"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          opacity="0.65"
                        />
                      </svg>
                    </span>
                  </h1>
                </Reveal>

                <Reveal delay={0.12} y={18}>
                  <p className="mt-5 max-w-xl font-sans text-[0.98rem] leading-[1.8] text-ink-2">
                    Spoken English, IELTS, PTE and Writing — transparent fees, clear
                    schedules and the exact syllabus you will cover. Choose a path and
                    start this month.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={0.16} y={18}>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:w-[24rem]">
                  {[
                    { icon: GraduationCap, value: `${courses.length}`, label: "Focused programmes" },
                    { icon: Users, value: "12", label: "Learners per batch" },
                    { icon: BookOpen, value: `${totalModules}`, label: "Syllabus modules" },
                    { icon: CalendarDays, value: "Monthly", label: "Fresh intakes" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_18px_40px_-36px_rgba(10,78,67,0.5)]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf7f3] text-[#0f6b5c]">
                        <s.icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[0.92rem] font-extrabold leading-none text-ink">
                          {s.value}
                        </span>
                        <span className="mt-1 block font-sans text-[0.64rem] leading-tight text-ink-3">
                          {s.label}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── catalogue ────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 pt-12 sm:px-8 sm:pb-24 sm:pt-14">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <CourseCatalogue courses={courses} />
            </Reveal>
          </div>
        </section>

        {/* ── how it works ─────────────────────────────────────────────── */}
        <section className="border-y border-[#edf5f2] bg-[#f9fdfc] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="max-w-2xl">
                <span className="eyebrow-ref">
                  <Sparkles className="h-3.5 w-3.5" /> Simple &amp; transparent
                </span>
                <h2 className="section-title-ref mt-4">
                  From here to{" "}
                  <span className="relative inline-block text-[#0f6b5c]">
                    fluent.
                    <svg
                      aria-hidden
                      viewBox="0 0 240 12"
                      fill="none"
                      className="absolute -bottom-1 left-0 h-2 w-full"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M2 8.5C58 4.5 160 4 238 7"
                        stroke="#fb6a47"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        opacity="0.65"
                      />
                    </svg>
                  </span>
                </h2>
                <p className="mt-4 max-w-xl font-sans text-[0.95rem] leading-[1.8] text-ink-2">
                  Four steps, no surprises — pick a course, tell us your goal, pay the one
                  clear fee, and start speaking in a small live class.
                </p>
              </div>
            </Reveal>

            <div className="relative mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <span
                aria-hidden
                className="pointer-events-none absolute left-[6%] right-[6%] top-[3.2rem] hidden h-px bg-[linear-gradient(90deg,transparent,#cfe3da_12%,#cfe3da_88%,transparent)] lg:block"
              />
              {STEPS.map((s, i) => (
                <Reveal key={s.step} delay={i * 0.08} y={26}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-[#e3ede9] bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#0f6b5c]/30 hover:shadow-[0_24px_54px_-26px_rgba(10,78,67,0.45)]">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-3 -top-4 select-none font-display text-[4.5rem] font-extrabold text-ink/[0.04]"
                    >
                      {s.step}
                    </span>
                    <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#0f6b5c] to-[#14a08c] text-white shadow-[0_12px_26px_-12px_rgba(10,78,67,0.7)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                      <s.icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <h3 className="relative mt-4 font-display text-[1.02rem] font-extrabold text-ink">
                      {s.title}
                    </h3>
                    <p className="relative mt-1.5 font-sans text-[0.84rem] leading-relaxed text-ink-2">
                      {s.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA band ─────────────────────────────────────────────────── */}
        <section className="px-5 py-16 sm:px-8 sm:py-20">
          <Reveal>
            <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#0f6b5c_0%,#0a4e43_55%,#063a33_100%)] px-7 py-9 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-11">
              <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-[#7ef0c9]/20 blur-3xl" />
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,#7ef0c9,#f5b93c,#fb6a47)]" />

              <div className="relative max-w-xl">
                <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#9be8d3]">
                  Not sure where to start?
                </p>
                <h2 className="mt-2 font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-tight tracking-[-0.02em]">
                  Take the free placement test — we&apos;ll point you to the right batch.
                </h2>
                <p className="mt-2 font-sans text-[0.9rem] leading-relaxed text-white/70">
                  Ten minutes, instant level, no obligation. Then a teacher helps you choose.
                </p>
              </div>

              <div className="relative flex flex-wrap gap-3">
                <Link
                  href="/placement-test"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-display text-[0.8rem] font-bold text-[#0a4e43] transition hover:-translate-y-0.5 hover:bg-[#eaf7f3]"
                >
                  Free placement test
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 font-display text-[0.8rem] font-bold text-white transition hover:-translate-y-0.5 hover:border-[#7ef0c9]/60 hover:text-[#7ef0c9]"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}
