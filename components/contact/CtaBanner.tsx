import Link from "next/link";
import { MessageCircle, Phone, Mail, Navigation } from "lucide-react";
import { ACADEMY, CONTACT } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { BookDemoButton } from "@/components/contact/BookDemoButton";

const CONTACT_ACTIONS = [
  CONTACT.whatsapp && {
    id: "whatsapp",
    label: "WhatsApp",
    value: "Chat with us directly",
    href: CONTACT.whatsappHref,
    Icon: MessageCircle,
  },
  CONTACT.phone && {
    id: "call",
    label: "Call",
    value: CONTACT.phone,
    href: `tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`,
    Icon: Phone,
  },
  CONTACT.email && {
    id: "email",
    label: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    Icon: Mail,
  },
  CONTACT.mapUrl && {
    id: "directions",
    label: "Directions",
    value: CONTACT.city,
    href: CONTACT.mapUrl,
    Icon: Navigation,
  },
].filter(Boolean) as {
  id: string;
  label: string;
  value: string;
  href: string;
  Icon: typeof MessageCircle;
}[];

/** Final call-to-action + contact strip (merged from the old ContactCta + CtaBanner). */
export function CtaBanner() {
  return (
    <section
      id="cta"
      data-section
      className="px-6 py-20 sm:px-12"
      aria-label="Start your journey"
    >
      <Reveal
        duration={0.7}
        margin="-60px"
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-8 py-16 text-center sm:px-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
        />

        <div className="relative">
          <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.34em] text-gold-light">
            Start today
          </p>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,4.4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ivory">
            Your voice is ready.
            <br /> Let&apos;s <span className="gold-text">find it.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1rem] leading-relaxed text-ivory/70">
            Book a free demo class and experience how Language Hub turns
            nervous words into confident conversations.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <BookDemoButton />
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full border border-ivory/25 px-7 font-display text-[0.9rem] font-bold text-ivory transition-all duration-300 hover:border-gold-light/60 hover:text-gold-light"
            >
              Track your application
            </Link>
          </div>
        </div>

        {CONTACT_ACTIONS.length > 0 ? (
          <div className="relative mt-12 grid gap-3 border-t border-ivory/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT_ACTIONS.map((a) => (
              <a
                key={a.id}
                href={a.href}
                {...(a.id === "whatsapp" || a.id === "directions"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center gap-3 rounded-2xl border border-ivory/10 bg-ivory/[0.04] px-4 py-4 text-start transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-ivory/[0.08]"
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ivory/10 text-gold-light transition-colors duration-300 group-hover:bg-gold group-hover:text-ink"
                >
                  <a.Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-ivory/40">
                    {a.label}
                  </span>
                  <span className="block truncate text-[0.92rem] font-semibold text-ivory/85">
                    {a.value}
                  </span>
                </span>
              </a>
            ))}
          </div>
        ) : null}

        {CONTACT.email ? (
          <p className="relative mt-10 font-mono text-[0.62rem] uppercase tracking-widest text-ivory/40">
            {ACADEMY.name} · replies fast
          </p>
        ) : null}
      </Reveal>
    </section>
  );
}