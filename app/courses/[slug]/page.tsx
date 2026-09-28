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
  Phone,
  ShieldCheck,
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

          {/* ─── Hero ─── */}
          <header className="mt-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-3.5 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#1647C7]">
                <Sparkles className="h-3.5 w-3.5" /> {course.teacher}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live · In session
              </span>
            </div>
            <h1 className="mt-4 font-display text-[clamp(2.3rem,6.5vw,4rem)] font-black leading-[1.02] tracking-[-0.03em] text-ink">
              {course.name}
            </h1>
            <p className="mt-3 max-w-2xl font-display text-[1.2rem] font-semibold leading-snug text-[#1647C7]">
              {course.tagline}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: <Clock className="h-3.5 w-3.5" />, label: course.duration },
                { icon: <CalendarDays className="h-3.5 w-3.5" />, label: course.schedule },
                { icon: <Users className="h-3.5 w-3.5" />, label: "10–20 per batch" },
                { icon: <Award className="h-3.5 w-3.5" />, label: `From ${formatPKR(course.fee)}/mo` },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-ink-2 shadow-sm"
                >
                  {chip.icon} {chip.label}
                </span>
              ))}
            </div>
          </header>

          {/* ─── Two-column layout: content + sticky sidebar ─── */}
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
            <div className="min-w-0 space-y-16">
              {/* About */}
              <section>
                <SectionNumber n="01" />
                <h2 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.8rem)] font-extrabold tracking-[-0.01em] text-ink">
                  About this course
                </h2>
                <p className="mt-4 max-w-2xl text-[1rem] leading-[1.7] text-ink-2">{course.description}</p>
              </section>

              {/* What you'll learn */}
              {course.outcomes && course.outcomes.length > 0 ? (
                <section>
                  <SectionNumber n="02" />
                  <h2 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.8rem)] font-extrabold tracking-[-0.01em] text-ink">
                    What you&apos;ll learn
                  </h2>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {course.outcomes.map((o) => (
                      <div
                        key={o}
                        className="flex items-start gap-3 rounded-2xl border border-ink/[0.08] bg-white px-4 py-3.5 shadow-[0_14px_34px_-24px_rgb(15_23_42/0.35)]"
                      >
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2563EB]/10 text-[#2563EB]">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[0.9rem] font-medium leading-snug text-ink">{o}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* What you get */}
              {features.length > 0 ? (
                <section>
                  <SectionNumber n="03" />
                  <h2 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.8rem)] font-extrabold tracking-[-0.01em] text-ink">
                    What you get
                  </h2>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 rounded-2xl border border-ink/[0.08] bg-white px-4 py-3.5 text-[0.9rem] font-medium text-ink shadow-[0_14px_34px_-24px_rgb(15_23_42/0.35)]"
                      >
                        <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2563EB]/10 text-[0.7rem] text-[#2563EB]">
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* Syllabus timeline */}
              {course.modules && course.modules.length > 0 ? (
                <section>
                  <SectionNumber n="04" />
                  <h2 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.8rem)] font-extrabold tracking-[-0.01em] text-ink">
                    Syllabus
                  </h2>
                  <p className="mt-2 text-[0.92rem] text-ink-2">
                    {course.name} is split into {course.modules.length} focused modules over {course.duration}.
                  </p>
                  <div className="relative mt-8">
                    {/* rail */}
                    <span
                      aria-hidden
                      className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-gradient-to-b from-[#2563EB]/40 via-[#6D4AFF]/25 to-transparent sm:left-[1.3rem]"
                    />
                    <div className="flex flex-col gap-6">
                      {course.modules.map((m, i) => (
                        <ModuleTimeline key={m.title} module={m} index={i} />
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              {/* Batches */}
              {course.batches.length > 0 ? (
                <section>
                  <SectionNumber n="05" />
                  <h2 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.8rem)] font-extrabold tracking-[-0.01em] text-ink">
                    Available batches
                  </h2>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {course.batches.map((b) => (
                      <div
                        key={b.name}
                        className="flex items-center justify-between rounded-2xl border border-ink/[0.08] bg-white px-5 py-4 shadow-[0_14px_34px_-24px_rgb(15_23_42/0.35)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
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

              {/* Experience the method */}
              <section>
                <SectionNumber n="06" />
                <h2 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.8rem)] font-extrabold tracking-[-0.01em] text-ink">
                  See the method <span className="brand-text">in action.</span>
                </h2>
                <div className="mt-6 rounded-2xl border border-[#BFD6FF] bg-white p-6 shadow-[0_24px_60px_-32px_rgb(37_99_235/0.4)] sm:p-7">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { icon: <Mic className="h-4 w-4" />, text: "Conversation-first sessions — you speak from day one" },
                      { icon: <Users className="h-4 w-4" />, text: "Small batches of 10–20, so every voice is heard" },
                      { icon: <Award className="h-4 w-4" />, text: "Mock tests, personal reviews and honest feedback" },
                      { icon: <BookOpen className="h-4 w-4" />, text: "Structured syllabus with trackable weekly progress" },
                    ].map((row) => (
                      <div key={row.text} className="flex items-center gap-3 rounded-xl border border-brand/10 bg-[#F7F9FF] px-4 py-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
                          {row.icon}
                        </span>
                        <span className="text-[0.86rem] font-medium leading-snug text-ink">{row.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* FAQ */}
              {COURSE_FAQS[course.name]?.length ? (
                <section>
                  <SectionNumber n="07" />
                  <h2 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.8rem)] font-extrabold tracking-[-0.01em] text-ink">
                    Frequently asked questions
                  </h2>
                  <div className="mt-6 flex flex-col gap-3">
                    {COURSE_FAQS[course.name].map((f) => (
                      <details
                        key={f.q}
                        className="group rounded-2xl border border-ink/[0.08] bg-white px-6 py-5 transition-all hover:border-brand/30"
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
            </div>

            {/* ─── Sticky sidebar ─── */}
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="space-y-5">
                {/* Enrollment card */}
                <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white shadow-[0_30px_70px_-36px_rgb(15_23_42/0.45)]">
                  <div className="rounded-t-3xl bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] px-6 py-4 text-white">
                    <p className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.3em] text-white/70">
                      Enrolment
                    </p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-[2rem] font-black leading-none">{formatPKR(course.fee)}</span>
                      <span className="text-[0.8rem] font-semibold text-white/70">/month</span>
                    </div>
                    <p className="mt-1 text-[0.7rem] text-white/70">Includes Rs 1,000 one-time registration · {course.duration}</p>
                  </div>
                  <div className="p-5">
                    <ul className="flex flex-col divide-y divide-ink/[0.06]">
                      {[
                        { icon: <Clock className="h-4 w-4" />, label: "Duration", value: course.duration },
                        { icon: <CalendarDays className="h-4 w-4" />, label: "Schedule", value: course.schedule },
                        { icon: <Users className="h-4 w-4" />, label: "Batches", value: course.batches.map((b) => b.name).join(" · ") },
                        { icon: <BookOpen className="h-4 w-4" />, label: "Format", value: "Live online · small batches" },
                      ].map((row) => (
                        <li key={row.label} className="flex items-center justify-between gap-3 py-3">
                          <span className="flex items-center gap-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                            <span className="text-[#2563EB]">{row.icon}</span> {row.label}
                          </span>
                          <span className="text-[0.82rem] font-semibold text-ink">{row.value}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex flex-col gap-2.5">
                      <ApplyButton
                        courseKey={registrationKeyForCatalogName(course.name)}
                        className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] font-display text-[0.8rem] font-bold uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_-18px_rgb(79_70_229/0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
                      >
                        Apply now <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.4} />
                      </ApplyButton>
                      {whatsapp ? (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 font-display text-[0.8rem] font-bold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-4 w-4" /> Ask a question
                        </a>
                      ) : null}
                    </div>

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-center font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-3">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified by Language Hub
                    </p>
                  </div>
                </div>

                {/* Help card */}
                <div className="rounded-3xl border border-[#BFD6FF] bg-[linear-gradient(135deg,#F4F7FF,#EAF1FF)] p-5">
                  <p className="font-display text-[0.95rem] font-extrabold text-ink">Prefer to see it live?</p>
                  <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-2">
                    Book a free demo class and try the method before you commit.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <BookDemoButton className="w-full" />
                    {CONTACT.phone ? (
                      <a
                        href={`tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink/12 bg-white font-display text-[0.78rem] font-bold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2563EB]/50"
                      >
                        <Phone className="h-4 w-4 text-[#2563EB]" /> {CONTACT.phone}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Bottom reassurance */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-[#E0E9FF] bg-white px-6 py-5">
            {[
              "Free placement test",
              "Certificate on completion",
              "Monthly fee · no hidden costs",
              "Fast WhatsApp support",
            ].map((point) => (
              <span key={point} className="flex items-center gap-2 font-display text-[0.8rem] font-bold text-ink-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> {point}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function SectionNumber({ n }: { n: string }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#2563EB]">
      <span aria-hidden className="h-px w-8 bg-[#2563EB]/40" />
      {n}
    </p>
  );
}

function ModuleTimeline({ module: m, index }: { module: CourseModule; index: number }) {
  const colors = ["#2563EB", "#0EA5E9", "#7C3AED", "#059669"];
  const color = colors[index % colors.length];

  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* node */}
      <div className="relative z-10 shrink-0">
        <span
          className="grid h-10 w-10 place-items-center rounded-full font-display text-[0.9rem] font-extrabold text-white ring-4 ring-[#F4F7FF]"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </span>
      </div>
      {/* body */}
      <div className="min-w-0 flex-1 rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-[0_14px_40px_-28px_rgb(15_23_42/0.4)] transition-all hover:shadow-[0_20px_50px_-30px_rgb(37_99_235/0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[1.05rem] font-extrabold text-ink">{m.title}</h3>
          <span className="rounded-full px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em]" style={{ color, backgroundColor: `${color}12` }}>
            {m.weeks}
          </span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {m.topics.map((t) => (
            <li key={t} className="rounded-full border border-ink/[0.08] bg-[#F7F9FF] px-3 py-1 text-[0.78rem] text-ink-2">
              {t}
            </li>
          ))}
        </ul>
        {m.sampleLesson ? (
          <div className="mt-4 rounded-xl border border-brand/10 bg-brand/[0.04] px-4 py-3">
            <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.2em] text-brand-deep">Sample lesson</p>
            <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-2">{m.sampleLesson}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}