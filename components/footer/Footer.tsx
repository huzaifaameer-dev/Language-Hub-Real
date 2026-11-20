"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, MapPin, Phone, Mail, Clock, MessageCircle, Sparkles } from "lucide-react";
import { Logo, Wordmark } from "@/components/ui/Logo";
import { WhatsAppCta } from "@/components/ui/WhatsAppCta";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { ACADEMY, CONTACT, OPENING_HOURS } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

const LINK_SECTIONS = [
  {
    title: "Explore",
    items: [
      { id: "journey", label: "The Journey" },
      { id: "courses", label: "Courses" },
      { id: "why", label: "Why Language Hub" },
      { id: "enroll", label: "How It Works" },
      { id: "cta", label: "Start Today" },
    ],
  },
  {
    title: "Institute",
    items: [
      { id: "founder", label: "Meet the Founder" },
      { id: "courses", label: "Programmes & Fees" },
      { id: "contact", label: "Opening Hours" },
      { href: "/placement-test", id: "placement", label: "Placement Test" },
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/blog", id: "journal", label: "The Journal" },
      { href: "/faq", id: "faq", label: "Questions & Answers" },
      { href: "/contact", id: "contact-page", label: "Contact & Help" },
      { id: "success-stories", label: "Success Stories" },
      { id: "team", label: "Meet the Team" },
      { id: "feedback", label: "Send Feedback" },
    ],
  },
];

