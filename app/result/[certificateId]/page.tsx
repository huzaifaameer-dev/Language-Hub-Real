import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCertificatesCollection } from "@/lib/db";
import { appBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ certificateId: string }>;
}

async function findCertificate(certificateId: string) {
  const col = await getCertificatesCollection();
  return col.findOne({ certificateId });
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { certificateId } = await params;
  const cert = await findCertificate(certificateId);
  if (!cert) return { title: "Certificate not found · Language Hub" };
  return {
    title: `${cert.studentName} · ${cert.course} · Language Hub`,
    description: `Language Hub certificate — ${cert.course} (${cert.completionPercent}% completion). Verified with certificate ID ${cert.certificateId}.`,
    openGraph: {
      title: `${cert.studentName} — ${cert.course}`,
      description: `Official Language Hub certificate. Course completion ${cert.completionPercent}%.`,
      url: `${appBaseUrl()}/result/${cert.certificateId}`,
      type: "website",
      images: [`${appBaseUrl()}/icon.png`],
    },
  };
}

export default async function CertificateSharePage({ params }: SharePageProps) {
  const { certificateId } = await params;
  const cert = await findCertificate(certificateId);
  if (!cert) notFound();

  const issued = new Date(cert.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f4f1ff] via-[#eef1ff] to-[#fdf6ff] px-4 py-12">
      <div className="relative w-full max-w-2xl">
        {/* Glow behind the certificate */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/25 via-brand-magenta/20 to-brand-cyan/25 blur-2xl"
        />
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_50px_120px_-40px_rgb(79_70_229/0.5)]">
          {/* Top ribbon */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#312e81] via-brand-deep to-brand px-8 py-7 text-center text-white">
            <div aria-hidden="true" className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-brand-cyan/40 blur-2xl" />
            <div aria-hidden="true" className="absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-brand-magenta/50 blur-2xl" />
            <p className="relative font-mono text-[0.62rem] font-bold uppercase tracking-[0.4em] text-white/70">
              Language Hub · Hub of Language Excellence
            </p>
            <h1 className="relative mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Certificate of Completion
            </h1>
            <p className="relative mt-2 font-serif text-sm italic text-white/80">Founded by Javaria Malik</p>
          </div>

          {/* Body */}
          <div className="px-8 py-9 text-center">
            <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink-3">
              This certifies that
            </p>
            <p className="mt-2 break-words font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {cert.studentName}
            </p>
            <p className="mx-auto mt-5 max-w-md font-serif text-[1.05rem] italic leading-relaxed text-ink-2">
              has successfully completed the{" "}
              <span className="not-italic font-semibold text-brand-deep">{cert.course}</span>{" "}
              programme ({cert.batch} batch) with {cert.completionPercent}% course completion,
              demonstrating consistent practice and real progress in their English journey.
            </p>

            <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
              <div className="rounded-2xl border border-ink/[0.08] bg-[#f7f8fc] px-3 py-4">
                <p className="font-display text-lg font-extrabold text-ink">{cert.completionPercent}%</p>
                <p className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink-3">Completion</p>
              </div>
              <div className="rounded-2xl border border-ink/[0.08] bg-[#f7f8fc] px-3 py-4">
                <p className="font-display text-sm font-extrabold leading-tight text-ink">{cert.batch}</p>
                <p className="mt-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink-3">Batch</p>
              </div>
              <div className="rounded-2xl border border-ink/[0.08] bg-[#f7f8fc] px-3 py-4">
                <p className="font-display text-sm font-extrabold leading-tight text-ink">{issued}</p>
                <p className="mt-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink-3">Issued</p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="w-32" aria-hidden="true">
                <svg viewBox="0 0 160 80">
                  <path
                    d="M8,62 C46,22 96,22 152,62"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path d="M28 66 l-18 -12 34 4 z" fill="#f59e0b" />
                </svg>
              </div>
            </div>

            <p className="mt-4 font-display text-lg font-extrabold tracking-tight text-brand-deep">
              Javaria Malik
            </p>
            <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-ink-3">Founder & Lead Trainer</p>

            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Verified · {cert.certificateId}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}