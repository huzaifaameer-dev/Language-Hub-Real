"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Navigation, Sparkles } from "lucide-react";
import { ACADEMY, CONTACT } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { useLang } from "@/components/LanguageProvider";

const ease = [0.16, 1, 0.3, 1] as const;

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

/** Final call-to-action + contact strip — premium, animated, responsive. */
export function CtaBanner() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

  return (
    <section
      id="cta"
      data-section
      className="relative overflow-hidden bg-site px-6 py-20 sm:px-12"
      aria-label="Start your journey"
    >
      <Reveal
        duration={0.8}
        margin="-60px"
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#0d0c16] px-8 py-16 text-center shadow-[0_80px_160px_-80px_rgb(79_70_229/0.7)] sm:px-16"
      >
        {/* decorative animated layers */}
        <div
          aria-hidden
          className="gradient-pan absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "conic-gradient(from 90deg, #6366f1, #d63a8c, #f59e0b, #0ea5e9, #6366f1)",
          }}
        />
        <div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/40 blur-[100px]" />
        <div aria-hidden className="absolute -bottom-36 -left-28 h-96 w-96 rounded-full bg-gold/20 blur-[100px]" />
        <div aria-hidden className="shine-sweep" />

        {/* floating mini badges */}
        <motion.div
          aria-hidden
          animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-8 top-10 hidden rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-start backdrop-blur-md lg:block"
        >
          <p className="flex items-center gap-1 font-display text-[0.85rem] font-extrabold text-white">
            <span className="text-gold">★</span> Rated 5.0
          </p>
          <p className="font-mono text-[0.56rem] uppercase tracking-widest text-ivory/50">by students</p>
        </motion.div>
        <motion.div
          aria-hidden
          animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-12 left-10 hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 backdrop-blur-md lg:flex"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/20 text-brand-cyan">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="font-display text-[0.72rem] font-bold text-ivory/90">Live small-batch classes</p>
        </motion.div>

        <div className="relative max-w-2xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.08] px-4 py-1.5 font-display text-[0.6rem] font-black uppercase tracking-[0.3em] text-gold-light"
          >
            <Sparkles className="h-3.5 w-3.5" /> {dict["cta.eyebrow"]}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="mt-5 font-display text-[clamp(1.9rem,4.6vw,3.1rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-white"
            dir={isUr ? "rtl" : "ltr"}
          >
            {isUr ? (
              <>
                {dict["cta.title1"]}
                <br /> <span className="gold-text">{dict["cta.title2"]}</span>
              </>
            ) : (
              <>
                Your voice is ready.
                <br /> Let&apos;s <span className="gold-text">find it.</span>
              </>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.22, ease }}
            className="mx-auto mt-5 max-w-xl text-[1rem] leading-relaxed text-ivory/70"
            dir={isUr ? "rtl" : "ltr"}
          >
            {dict["cta.subtitle"]}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.34, ease }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <BookDemoButton />
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full border border-ivory/25 px-7 font-display text-[0.9rem] font-bold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-light/60 hover:text-gold-light"
            >
              {dict["cta.track"]}
            </Link>
          </motion.div>
        </div>

        {CONTACT_ACTIONS.length > 0 ? (
          <div className="relative mt-12 grid gap-3 border-t border-ivory/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT_ACTIONS.map((a, i) => (
              <motion.a
                key={a.id}
                href={a.href}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease }}
                {...(a.id === "whatsapp" || a.id === "directions"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center gap-3 rounded-2xl border border-ivory/10 bg-ivory/[0.04] px-4 py-4 text-start backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-ivory/[0.08]"
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ivory/10 text-gold-light transition-all duration-300 group-hover:rotate-6 group-hover:bg-gold group-hover:text-ink"
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
              </motion.a>
            ))}
          </div>
        ) : null}

        {CONTACT.email ? (
          <p className="relative mt-10 font-mono text-[0.62rem] uppercase tracking-widest text-ivory/40">
            {ACADEMY.name} · {dict["cta.replies"]}
          </p>
        ) : null}
      </Reveal>
    </section>
  );
}