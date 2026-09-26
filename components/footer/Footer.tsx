"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, MapPin, Phone, Mail, Clock, MessageCircle, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
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
      { id: "cta", label: "Start Today" },
    ],
  },
  {
    title: "Institute",
    items: [
      { id: "about", label: "Beyond English" },
      { id: "courses", label: "Programmes & Fees" },
      { id: "contact", label: "Opening Hours" },
      { id: "cta", label: "Start Today" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "faq", label: "FAQ" },
      { id: "news", label: "Daily News", href: "/news" },
      { id: "success-stories", label: "Success Stories", href: "/success-stories" },
      { id: "team", label: "Meet the Team", href: "/team" },
      { id: "feedback", label: "Send Feedback", href: "/feedback" },
      { id: "contact", label: "Contact & Help" },
    ],
  },
];

function FooterLink({ id, label, href }: { id: string; label: string; href?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const onSite = pathname === "/";
  const cls =
    "group flex items-center gap-2 py-1.5 text-start text-[0.88rem] text-ivory/55 transition-colors duration-300 hover:text-gold-light";
  const bar = (
    <span
      aria-hidden="true"
      className="h-px w-0 bg-gold transition-all duration-300 group-hover:w-4"
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
        const { scrollToId } = await import("@/lib/lenis");
        scrollToId(id);
      }}
      className={cls}
    >
      {bar}
      {label}
    </button>
  );
}

const contactItems = [
  CONTACT.address && { Icon: MapPin, label: "Address", value: CONTACT.address, href: CONTACT.mapUrl },
  CONTACT.phone && { Icon: Phone, label: "Call", value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/[^+\d]/g, "")}` },
  CONTACT.email && { Icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { Icon: Clock, label: "Hours", value: `${OPENING_HOURS.daysLabel} · ${OPENING_HOURS.label}`, href: undefined },
].filter(Boolean) as {
  Icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
}[];

const socialLinks = [
  CONTACT.phone && { Icon: Phone, href: `tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`, label: "Call" },
  CONTACT.whatsappHref && { Icon: MessageCircle, href: CONTACT.whatsappHref, label: "WhatsApp" },
  CONTACT.email && { Icon: Mail, href: `mailto:${CONTACT.email}`, label: "Email" },
].filter(Boolean) as { Icon: typeof Phone; href: string; label: string }[];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#0b0a12] text-ivory" aria-label="Footer">
      <div className="aurora-blob left-[-12%] top-[-18%] h-[40vh] w-[40vh] bg-brand/12" />
      <div className="aurora-blob right-[-14%] bottom-[-20%] h-[44vh] w-[44vh] bg-brand-magenta/10" />

      {/* animated shimmering top border */}
      <div aria-hidden className="shine-sweep top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-10">
        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-6% 0px" }}
          transition={{ duration: 0.7, ease }}
          className="relative mb-16 overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-r from-brand/[0.16] via-white/[0.04] to-brand-magenta/[0.14] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8"
        >
          <div aria-hidden className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-gold-light">
              <Sparkles className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <div>
              <p className="font-display text-[1.25rem] font-extrabold leading-tight text-white">
                Ready to speak with confidence?
              </p>
              <p className="mt-1 text-[0.9rem] text-ivory/60">
                Book a free demo class and experience a live small-batch session.
              </p>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center gap-3 sm:mt-0 sm:shrink-0">
            <BookDemoButton />
            {CONTACT.whatsapp && (
              <a
                href={CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-ivory/20 px-5 font-display text-[0.8rem] font-bold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/60 hover:text-emerald-300"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1fr] lg:gap-10">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.7, ease }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)]">
                <Logo size="xs" eager />
              </span>
              <span className="font-display text-xl font-extrabold tracking-[0.14em]">
                LANGUAGE<span className="gold-text"> HUB</span>
              </span>
            </div>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-ivory/60">
              {ACADEMY.name} is an innovative online institute helping learners
              master English communication and creative expression.
            </p>
            <div className="mt-7 flex items-center gap-4">
              <WhatsAppCta variant="footer" />
            </div>
            <p className="mt-6 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ivory/35">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {OPENING_HOURS.label} · {OPENING_HOURS.daysLabel}
            </p>
          </motion.div>

          {/* Link columns */}
          {LINK_SECTIONS.map((section, si) => (
            <motion.nav
              key={section.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.7, delay: 0.08 + si * 0.07, ease }}
              aria-label={section.title}
              className="flex flex-col"
            >
              <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.32em] text-gold-light/80">
                {section.title}
              </p>
              <span aria-hidden="true" className="mt-3 h-px w-10 bg-gold/40" />
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
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.7, delay: 0.22, ease }}
            aria-label="Contact"
            className="flex flex-col"
          >
            <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.32em] text-gold-light/80">
              Get in touch
            </p>
            <span aria-hidden="true" className="mt-3 h-px w-10 bg-gold/40" />
            <div className="mt-5 flex flex-col gap-4">
              {contactItems.map((item) => {
                const inner = (
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ivory/10 bg-ivory/[0.04] text-gold-light/80 transition-all duration-300 group-hover:border-gold/40 group-hover:text-gold-light">
                      <item.Icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ivory/40">
                        {item.label}
                      </span>
                      <span className="mt-0.5 text-[0.86rem] leading-snug text-ivory/75">
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
                    className="group flex items-center gap-3 text-start transition-colors duration-300 hover:text-ivory"
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
        <div className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-ivory/[0.08] pt-8 sm:flex-row">
          <p className="text-center font-display text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-ivory/40">
            © {year} {ACADEMY.name} · {ACADEMY.tagline}
          </p>

          <nav aria-label="Legal" className="flex items-center gap-5">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/refund-policy", label: "Refunds" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ivory/40 transition-colors duration-300 hover:text-gold-light"
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
                className="grid h-9 w-9 place-items-center rounded-full border border-ivory/10 bg-ivory/[0.04] text-ivory/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold/10 hover:text-gold-light"
              >
                <s.Icon className="h-4 w-4" strokeWidth={1.8} />
              </a>
            ))}
            <button
              type="button"
              onClick={async () => {
                const { scrollToId } = await import("@/lib/lenis");
                scrollToId("home");
              }}
              aria-label="Back to top"
              className="grid h-9 w-9 place-items-center rounded-full border border-ivory/10 bg-ivory/[0.04] text-ivory/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:bg-brand/20 hover:text-white"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}