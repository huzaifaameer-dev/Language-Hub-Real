import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { BookOpen, Mic, PenTool, Rocket } from "lucide-react";

const STAGES = [
  {
    icon: BookOpen,
    word: "Learn",
    index: "01",
    accent: "#6366f1",
    body: "Absorb the sounds, rhythm and structure. Every lesson builds a stronger foundation.",
  },
  {
    icon: Mic,
    word: "Practice",
    index: "02",
    accent: "#0ea5e9",
    body: "Speak it out loud, make mistakes, try again. Fluency lives in friendly repetition.",
  },
  {
    icon: PenTool,
    word: "Express",
    index: "03",
    accent: "#d63a8c",
    body: "Put your ideas into words — with clarity, personality and your own voice.",
  },
  {
    icon: Rocket,
    word: "Grow",
    index: "04",
    accent: "#10b981",
    body: "Confidence compounds. Communication becomes natural. New doors begin to open.",
  },
];

export function Journey() {
  return (
    <section
      id="journey"
      data-section
      className="relative overflow-hidden bg-[#f7f8fc] px-6 py-24 sm:px-12"
      aria-label="The learning journey"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Your Journey"
          title={
            <>
              From quiet to <span className="brand-text">confident.</span>
            </>
          }
          subtitle="A clear four-step path that turns silent learners into confident communicators."
        />

        <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* connecting line on desktop */}
          <span
            aria-hidden
            className="absolute left-[12%] right-[12%] top-14 hidden h-0.5 bg-gradient-to-r from-brand/30 via-brand-magenta/30 to-brand-fern/30 lg:block"
          />
          {STAGES.map((s, i) => (
            <Reveal
              key={s.word}
              delay={i * 0.1}
              duration={0.55}
              hover
              className="group relative rounded-3xl border border-ink/[0.07] bg-white p-7 shadow-[0_18px_44px_-34px_rgb(15_23_42/0.4)] transition-all duration-300 hover:shadow-[0_32px_60px_-30px_rgb(15_23_42/0.35)]"
            >
              <div className="flex items-start justify-between">
                <span
                  className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                  style={{ backgroundColor: s.accent }}
                >
                  <s.icon className="h-6 w-6" strokeWidth={1.7} />
                </span>
                <span
                  className="font-display text-[0.72rem] font-extrabold tracking-[0.2em]"
                  style={{ color: s.accent }}
                >
                  {s.index}
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink">
                {s.word}.
              </h3>
              <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-2">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