function FooterLink({ id, label, href }: { id: string; label: string; href?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const onSite = pathname === "/";
  const cls =
    "group flex items-center gap-2 py-1.5 text-start font-sans text-white/55 transition-colors duration-300 hover:text-[#7ef0c9]";
  const bar = (
    <span
      aria-hidden="true"
      className="h-px w-0 bg-[#7ef0c9] transition-all duration-300 group-hover:w-4"
    />
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {bar}
        {label}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={async () => {
        if (!onSite) {
          try {
            sessionStorage.setItem("lh:scroll-to", id);
          } catch {}
          router.push("/");
          return;
        }
        const { scrollToId } = await import("@/lib/scroll");
        scrollToId(id);
      }}
      className={cls}
    >
      {bar}
      {label}
    </button>
  );
}

type ContactItem = {
  Icon: typeof MapPin | typeof Phone | typeof Mail | typeof Clock;
  label: string;
  value: string;
  href?: string | null;
};

type SocialLink = {
  Icon: typeof Phone | typeof MessageCircle | typeof Mail;
  href: string;
  label: string;
};

const contactItems: ContactItem[] = [
  CONTACT.address && {
    Icon: MapPin,
    label: "Address",
    value: CONTACT.address,
    href: CONTACT.mapUrl,
  },
  CONTACT.phone && {
    Icon: Phone,
    label: "Call",
    value: CONTACT.phone,
    href: `tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`,
  },
  CONTACT.email && {
    Icon: Mail,
    label: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
  },
  { Icon: Clock, label: "Hours", value: `${OPENING_HOURS.daysLabel} · ${OPENING_HOURS.label}`, href: null },
].filter(Boolean) as ContactItem[];

const socialLinks: SocialLink[] = [
  CONTACT.phone && {
    Icon: Phone,
    href: `tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`,
    label: "Call",
  },
  CONTACT.whatsappHref && {
    Icon: MessageCircle,
    href: CONTACT.whatsappHref,
    label: "WhatsApp",
  },
  CONTACT.email && {
    Icon: Mail,
    href: `mailto:${CONTACT.email}`,
    label: "Email",
  },
].filter(Boolean) as SocialLink[];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-deep-teal relative overflow-hidden text-white" aria-label="Footer">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-[#14a08c]/30 blur-[120px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#fb6a47]/20 blur-[130px]"
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-14 sm:px-6 sm:pt-16">
        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-6% 0px"}}
          transition={{ duration: 0.7, ease }}
          className="relative mb-12 overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.05] p-5 sm:mb-16 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8"
        >
          <span aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#14a08c]/30 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,#7ef0c9,#f5b93c,#fb6a47)]" />
          <div className="relative flex items-start gap-3.5 sm:gap-4">
            <span className="clay h-11 w-11 shrink-0 rounded-2xl sm:h-12 sm:w-12">
              <Sparkles className="relative z-10 h-5 w-5 text-[#0f6b5c] sm:h-6 sm:w-6" strokeWidth={1.8} />
            </span>
            <div className="relative min-w-0">
              <p className="font-display text-[1.1rem] font-extrabold leading-tight text-white sm:text-[1.25rem]">
                Ready to speak with confidence?
              </p>
              <p className="mt-1 font-sans text-[0.84rem] leading-relaxed text-white/60 sm:text-[0.9rem]">
                Book a free demo class and experience a live small-batch session.
              </p>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center gap-2.5 sm:mt-0 sm:shrink-0 sm:gap-3">
            <BookDemoButton variant="light" />
            {CONTACT.whatsapp && (
              <a
                href={CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-5 font-display text-[0.78rem] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7ef0c9]/60 hover:text-[#7ef0c9] sm:h-12 sm:text-[0.8rem]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[1.4fr_0.68fr_0.68fr_0.66fr_1.1fr] lg:gap-8">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px"}}
            transition={{ duration: 0.7, ease }}
            className="col-span-2 flex flex-col sm:col-span-2 lg:col-span-1"
            style={{}}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)]">
                <Logo mode="chip" size="xs" eager className="h-11 w-11" />
              </span>
              <Wordmark tone="light" />
            </div>
            <p className="mt-6 max-w-sm font-sans text-[0.95rem] leading-[1.75] text-white/60">
              {ACADEMY.name} is an innovative institute helping learners master
              English communication and creative expression.
            </p>
            <div className="mt-7 flex items-center gap-4">
              <WhatsAppCta variant="footer" />
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[0.6rem] font-bold uppercase leading-relaxed tracking-[0.14em] text-white/35 sm:tracking-[0.2em]">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#7ef0c9]" />
              {OPENING_HOURS.label} · {OPENING_HOURS.daysLabel}
            </p>
          </motion.div>

          {/* Link columns */}
          {LINK_SECTIONS.map((section, si) => (
            <motion.nav
              key={section.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px"}}
              transition={{ duration: 0.7, delay: 0.08 + si * 0.07, ease }}
              aria-label={section.title}
              className="flex flex-col"
              style={{}}
            >
              <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-[#7ef0c9]">
                {section.title}
              </p>
              <span aria-hidden="true" className="mt-3 h-px w-10 bg-[#7ef0c9]/40" />
              <div className="mt-5 flex flex-col">
                {section.items.map((item) => (
                  <FooterLink key={item.id} id={item.id} label={item.label} href={item.href} />
                ))}
              </div>
            </motion.nav>
          ))}

          {/* Contact column */}
          <motion.nav
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px"}}
            transition={{ duration: 0.7, delay: 0.22, ease }}
            aria-label="Contact"
            className="col-span-2 flex flex-col sm:col-span-2 lg:col-span-1"
            style={{}}
          >
            <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-[#7ef0c9]">
              Get in touch
            </p>
            <span aria-hidden="true" className="mt-3 h-px w-10 bg-[#7ef0c9]/40" />
            <div className="mt-5 flex flex-col gap-4">
              {contactItems.map((item) => {
                const inner = (
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#7ef0c9] transition-all duration-300 group-hover:border-[#7ef0c9]/50">
                      <item.Icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-display text-[0.58rem] font-bold uppercase tracking-[0.2em] text-white/40">
                        {item.label}
                      </span>
                      <span className="mt-0.5 break-words font-sans text-[0.86rem] leading-snug text-white/75">
                        {item.value}
                      </span>
                    </span>
                  </>
                );
                return item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    {...(item.label === "Address"
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group flex items-center gap-3 text-start transition-colors duration-300 hover:text-white"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={item.label} className="flex items-center gap-3 text-start">
                    {inner}
                  </div>
                );
              })}
            </div>
          </motion.nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-white/[0.08] pt-8 sm:mt-16 sm:flex-row">
          <p className="text-center font-display text-[0.58rem] font-semibold uppercase leading-relaxed tracking-[0.18em] text-white/40 sm:text-[0.62rem] sm:tracking-[0.24em]">
            © {year} {ACADEMY.name} · {ACADEMY.tagline}
          </p>

          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/refund-policy", label: "Refunds" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/40 transition-colors duration-300 hover:text-[#7ef0c9]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7ef0c9]/50 hover:bg-[#7ef0c9]/10 hover:text-[#7ef0c9]"
              >
                <s.Icon className="h-4 w-4" strokeWidth={1.8} />
              </a>
            ))}
            <button
              type="button"
              onClick={async () => {
                const { scrollToId } = await import("@/lib/scroll");
                scrollToId("home");
              }}
              aria-label="Back to top"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7ef0c9]/50 hover:bg-[#7ef0c9]/20 hover:text-white"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}