import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { CONTACT, OPENING_HOURS } from "@/lib/content";
import { loadSettings } from "@/lib/server/admin";
import { appBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & Help | Language Hub",
  description:
    "Talk to the Language Hub team about batches, fees, demo classes or your current course — by WhatsApp, phone or email.",
  alternates: { canonical: `${appBaseUrl()}/contact` },
};

/** Values saved in Admin → Settings → Academy profile win, env is the fallback. */
function readAcademy(raw: unknown) {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (value: unknown, fallback: string) =>
    typeof value === "string" && value.trim() ? value.trim() : fallback;

  const whatsapp = str(source.whatsapp, CONTACT.whatsapp).replace(/[^\d]/g, "");
  return {
    name: str(source.name, "Language Hub"),
    tagline: str(source.tagline, "Hub of Language Excellence"),
    email: str(source.email, CONTACT.email),
    phone: str(source.phone, CONTACT.phone),
    whatsapp,
    whatsappHref: whatsapp ? `https://wa.me/${whatsapp}` : CONTACT.whatsappHref,
    city: str(source.city, CONTACT.city),
    address: str(source.address, CONTACT.address),
    mapUrl: CONTACT.mapUrl,
  };
}

export default async function ContactPage() {
  const settings = await loadSettings().catch(() => ({}) as Record<string, unknown>);
  const academy = readAcademy(settings["site.academy"]);

  const details = [
    academy.whatsapp && {
      label: "WhatsApp",
      value: `+${academy.whatsapp}`,
      href: academy.whatsappHref,
      icon: MessageCircle,
      note: "Fastest reply — usually within the hour",
    },
    academy.phone && {
      label: "Phone",
      value: academy.phone,
      href: `tel:${academy.phone.replace(/[^+\d]/g, "")}`,
      icon: Phone,
      note: "During opening hours",
    },
    academy.email && {
      label: "Email",
      value: academy.email,
      href: `mailto:${academy.email}`,
      icon: Mail,
      note: "We reply within one working day",
    },
    (academy.address || academy.city) && {
      label: "Studio",
      value: [academy.address, academy.city].filter(Boolean).join(", "),
      href: academy.mapUrl || undefined,
      icon: MapPin,
      note: "Sessions run live online",
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    href?: string;
    icon: typeof Mail;
    note: string;
  }>;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-site pb-20 pt-[6.4rem]">
        <section className="relative overflow-hidden border-b border-[#edf5f2] bg-[linear-gradient(180deg,#f2fbf7_0%,#f9fdfc_70%,#ffffff_100%)] px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-28 -top-20 h-[26rem] w-[26rem] rounded-full bg-[#14a08c]/10 blur-[120px]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 top-24 h-[22rem] w-[22rem] rounded-full bg-[#f5c542]/12 blur-[120px]"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#cfe6dd] bg-white/80 px-4 py-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#0d6a58]">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
              {academy.name} support
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink">
              Let&apos;s talk about
              <span className="block bg-[linear-gradient(92deg,#0d6a58,#14a08c_55%,#f26a4a)] bg-clip-text text-transparent">
                your next step.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-sans text-[0.95rem] leading-relaxed text-ink-3">
              Ask about batches, fees, or the right course for your goal. A real
              person from the team answers — no bots, no call centre.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <BookDemoButton />
              {academy.whatsappHref && (
                <a
                  href={academy.whatsappHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#cfe6dd] bg-white px-6 font-display text-[0.85rem] font-bold text-[#0d5c4d] transition hover:-translate-y-0.5 hover:border-[#14a08c]/60"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
                  Message on WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 pt-14 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {details.map((item) => {
              const inner = (
                <>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf7f3] text-[#0d6a58]">
                    <item.icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] text-ink-3">
                      {item.label}
                    </span>
                    <span className="mt-1 block truncate font-display text-[0.95rem] font-bold text-ink">
                      {item.value}
                    </span>
                    <span className="mt-1 block font-sans text-[0.72rem] text-ink-3">
                      {item.note}
                    </span>
                  </span>
                </>
              );

              const cls =
                "flex items-start gap-3.5 rounded-2xl border border-[#e3efe9] bg-white p-4 shadow-[0_18px_44px_-40px_rgba(10,78,67,0.5)] transition";
              return item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className={`${cls} hover:-translate-y-0.5 hover:border-[#9fd8cb]`}
                >
                  {inner}
                </a>
              ) : (
                <div key={item.label} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e3efe9] bg-white p-5">
              <p className="flex items-center gap-2 font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] text-ink-3">
                <Clock className="h-3.5 w-3.5" strokeWidth={2.4} /> Opening hours
              </p>
              <p className="mt-2 font-display text-[1.05rem] font-extrabold tracking-[-0.01em] text-ink">
                {OPENING_HOURS.label}
              </p>
              <p className="mt-1 font-sans text-[0.8rem] text-ink-3">
                {OPENING_HOURS.daysLabel} · {OPENING_HOURS.note}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e3efe9] bg-white p-5">
              <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] text-ink-3">
                Already a student?
              </p>
              <p className="mt-2 font-sans text-[0.84rem] leading-relaxed text-ink-3">
                Sign in to your dashboard for batches, materials and progress.
                For a quick request, the feedback form reaches the same team.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0d6a58] px-4 font-display text-[0.72rem] font-bold text-white transition hover:bg-[#0b5c4c]"
                >
                  Open dashboard
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                </Link>
                <Link
                  href="/feedback"
                  className="inline-flex h-9 items-center rounded-full border border-[#cfe6dd] px-4 font-display text-[0.72rem] font-bold text-[#0d5c4d] transition hover:border-[#14a08c]/60"
                >
                  Send feedback
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#e3efe9] bg-[#f7fcf9] p-5 text-center">
            <p className="font-sans text-[0.85rem] leading-relaxed text-ink-3">
              Looking for a quick answer instead? The{" "}
              <Link href="/faq" className="font-semibold text-[#0d6a58] underline decoration-[#f26a4a]/60 decoration-2 underline-offset-2">
                questions &amp; answers page
              </Link>{" "}
              covers batches, fees, materials and demo classes.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
