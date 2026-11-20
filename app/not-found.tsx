import Link from "next/link";
import { ArrowRight, Compass, Home, NotebookPen } from "lucide-react";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

export const metadata = {
  title: "Page not found | Language Hub",
  robots: { index: false, follow: true },
};

/**
 * Branded 404. A visitor arriving from an old link should land somewhere that
 * still looks like Language Hub and can find their way in one click.
 */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-screen items-center overflow-hidden bg-site px-5 pb-20 pt-[7.5rem] sm:px-8">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-[#14a08c]/10 blur-[120px]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-0 h-[22rem] w-[22rem] rounded-full bg-[#f5c542]/12 blur-[110px]"
        />

        <div className="relative mx-auto w-full max-w-2xl text-center">
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-[#0d6a58]">
            Error 404
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,7vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink">
            This page took a
            <span className="block bg-[linear-gradient(92deg,#0d6a58,#14a08c_55%,#f26a4a)] bg-clip-text text-transparent">
              different turn.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md font-sans text-[0.95rem] leading-relaxed text-ink-3">
            The link may be old, or the page may have moved. Everything worth
            reading is still one tap away.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0d6a58] px-6 font-display text-[0.8rem] font-bold text-white shadow-[0_14px_30px_-16px_rgba(13,106,88,0.9)] transition hover:-translate-y-0.5 hover:bg-[#0b5c4c]"
            >
              <Home className="h-4 w-4" strokeWidth={2.2} />
              Back home
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#cfe6dd] bg-white px-6 font-display text-[0.8rem] font-bold text-[#0d5c4d] transition hover:-translate-y-0.5 hover:border-[#14a08c]/60"
            >
              <Compass className="h-4 w-4" strokeWidth={2.2} />
              Browse courses
            </Link>
            <Link
              href="/blog"
              className="inline-flex h-12 items-center gap-2 rounded-full px-4 font-display text-[0.8rem] font-bold text-[#0d5c4d] underline decoration-[#f26a4a]/70 decoration-2 underline-offset-4 transition hover:text-[#f26a4a]"
            >
              <NotebookPen className="h-4 w-4" strokeWidth={2.2} />
              The Journal
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
