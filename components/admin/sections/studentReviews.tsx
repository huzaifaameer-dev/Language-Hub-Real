"use client";

import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  Phone,
  RefreshCw,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";

import {
  api,
  Badge,
  Card,
  Empty,
  ErrorNote,
  FilterChips,
  GhostButton,
  Loading,
  Pager,
  PrimaryButton,
  SectionHead,
  fmtDateTime,
  useApi,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils";

interface StudentReview {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  teacher: string;
  headline: string;
  body: string;
  outcome: string;
  rating: number;
  photoUrl: string | null;
  consent: boolean;
  status: "NEW" | "PUBLISHED" | "ARCHIVED";
  publishedSlug: string | null;
  createdAt: string;
}

interface Feed {
  reviews: StudentReview[];
  total: number;
  page: number;
  pages: number;
  counts: Record<"ALL" | StudentReview["status"], number>;
}

const STATUS_META: Record<
  StudentReview["status"],
  { label: string; tone: "amber" | "green" | "neutral" }
> = {
  NEW: { label: "Awaiting review", tone: "amber" },
  PUBLISHED: { label: "Live on website", tone: "green" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export function StudentReviewsSection() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [notice, setNotice] = useState<{ text: string; href?: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi<Feed>(
    `/api/admin/student-reviews?status=${status}&page=${page}`
  );

  const act = async (
    review: StudentReview,
    action: "publish" | "unpublish" | "archive" | "restore"
  ) => {
    setBusyId(review.id);
    setActionError(null);
    setNotice(null);
    try {
      const res = await api<{ publicSlug: string | null }>(
        `/api/admin/student-reviews/${review.id}`,
        { method: "PATCH", body: JSON.stringify({ action }) }
      );
      if (action === "publish") {
        setNotice({
          text: `${review.name}'s review is live on the website — homepage wall and success stories.`,
          href: "/success-stories",
        });
      } else if (action === "unpublish") {
        setNotice({ text: `${review.name}'s review was removed from the website.` });
      } else if (action === "archive") {
        setNotice({ text: `${review.name}'s review was archived.` });
      } else {
        setNotice({ text: `${review.name}'s review is back in the inbox.` });
      }
      if (res.publicSlug) setNotice((n) => (n ? { ...n, href: "/#reviews" } : n));
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the review.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (review: StudentReview) => {
    if (
      !window.confirm(
        `Delete ${review.name}'s review permanently? This also removes it from the website. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(review.id);
    setActionError(null);
    try {
      await api(`/api/admin/student-reviews/${review.id}`, { method: "DELETE" });
      setNotice({ text: `${review.name}'s review was deleted.` });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the review.");
    } finally {
      setBusyId(null);
    }
  };

  const downloadExport = async (format: "csv" | "pdf") => {
    setExporting(format);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/student-reviews/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename =
        /filename="([^"]+)"/.exec(disposition)?.[1] ??
        `language-hub-student-reviews.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Could not download the export. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const counts = data?.counts;
  const rows = data?.reviews ?? [];

  return (
    <div className="space-y-4">
      {/* export / backup */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf7f3] text-[#0d6a58]">
              <Download className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="font-display text-[0.92rem] font-bold text-[#10231f]">
                Download a complete backup
              </p>
              <p className="mt-0.5 font-sans text-[0.74rem] leading-relaxed text-[#7b8f89]">
                Every review — pending, published or archived — with photos. CSV for
                spreadsheets, PDF for printing. Keep a copy before moving hosts.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void downloadExport("csv")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 rounded-full border border-[#e3ede9] bg-white px-4 py-2 font-sans text-[0.78rem] font-semibold text-[#315a50] transition hover:border-[#9fd8cb] hover:text-[#0d6a58] disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5" /> {exporting === "csv" ? "Preparing…" : "CSV"}
            </button>
            <button
              type="button"
              onClick={() => void downloadExport("pdf")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 rounded-full bg-[#0d5c4d] px-4 py-2 font-sans text-[0.78rem] font-semibold text-white transition hover:bg-[#0a4e43] disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> {exporting === "pdf" ? "Preparing…" : "PDF"}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHead
          title="Student reviews"
          hint="Submitted from /student-reviews. Publish one to add it to the homepage wall and success stories."
          action={
            <div className="flex items-center gap-2">
              <FilterChips
                value={status}
                onChange={(key) => {
                  setStatus(key);
                  setPage(1);
                }}
                options={[
                  { key: "ALL", label: "All", count: counts?.ALL ?? 0 },
                  { key: "NEW", label: "Inbox", count: counts?.NEW ?? 0 },
                  { key: "PUBLISHED", label: "On website", count: counts?.PUBLISHED ?? 0 },
                  { key: "ARCHIVED", label: "Archived", count: counts?.ARCHIVED ?? 0 },
                ]}
              />
              <button
                type="button"
                onClick={reload}
                aria-label="Refresh reviews"
                className="grid h-8 w-8 place-items-center rounded-full border border-[#e3ede9] bg-white text-[#7b8f89] transition hover:border-[#cfe3da] hover:text-[#0d6a58]"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} strokeWidth={2} />
              </button>
            </div>
          }
        />

        {notice ? (
          <div className="mx-5 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#c8ebdd] bg-[#effbf5] px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0d6a58]" />
            <p className="min-w-0 flex-1 font-sans text-[0.82rem] font-medium text-[#0a4e43]">
              {notice.text}
            </p>
            {notice.href ? (
              <a
                href={notice.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-sans text-[0.76rem] font-bold text-[#0d6a58] underline decoration-[#9fd8cb] underline-offset-2"
              >
                View on website <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="font-sans text-[0.72rem] font-semibold text-[#7b8f89] hover:text-[#10231f]"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {actionError ? (
          <div className="mx-5 mb-3">
            <ErrorNote>{actionError}</ErrorNote>
          </div>
        ) : null}

        {loading && <Loading />}
        {error && (
          <div className="p-5">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <Empty
            title="No reviews here yet"
            hint="Share /student-reviews with your students — every submission lands in this inbox."
            icon={Star}
          />
        )}

        {rows.length > 0 && (
          <ul className="divide-y divide-[#f2f7f4]">
            {rows.map((review) => {
              const meta = STATUS_META[review.status];
              const busy = busyId === review.id;
              return (
                <li key={review.id} className="px-5 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* photo */}
                    <div className="shrink-0">
                      {review.photoUrl ? (
                        <a
                          href={review.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-[#eaf3f0] transition hover:ring-[#9fd8cb]"
                          title="Open full photo"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={review.photoUrl}
                            alt={`${review.name} profile`}
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ) : (
                        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#eaf7f3] font-display text-[1.05rem] font-extrabold text-[#0d6a58]">
                          {review.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase())
                            .join("") || "LH"}
                        </span>
                      )}
                    </div>

                    {/* content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-[0.96rem] font-bold text-[#10231f]">
                          {review.name}
                        </p>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span className="flex items-center gap-0.5 text-[#f5b93c]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3",
                                i < review.rating
                                  ? "fill-current"
                                  : "fill-[#eef5f1] text-[#eef5f1]"
                              )}
                            />
                          ))}
                        </span>
                        <span className="font-sans text-[0.68rem] text-[#9aada7]">
                          {fmtDateTime(review.createdAt)}
                        </span>
                      </div>

                      <p className="mt-0.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#d9532f]">
                        {[review.course, review.batch, review.teacher].filter(Boolean).join(" · ") ||
                          "Course not set"}
                      </p>

                      {review.headline ? (
                        <p className="mt-2 font-display text-[0.9rem] font-bold italic text-[#10231f]">
                          “{review.headline}”
                        </p>
                      ) : null}
                      <p className="mt-1 max-w-3xl whitespace-pre-line font-sans text-[0.86rem] leading-relaxed text-[#44615a]">
                        {review.body}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {review.email ? (
                          <span className="inline-flex items-center gap-1 font-sans text-[0.72rem] text-[#7b8f89]">
                            <Mail className="h-3 w-3" /> {review.email}
                          </span>
                        ) : null}
                        {review.phone ? (
                          <span className="inline-flex items-center gap-1 font-sans text-[0.72rem] text-[#7b8f89]">
                            <Phone className="h-3 w-3" /> {review.phone}
                          </span>
                        ) : null}
                        {review.outcome ? (
                          <span className="inline-flex items-center gap-1 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#0d6a58]">
                            <CheckCircle2 className="h-3 w-3" /> {review.outcome}
                          </span>
                        ) : null}
                        {review.consent ? (
                          <span className="font-sans text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[#9aada7]">
                            Consent given
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* actions */}
                    <div className="flex shrink-0 flex-wrap gap-1.5 sm:max-w-[12.5rem] sm:justify-end">
                      {review.status !== "PUBLISHED" ? (
                        <PrimaryButton
                          onClick={() => void act(review, "publish")}
                          disabled={busy}
                          className="px-4 py-2 text-[0.76rem]"
                        >
                          <Globe2 className="h-3.5 w-3.5" />
                          {busy ? "Publishing…" : "Put on website"}
                        </PrimaryButton>
                      ) : (
                        <>
                          <a
                            href="/#reviews"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#c8ebdd] bg-[#effbf5] px-3.5 py-1.5 font-sans text-[0.76rem] font-semibold text-[#0d6a58] transition hover:bg-[#e4f7ee]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View on site
                          </a>
                          <GhostButton
                            onClick={() => void act(review, "unpublish")}
                            disabled={busy}
                          >
                            Remove from site
                          </GhostButton>
                        </>
                      )}

                      {review.status !== "ARCHIVED" ? (
                        <GhostButton onClick={() => void act(review, "archive")} disabled={busy}>
                          <Archive className="h-3.5 w-3.5" /> Archive
                        </GhostButton>
                      ) : (
                        <GhostButton onClick={() => void act(review, "restore")} disabled={busy}>
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </GhostButton>
                      )}

                      <GhostButton
                        onClick={() => void remove(review)}
                        disabled={busy}
                        className="border-[#f3d3c9] text-[#b2432c]"
                        aria-label={`Delete ${review.name}'s review`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </GhostButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
      </Card>
    </div>
  );
}
