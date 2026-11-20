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
    <section className="surface-card relative overflow-hidden p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[#f5b93c]/18 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-20 h-44 w-44 rounded-full bg-[#fb6a47]/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff7e3] text-[#b07d0a]">
            <Award className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-display text-[0.56rem] font-bold uppercase tracking-[0.24em] text-[#8a5a00]">Certificates</p>
            <p className="mt-1 font-display text-[1.02rem] font-extrabold tracking-[-0.01em] text-ink">
              {certificates.length > 0 ? `${certificates.length} earned` : "Earn your certificate"}
            </p>
          </div>
        </div>
        {certificates.length > 0 && (
          <span className="rounded-full border border-[#f2e0b0] bg-[#fff8e6] px-3 py-1 font-display text-[0.6rem] font-bold text-[#8a5a00]">
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
              className="rounded-xl border border-[#f2e3bd] bg-[#fffaf0] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[0.54rem] font-bold uppercase tracking-[0.2em] text-[#8a5a00]">Certificate of completion</p>
                  <h4 className="mt-1.5 font-display text-[1rem] font-extrabold tracking-[-0.01em] text-ink">{cert.course}</h4>
                  <p className="mt-1 font-sans text-[0.68rem] text-ink-3">
                    Batch: {cert.batch} · Issued {cert.issuedAt}
                  </p>
                  <p className="mt-1 font-sans text-[0.78rem] text-ink-2">
                    Signed by <span className="font-semibold text-ink">{cert.signedBy}</span>
                  </p>
                  <p className="mt-0.5 font-sans text-[0.62rem] text-ink-3">
                    ID: {cert.certificateId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/result/${cert.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e8d5a4] bg-white px-3 font-display text-[0.7rem] font-bold text-[#8a5a00] transition-colors hover:border-[#d9bd75] hover:bg-[#fff8e6]"
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
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0f6b5c] px-3 font-display text-[0.7rem] font-bold text-white transition-colors hover:bg-[#0a4e43]"
                  >
                    <Download className="h-3 w-3" /> View
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-display text-[0.54rem] font-bold uppercase tracking-[0.1em] text-[#8a5a00]">{cert.completionPercent}% completed</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f2e3bd]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#f5b93c,#d99a1a)]"
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
          className="relative mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f5b93c,#d99a1a)] px-6 font-display text-[0.82rem] font-bold text-[#5c3a00] shadow-[0_14px_30px_-16px_rgba(217,154,26,0.8)] transition-transform duration-300 hover:-translate-y-0.5"
        >
          <Award className="h-4 w-4" /> Claim my certificate
        </button>
      ) : !isEnrolled ? null : certificates.length === 0 ? (
        <div className="relative mt-5 flex items-center gap-3 rounded-xl border border-[#eef5f2] bg-[#fbfefd] px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-ink-3" />
          <div>
            <p className="font-sans text-[0.82rem] font-medium text-ink-2">
              Complete {Math.max(0, 80 - (progressPercent ?? 0))}% more chapters to earn your certificate
            </p>
            <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-[#eef7f4]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f5b93c,#d99a1a)] transition-all"
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
  body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f6fbf9; }
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
  .logo { font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 4px; color: #0f6b5c; text-transform: uppercase; font-weight: 600; }
  .title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; color: #1a1a1a; margin: 20px 0 10px; }
  .subtitle { font-family: 'Inter', sans-serif; font-size: 14px; color: #666; margin-bottom: 30px; }
  .name { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #0f6b5c; border-bottom: 2px solid #d4af37; display: inline-block; padding-bottom: 5px; margin: 10px 0; }
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
  <div class="course" style="font-weight:700;color:#0f6b5c">${cert.course}</div>
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
