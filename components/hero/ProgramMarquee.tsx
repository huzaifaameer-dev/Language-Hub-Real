import { GraduationCap, MessageCircle, Mic, PenTool } from "lucide-react";

const ITEMS = [
  { icon: MessageCircle, label: "Spoken English" },
  { icon: GraduationCap, label: "IELTS Preparation" },
  { icon: Mic, label: "PTE Academic" },
  { icon: PenTool, label: "Duolingo English Test" },
];

/** Animated marquee strip of the programmes offered (pure CSS — server render). */
export function ProgramMarquee() {
  const row = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-ink/[0.06] bg-white py-5">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent"
        aria-hidden
      />
      <div className="flex w-max animate-marquee items-center gap-10">
        {row.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 whitespace-nowrap opacity-70">
            <item.icon className="h-5 w-5 text-brand-deep" strokeWidth={1.8} />
            <span className="font-display text-[0.86rem] font-bold tracking-wide text-ink-2">
              {item.label}
            </span>
            <span aria-hidden className="ml-4 h-1.5 w-1.5 rounded-full bg-gold/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
