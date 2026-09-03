import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import {
  MessageCircle,
  Users,
  Lightbulb,
  Rocket,
  Languages,
  CalendarClock,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Live Speaking",
    desc: "Real conversation practice from day one — not just grammar drills.",
    tone: "#6366f1",
    tint: "bg-brand/[0.08] text-brand-deep",
  },
  {
    icon: Users,
    title: "Small Batches",
    desc: "Personal attention in tight groups, so every student gets to speak.",
    tone: "#0ea5e9",
    tint: "bg-sky-50 text-sky-600",
  },
  {
    icon: Lightbulb,
    title: "Creative Expression",
    desc: "Find the words and tone that are unmistakably you.",
    tone: "#d63a8c",
    tint: "bg-pink-50 text-pink-600",
  },
  {
    icon: Languages,
    title: "Test-Prep Ready",
    desc: "IELTS, PTE & Duolingo — structured prep with mock-test rhythm.",
    tone: "#f59e0b",
    tint: "bg-amber-50 text-amber-600",
  },
  {
    icon: Rocket,
    title: "Fast Progress",
    desc: "A clear learn → practice → express path that compounds every week.",
    tone: "#10b981",
    tint: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: CalendarClock,
    title: "Flexible Hours",
    desc: "Morning, evening and weekend batches — built around real life.",
    tone: "#8b5cf6",
    tint: "bg-violet-50 text-violet-600",
  },
];

export function Features() {
  return (
    <section
      id="why"
      data-section
      className="relative overflow-hidden bg-[#f7f8fc] px-6 py-24 sm:px-12"
      aria-label="Why Language Hub"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="The Hub Difference"
          title={
            <>
              Why learners <span className="brand-text">choose us.</span>
            </>
          }
          subtitle="A method built around real communication, real people and real results — not textbooks alone."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) * 0.08}
              duration={0.55}
              hover={false}
              className="group relative overflow-hidden rounded-3xl border border-ink/[0.07] bg-[#fafbfe] p-7 transition-all duration-300 hover:border-ink/12 hover:shadow-[0_28px_60px_-30px_rgb(15_23_42/0.3)]"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100"
                style={{
                  background: `linear-gradient(90deg, ${f.tone}, ${f.tone}88)`,
                }}
              />
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${f.tint}`}>
                <f.icon className="h-7 w-7" strokeWidth={1.6} />
              </span>
              <h3 className="mt-5 font-display text-xl font-extrabold tracking-tight text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-2">{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
