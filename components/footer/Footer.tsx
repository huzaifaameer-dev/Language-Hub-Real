"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppCta } from "@/components/ui/WhatsAppCta";
import { scrollToId } from "@/lib/lenis";
import { ACADEMY, CONTACT, OPENING_HOURS } from "@/lib/content";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

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
      { id: "pricing", label: "Programmes & Fees" },
      { id: "contact", label: "Opening Hours" },
      { id: "cta", label: "Start Today" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "faq", label: "FAQ" },
      { id: "blog", label: "Blog", href: "/blog" },
      { id: "success-stories", label: "Success Stories", href: "/success-stories" },
      { id: "team", label: "Meet the Team", href: "/team" },
      { id: "contact", label: "Contact & Help" },
    ],
  },
];

function FooterLink({ id, label, href }: { id: string; label: string; href?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const onSite = pathname === "/";
  if (href) {
    return (
      <a
        href={href}
        className="group flex items-center gap-2 py-1.5 text-start text-[0.88rem] text-ink-3 transition-colors duration-300 hover:text-ink"
      >
        <span
          aria-hidden="true"
          className="h-px w-0 bg-brand transition-all duration-300 group-hover:w-4"
        />
        {label}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        if (!onSite) {
          try {
            sessionStorage.setItem("lh:scroll-to", id);
          } catch {}
          router.push("/");
          return;
        }
        scrollToId(id);
      }}
      className="group flex items-center gap-2 py-1.5 text-start text-[0.88rem] text-ink-3 transition-colors duration-300 hover:text-ink"
    >
      <span
        aria-hidden="true"
        className="h-px w-0 bg-brand transition-all duration-300 group-hover:w-4"
      />
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

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#0b0a12] text-ivory" aria-label="Footer">
      <div className="pointer-events-none absolute inset-0 grain" />
      <div className="aurora-blob left-[-12%] top-[-18%] h-[40vh] w-[40vh] bg-brand/12" />
      <div className="aurora-blob right-[-14%] bottom-[-20%] h-[44vh] w-[44vh] bg-brand-magenta/10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-10">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1fr] lg:gap-10">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
          </motion.div>

          {/* Link columns */}
          {LINK_SECTIONS.map((section, si) => (
            <motion.nav
              key={section.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.8, delay: 0.1 + si * 0.08, ease: [0.16, 1, 0.3, 1] }}
              aria-label={section.title}
              className="flex flex-col"
            >
              <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.32em] text-gold-light/80">
                {section.title}
              </p>
              <span aria-hidden="true" className="mt-3 h-px w-10 bg-gold/40" />
              <div className="mt-5 flex flex-col">
                {section.items.map((item) => (
                  <FooterLink key={item.id} id={item.id} label={item.label} />
                ))}
              </div>
            </motion.nav>
          ))}

          {/* Contact column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.8, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
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
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ivory/10 bg-ivory/[0.04] text-gold-light/80">
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
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ivory/[0.08] pt-8 sm:flex-row">
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
          <div className="flex items-center gap-3">
            {contactItems.filter((c) => c.label === "Call" || c.label === "Email").map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/10 bg-ivory/[0.04] text-ivory/60 transition-all duration-300 hover:border-gold/40 hover:bg-gold/10 hover:text-gold-light"
                aria-label={c.label}
              >
                <c.Icon className="h-4 w-4" strokeWidth={1.8} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
