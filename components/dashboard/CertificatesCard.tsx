"use client";

import { motion } from "framer-motion";
import { Award, Download, Lock, Share2, Trophy } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface Certificate {
  id: string;
  certificateId: string;
  studentName: string;
  course: string;
  batch: string;
  issuedAt: string;
  completionPercent: number;
  signedBy: string;
}

export function CertificatesCard({
  certificates,
  enrollmentStatus,
  progressPercent,
  onIssueCert,
}: {
  certificates: Certificate[];
  enrollmentStatus?: string;
  progressPercent?: number;
  onIssueCert?: () => void;
}) {
  const isEnrolled = enrollmentStatus === "ENROLLED";
  const canIssue = isEnrolled && (progressPercent ?? 0) >= 80 && certificates.length === 0;

  return (
    <section className="glass-dash relative overflow-hidden rounded-[2rem] border-amber-200/60 p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-20 h-44 w-44 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600">
            <Award className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-amber-600">Certificates</p>
            <p className="font-display text-[1rem] font-extrabold">
              {certificates.length > 0 ? `${certificates.length} earned` : "Earn your certificate"}
            </p>
          </div>
        </div>
        {certificates.length > 0 && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-mono text-[0.62rem] font-bold text-amber-700">
            <Trophy className="mr-1 inline h-3 w-3" />
            {certificates.length}
          </span>
        )}
      </div>

      {/* Existing certificates */}
      {certificates.length > 0 ? (
        <div className="relative mt-5 flex flex-col gap-3">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease }}
              className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-orange-50/60 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] text-amber-600">Certificate of Completion</p>
                  <h4 className="mt-1 font-display text-[1rem] font-extrabold">{cert.course}</h4>
                  <p className="mt-0.5 font-mono text-[0.68rem] text-slate-500">
                    Batch: {cert.batch} · Issued {cert.issuedAt}
                  </p>
                  <p className="mt-1 text-[0.78rem] text-slate-500">
                    Signed by <span className="font-semibold">{cert.signedBy}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[0.62rem] text-slate-400">
                    ID: {cert.certificateId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/result/${cert.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 font-display text-[0.72rem] font-bold text-amber-700 transition-all hover:bg-amber-50"
                  >
                    <Share2 className="h-3 w-3" /> Share
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const w = window.open("", "_blank");
                      if (w) {
                        w.document.write(generateCertHTML(cert));
                        w.document.close();
                      }
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-600 px-3 font-display text-[0.72rem] font-bold text-white transition-all hover:bg-amber-700"
                  >
                    <Download className="h-3 w-3" /> View
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-[0.58rem] text-amber-600">{cert.completionPercent}% completed</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-200/60">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${cert.completionPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}

      {/* Not yet eligible */}
      {canIssue ? (
        <button
          type="button"
          onClick={onIssueCert}
          className="relative mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-display text-[0.85rem] font-bold text-white shadow-[0_10px_24px_-10px_rgb(245_158_11/0.6)] transition-all hover:-translate-y-0.5 hover:brightness-110"
        >
          <Award className="h-4 w-4" /> Claim my certificate
        </button>
      ) : !isEnrolled ? null : certificates.length === 0 ? (
        <div className="relative mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white/60 px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-slate-400" />
          <div>
            <p className="text-[0.82rem] font-medium text-slate-600">
              Complete {Math.max(0, 80 - (progressPercent ?? 0))}% more chapters to earn your certificate
            </p>
            <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${Math.min(100, (progressPercent ?? 0) / 80 * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function generateCertHTML(cert: Certificate): string {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
  .cert {
    width: 800px; height: 560px; background: #fff; border: 3px solid #d4af37;
    padding: 50px; text-align: center; position: relative; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .cert::before, .cert::after {
    content: ''; position: absolute; width: 120px; height: 120px;
    border: 2px solid #d4af37; opacity: 0.3;
  }
  .cert::before { top: 15px; left: 15px; border-right: none; border-bottom: none; }
  .cert::after { bottom: 15px; right: 15px; border-left: none; border-top: none; }
  .logo { font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 4px; color: #6366f1; text-transform: uppercase; font-weight: 600; }
  .title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; color: #1a1a1a; margin: 20px 0 10px; }
  .subtitle { font-family: 'Inter', sans-serif; font-size: 14px; color: #666; margin-bottom: 30px; }
  .name { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #4f46e5; border-bottom: 2px solid #d4af37; display: inline-block; padding-bottom: 5px; margin: 10px 0; }
  .course { font-family: 'Inter', sans-serif; font-size: 16px; color: #333; margin: 20px 0 5px; font-weight: 500; }
  .batch { font-family: 'Inter', sans-serif; font-size: 13px; color: #666; }
  .footer { position: absolute; bottom: 40px; left: 50px; right: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sign { text-align: center; }
  .sign-line { width: 160px; border-top: 1px solid #999; margin-top: 30px; padding-top: 5px; font-family: 'Inter', sans-serif; font-size: 11px; color: #666; }
  .date { font-family: 'Inter', sans-serif; font-size: 11px; color: #888; }
  .id { font-family: 'Inter', sans-serif; font-size: 9px; color: #aaa; margin-top: 5px; }
</style>
</head>
<body>
<div class="cert">
  <div class="logo">Language Hub</div>
  <div class="title">Certificate of Completion</div>
  <div class="subtitle">This is to certify that</div>
  <div class="name">${cert.studentName}</div>
  <div class="course">has successfully completed the course</div>
  <div class="course" style="font-weight:700;color:#4f46e5">${cert.course}</div>
  <div class="batch">Batch: ${cert.batch}</div>
  <div class="footer">
    <div class="sign">
      <div class="sign-line">${cert.signedBy}<br>Founder, Language Hub</div>
    </div>
    <div style="text-align:center">
      <div class="date">${cert.issuedAt}</div>
      <div class="id">Certificate ID: ${cert.certificateId}</div>
    </div>
  </div>
</div>
</body>
</html>`;
}
