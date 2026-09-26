import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, Clock, GraduationCap, Play, Users, CheckCircle } from "lucide-react";
import { FALLBACK_COURSES, formatPKR, courseSlug, type CourseInfo, type CourseModule } from "@/lib/course-data";
import { COURSE_FEATURES, CONTACT, COURSE_FAQS, whatsappLink } from "@/lib/content";
import { registrationKeyForCatalogName } from "@/lib/registration-config";
import { ApplyButton } from "@/components/courses/ApplyButton";
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
    provider: {
      "@type": "EducationalOrganization",
      name: "Language Hub",
      url: baseUrl,
    },
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

  // WebPage schema unifies the page's metadata + course for rich search results.
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

  // Per-course FAQPage schema for rich results.
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }}
      />
      {courseFaqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseFaqJsonLd) }}
        />
      ) : null}
      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
          <Link
            href="/#courses"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All courses
          </Link>

          <header className="mt-8">
            <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
              <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
              {course.teacher}
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.03em] text-ink">
              {course.name}
            </h1>
            <p className="mt-2 font-display text-[1.2rem] font-semibold text-brand-deep">{course.tagline}</p>
          </header>

          <div className="mt-8 grid gap-4 rounded-2xl border border-ink/10 bg-white p-6 sm:grid-cols-3">
            <Meta icon={<Clock className="h-4 w-4" />} label="Duration" value={course.duration} />
            <Meta icon={<CalendarDays className="h-4 w-4" />} label="Schedule" value={course.schedule} />
            <Meta
              icon={<GraduationCap className="h-4 w-4" />}
              label="Fee (incl. registration)"
              value={formatPKR(course.fee)}
              accent
            />
          </div>

          {/* Video Demo Embed */}
          {course.demoVideoUrl ? (
            <section className="mt-10">
              <h2 className="font-display text-[1.3rem] font-extrabold text-ink flex items-center gap-2">
                <Play className="h-5 w-5 text-brand-deep" />
                Course Preview
              </h2>
              <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-ink/5 shadow-[0_20px_60px_-20px_rgb(15_23_42/0.15)]">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={course.demoVideoUrl}
                    title={`${course.name} demo video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-10">
            <h2 className="font-display text-[1.3rem] font-extrabold text-ink">About this course</h2>
            <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">{course.description}</p>
          </section>

          {/* What you'll learn — outcomes */}
          {course.outcomes && course.outcomes.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-[1.3rem] font-extrabold text-ink">What you&apos;ll learn</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <div key={o} className="flex items-start gap-3 rounded-xl border border-brand/10 bg-white/70 px-4 py-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-deep">
                      <CheckCircle className="h-3 w-3" />
                    </span>
                    <span className="text-[0.88rem] font-medium text-ink">{o}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {features.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-[1.3rem] font-extrabold text-ink">What you get</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 rounded-xl border border-brand/10 bg-white/70 px-4 py-3 text-[0.9rem] font-medium text-ink">
                    <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-xs text-brand-deep">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Syllabus / Module Breakdown */}
          {course.modules && course.modules.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-[1.3rem] font-extrabold text-ink">Syllabus</h2>
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

          {course.batches.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-[1.3rem] font-extrabold text-ink">Batches</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.batches.map((b) => (
                  <div key={b.name} className="flex items-center justify-between rounded-xl border border-ink/10 bg-white/70 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand-deep">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-display text-[0.95rem] font-extrabold text-ink">{b.name}</p>
                        <p className="font-mono text-[0.68rem] text-ink-3">{b.time}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[0.68rem] text-ink-3">
                      {b.seatsTotal} seats
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Per-course FAQ */}
          {COURSE_FAQS[course.name]?.length ? (
            <section className="mt-12 max-w-3xl">
              <h2 className="font-display text-[1.3rem] font-extrabold text-ink">
                Frequently asked questions
              </h2>
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

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <ApplyButton
              courseKey={registrationKeyForCatalogName(course.name)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-8 font-display text-[0.9rem] font-bold text-white shadow-[0_16px_40px_-16px_rgb(110_90_224/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
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
              Need help choosing? Call <span className="text-ink-2">{CONTACT.phone}</span>
            </p>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  );
}

function Meta({
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
    <div className="flex items-center gap-3">
      <span
        className={
          accent
            ? "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-deep"
            : "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink/[0.04] text-ink-2"
        }
      >
        {icon}
      </span>
      <div>
        <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-ink-3">{label}</p>
        <p className={accent ? "font-display text-[1.05rem] font-extrabold text-brand-deep" : "font-display text-[1rem] font-bold text-ink"}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ModuleCard({ module: m, index }: { module: CourseModule; index: number }) {
  const colors = ["#6e5ae0", "#2bb3d8", "#d63a8c", "#2e9e6b"];
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
