import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  GraduationCap,
  MessageCircle,
  Mic,
  Sparkles,
  Users,
} from "lucide-react";
import { FALLBACK_COURSES, formatPKR, courseSlug, type CourseInfo, type CourseModule } from "@/lib/course-data";
import { COURSE_FEATURES, CONTACT, COURSE_FAQS, whatsappLink } from "@/lib/content";
import { registrationKeyForCatalogName } from "@/lib/registration-config";
import { ApplyButton } from "@/components/courses/ApplyButton";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { appBaseUrl } from "@/lib/base-url";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

const baseUrl = appBaseUrl();

function resolveCourse(slug: string): CourseInfo | undefined {
  return FALLBACK_COURSES.find((c) => courseSlug(c.name) === slug);
}

export function generateStaticParams() {
  return FALLBACK_COURSES.map((c) => ({ slug: courseSlug(c.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = resolveCourse(slug);
  if (!course) return { title: "Course Not Found | Language Hub" };

  return {
    title: `${course.name} | Language Hub`,
    description: course.description,
    alternates: { canonical: `${baseUrl}/courses/${slug}` },
    openGraph: {
      title: `${course.name} — Language Hub`,
      description: course.description,
      url: `${baseUrl}/courses/${slug}`,
      siteName: "Language Hub",
      type: "website",
    },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = resolveCourse(slug);
  if (!course) notFound();

  const features = COURSE_FEATURES[course.name] ?? [];
  const whatsapp = whatsappLink(`Hi Language Hub! I'd like to know more about ${course.name}.`);
  const batchSummary = course.batches.map((b) => b.name).join(" · ");

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    provider: { "@type": "EducationalOrganization", name: "Language Hub", url: baseUrl },
    offers: {
      "@type": "Offer",
      price: course.fee,
      priceCurrency: course.currency,
      category: "course",
      availability: "https://schema.org/InStock",
    },
    url: `${baseUrl}/courses/${slug}`,
    hasCourseInstance: course.batches.map((b) => ({
      "@type": "CourseInstance",
      courseMode: "online",
      schedule: b.time,
      courseWorkload: course.duration,
    })),
    ...(course.modules && course.modules.length > 0
      ? {
          hasPart: course.modules.map((m, i) => ({
            "@type": "CoursePart",
            name: m.title,
            position: i + 1,
            description: m.topics.join(", "),
            timeRequired: m.weeks,
          })),
        }
      : {}),
  };

  const webpageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${course.name} | Language Hub`,
    url: `${baseUrl}/courses/${slug}`,
    description: course.description,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: "Language Hub", url: baseUrl },
    primaryImageOfPage: { "@type": "ImageObject", url: `${baseUrl}/opengraph-image` },
  };

  const courseFaqJsonLd = COURSE_FAQS[course.name]?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: COURSE_FAQS[course.name].map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }} />
      {courseFaqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseFaqJsonLd) }} />
      ) : null}

      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
          {/* Breadcrumb */}
          <Link
            href="/#courses"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 backdrop-blur transition-all hover:border-brand/45 hover:text-brand-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All courses
          </Link>

          {/* ─── Hero — premium gradient card ─── */}
          <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0B1B3A_0%,#1647C7_62%,#4A6CF7_100%)] text-white shadow-[0_60px_120px_-50px_rgb(22_71_199/0.75)]">
            {/* texture + glow */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div
                className="absolute inset-0 opacity-[0.09]"
                style={{
                  backgroundImage: "radial-gradient(rgb(255 255 255 / 0.7) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-[50%]" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(56 189 248 / 0.35), transparent 70%)" }} />
              <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-[50%]" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(99 102 241 / 0.4), transparent 70%)" }} />
            </div>

            <div className="relative grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-12">
              {/* Left */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.26em] text-white/90 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" /> {course.teacher}
                </span>
                <h1 className="mt-4 font-display text-[clamp(2.2rem,6vw,3.4rem)] font-black leading-[1.05] tracking-[-0.03em]">
                  {course.name}
                </h1>
                <p className="mt-2 font-display text-[1.15rem] font-semibold text-[#BFD6FF]">{course.tagline}</p>
                <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-white/85">{course.description}</p>

                {/* key chips */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    { icon: <Clock className="h-3.5 w-3.5" />, label: course.duration },
                    { icon: <CalendarDays className="h-3.5 w-3.5" />, label: course.schedule },
                    { icon: <Users className="h-3.5 w-3.5" />, label: "10–20 per batch" },
                    { icon: <Award className="h-3.5 w-3.5" />, label: `From ${formatPKR(course.fee)}/mo` },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 font-display text-[0.72rem] font-bold tracking-wide text-white backdrop-blur"
                    >
                      {chip.icon} {chip.label}
                    </span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <ApplyButton
                    courseKey={registrationKeyForCatalogName(course.name)}
                    className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 font-display text-[0.85rem] font-bold text-[#1647C7] shadow-[0_18px_40px_-18px_rgb(255_255_255/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-20px_rgb(255_255_255/0.8)]"
                  >
                    Apply now
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.4} />
                  </ApplyButton>
                  {whatsapp ? (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 font-display text-[0.8rem] font-bold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                    >
                      <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Right — at a glance */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-md sm:p-6">
                <p className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.3em] text-white/60">
                  At a glance
                </p>
                <div className="mt-4 flex flex-col divide-y divide-white/10">
                  <GlanceRow icon={<Clock className="h-4 w-4" />} label="Duration" value={course.duration} />
                  <GlanceRow icon={<CalendarDays className="h-4 w-4" />} label="Schedule" value={course.schedule} />
                  <GlanceRow icon={<Users className="h-4 w-4" />} label="Batches" value={batchSummary} />
                  <GlanceRow icon={<GraduationCap className="h-4 w-4" />} label="Fee (incl. registration)" value={formatPKR(course.fee)} accent />
                </div>
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3.5 py-2.5 font-display text-[0.72rem] font-bold text-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Live classes · Free demo available
                </p>
              </div>
            </div>
          </section>

          {/* ─── What you'll learn ─── */}
          {course.outcomes && course.outcomes.length > 0 ? (
            <section className="mt-14">
              <SectionTitle>What you&apos;ll learn</SectionTitle>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <div key={o} className="flex items-start gap-3 rounded-2xl border border-brand/10 bg-white px-4 py-3.5 shadow-[0_12px_34px_-20px_rgb(15_23_42/0.25)]">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-deep">
                      <CheckCircle className="h-3 w-3" />
                    </span>
                    <span className="text-[0.88rem] font-medium text-ink">{o}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* ─── What you get ─── */}
          {features.length > 0 ? (
            <section className="mt-14">
              <SectionTitle>What you get</SectionTitle>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 rounded-2xl border border-brand/10 bg-white px-4 py-3.5 text-[0.9rem] font-medium text-ink shadow-[0_12px_34px_-20px_rgb(15_23_42/0.25)]">
                    <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-xs text-brand-deep">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ─── Syllabus ─── */}
          {course.modules && course.modules.length > 0 ? (
            <section className="mt-14">
              <SectionTitle>Syllabus</SectionTitle>
              <p className="mt-2 text-[0.92rem] text-ink-2">
                {course.name} is split into {course.modules.length} focused modules over {course.duration}.
              </p>
              <div className="mt-6 flex flex-col gap-4">
                {course.modules.map((m, i) => (
                  <ModuleCard key={m.title} module={m} index={i} />
                ))}
              </div>
            </section>
          ) : null}

          {/* ─── Batches ─── */}
          {course.batches.length > 0 ? (
            <section className="mt-14">
              <SectionTitle>Batches</SectionTitle>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.batches.map((b) => (
                  <div key={b.name} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white px-5 py-4 shadow-[0_12px_34px_-20px_rgb(15_23_42/0.25)]">
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand-deep">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-display text-[0.95rem] font-extrabold text-ink">{b.name}</p>
                        <p className="font-mono text-[0.68rem] text-ink-3">{b.time}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[0.68rem] text-ink-3">{b.seatsTotal} seats</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* ─── Experience the method (replaces the demo video) ─── */}
          <section className="mt-14">
            <div className="relative overflow-hidden rounded-[2rem] border border-[#BFD6FF] bg-white p-7 shadow-[0_34px_80px_-40px_rgb(37_99_235/0.4)] sm:p-9">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-[50%]"
                style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(37 99 235 / 0.12), transparent 70%)" }}
              />
              <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <p className="flex items-center gap-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#2563EB]">
                    <span aria-hidden className="h-px w-8 bg-[#2563EB]/40" />
                    How sessions feel
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.01em] text-ink">
                    See the method <span className="brand-text">in action.</span>
                  </h2>
                  <div className="mt-6 flex flex-col gap-3">
                    {[
                      { icon: <Mic className="h-4 w-4" />, text: "Conversation-first sessions — you speak from day one" },
                      { icon: <Users className="h-4 w-4" />, text: "Small batches of 10–20, so every voice is heard" },
                      { icon: <Award className="h-4 w-4" />, text: "Mock tests, personal reviews and honest feedback" },
                      { icon: <BookOpen className="h-4 w-4" />, text: "Structured syllabus with trackable weekly progress" },
                    ].map((row) => (
                      <div key={row.text} className="flex items-center gap-3 rounded-xl border border-brand/10 bg-[#F7F9FF] px-4 py-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-deep">
                          {row.icon}
                        </span>
                        <span className="text-[0.88rem] font-medium text-ink">{row.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live-demo card */}
                <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1647C7,#6D4AFF)] p-6 text-white shadow-[0_30px_70px_-30px_rgb(22_71_199/0.8)] sm:p-7">
                  <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-[50%] bg-white/10 blur-2xl" />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                    <BookOpen className="h-3.5 w-3.5" /> Prefer to see it live?
                  </span>
                  <h3 className="mt-4 font-display text-[1.5rem] font-extrabold leading-tight">
                    Book a free demo class
                  </h3>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-white/80">
                    Join a real session, meet the trainer and try the method — no
                    commitment, no pressure. See for yourself before you decide.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <BookDemoButton />
                    {whatsapp ? (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 font-display text-[0.78rem] font-bold uppercase tracking-[0.1em] text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Per-course FAQ ─── */}
          {COURSE_FAQS[course.name]?.length ? (
            <section className="mt-14 max-w-4xl">
              <SectionTitle>Frequently asked questions</SectionTitle>
              <div className="mt-6 flex flex-col gap-4">
                {COURSE_FAQS[course.name].map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-2xl border border-ink/10 bg-white px-6 py-5 transition-all hover:border-brand/30"
                  >
                    <summary className="cursor-pointer list-none font-display text-[0.95rem] font-bold text-ink">
                      <span className="flex items-center justify-between gap-4">
                        {f.q}
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink/15 text-ink-3 transition-transform duration-300 group-open:rotate-45">
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-3 text-[0.92rem] leading-relaxed text-ink-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {/* ─── Bottom CTA ─── */}
          <div className="mt-14 flex flex-wrap items-center gap-4">
            <ApplyButton
              courseKey={registrationKeyForCatalogName(course.name)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] px-8 font-display text-[0.9rem] font-bold text-white shadow-[0_16px_40px_-16px_rgb(79_70_229/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              <BookOpen className="h-4 w-4" /> Apply for this course
            </ApplyButton>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-8 font-display text-[0.9rem] font-bold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                Ask a question
              </a>
            ) : null}
          </div>

          {CONTACT.phone ? (
            <p className="mt-8 text-center font-mono text-[0.7rem] uppercase tracking-widest text-ink-3">
              Need help choosing? Call <span className="font-bold text-ink-2">{CONTACT.phone}</span>
            </p>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-[1.35rem] font-extrabold tracking-[-0.01em] text-ink">
      <span aria-hidden className="h-6 w-1 rounded-full bg-gradient-to-b from-[#2563EB] to-[#6D4AFF]" />
      {children}
    </h2>
  );
}

function GlanceRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white/80">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-display text-[0.56rem] font-bold uppercase tracking-[0.24em] text-white/55">{label}</p>
        <p className={accent ? "truncate font-display text-[1rem] font-extrabold text-white" : "truncate font-display text-[0.95rem] font-bold text-white/95"}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ModuleCard({ module: m, index }: { module: CourseModule; index: number }) {
  const colors = ["#2563EB", "#0EA5E9", "#7C3AED", "#059669"];
  const color = colors[index % colors.length];

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white transition-all hover:shadow-[0_12px_40px_-16px_rgb(15_23_42/0.15)]">
      <div className="flex items-center gap-4 px-6 py-5">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-[0.95rem] font-extrabold text-white"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </span>
        <div className="flex-1">
          <h3 className="font-display text-[1rem] font-extrabold text-ink">{m.title}</h3>
          <p className="font-mono text-[0.65rem] text-ink-3">{m.weeks}</p>
        </div>
      </div>
      <div className="border-t border-ink/[0.06] px-6 py-4">
        <ul className="grid gap-2 sm:grid-cols-2">
          {m.topics.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[0.85rem] text-ink-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              {t}
            </li>
          ))}
        </ul>
        {m.sampleLesson ? (
          <div className="mt-4 rounded-xl border border-brand/10 bg-brand/[0.04] px-4 py-3">
            <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-brand-deep">
              Sample lesson
            </p>
            <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-2">{m.sampleLesson}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}