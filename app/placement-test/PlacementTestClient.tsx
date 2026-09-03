"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  Mail,
} from "lucide-react";
import {
  PLACEMENT_QUESTIONS,
  calculatePlacement,
  type PlacementResult,
} from "@/lib/placement-test-data";

const TOTAL_TIME = 10 * 60; // 10 minutes in seconds
const ease = [0.16, 1, 0.3, 1] as const;

export function PlacementTestClient() {
  const [phase, setPhase] = useState<"welcome" | "quiz" | "results">("welcome");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(PLACEMENT_QUESTIONS.length).fill(null)
  );
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [name, setName] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  });

  const finishQuiz = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalAnswers = answersRef.current.map((a) => (a === null ? -1 : a));
    const r = calculatePlacement(finalAnswers);
    setResult(r);
    setPhase("results");
  }, []);

  useEffect(() => {
    if (phase !== "quiz") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "quiz" && timeLeft === 0) {
      finishQuiz();
    }
  }, [phase, timeLeft, finishQuiz]);

  const answeredCount = answers.filter((a) => a !== null).length;
  const q = PLACEMENT_QUESTIONS[current];

  const selectAnswer = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const submitEmail = async () => {
    if (!email.trim()) return;
    try {
      await fetch("/api/placement-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          score: result?.score,
          total: result?.total,
          level: result?.level,
          recommendedCourse: result?.recommendedCourse,
        }),
      });
    } catch {
      // best-effort lead capture
    }
    setEmailSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
      <AnimatePresence mode="wait">
        {phase === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease }}
            className="flex flex-col items-center text-center"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand/10 text-brand-deep">
              <Target className="h-10 w-10" strokeWidth={1.5} />
            </span>
            <h1 className="mt-6 font-display text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-[-0.02em] text-ink">
              Free English Level Test
            </h1>
            <p className="mt-3 max-w-lg text-[1rem] leading-relaxed text-ink-2">
              Find out your English level in 10 minutes. 20 questions across grammar,
              vocabulary, reading and sentence structure — then get a personalised
              course recommendation.
            </p>
            <div className="mt-6 flex items-center gap-6 font-mono text-[0.68rem] uppercase tracking-widest text-ink-3">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> 10 min
              </span>
              <span>20 questions</span>
              <span>Instant results</span>
            </div>
            <button
              type="button"
              onClick={() => setPhase("quiz")}
              className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-10 font-display text-[0.92rem] font-bold text-white shadow-[0_16px_40px_-16px_rgb(110_90_224/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              Start the test <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-4 font-mono text-[0.6rem] text-ink-3">
              No sign-up required · Free · Instant results
            </p>
          </motion.div>
        )}

        {phase === "quiz" && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease }}
          >
            {/* Header bar */}
            <div className="sticky top-[4.25rem] z-10 -mx-5 flex items-center justify-between border-b border-ink/10 bg-[#faf8f4]/90 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="font-display text-[0.85rem] font-extrabold text-ink">
                  {current + 1}/{PLACEMENT_QUESTIONS.length}
                </span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink/[0.07] sm:w-48">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${((current + 1) / PLACEMENT_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 font-mono text-[0.8rem] font-bold ${
                  timeLeft <= 60 ? "text-rose-500" : timeLeft <= 180 ? "text-gold-deep" : "text-ink-2"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-block rounded-md px-2 py-0.5 font-display text-[0.58rem] font-bold uppercase tracking-[0.18em] ${
                    q.category === "grammar"
                      ? "bg-brand/10 text-brand-deep"
                      : q.category === "vocabulary"
                        ? "bg-emerald-50 text-emerald-600"
                        : q.category === "reading"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {q.category.replace("-", " ")}
                </span>
                <span className="font-mono text-[0.58rem] uppercase tracking-widest text-ink-3">
                  {q.level}
                </span>
              </div>
              <h2 className="font-display text-[1.15rem] font-extrabold text-ink leading-snug">
                {q.question}
              </h2>

              <div className="mt-6 flex flex-col gap-3">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectAnswer(i)}
                    className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-200 ${
                      answers[current] === i
                        ? "border-brand bg-brand/[0.06] shadow-[0_0_0_2px_rgb(99_102_241/0.3)]"
                        : "border-ink/10 bg-white hover:border-brand/40 hover:bg-brand/[0.02]"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[0.78rem] font-bold ${
                        answers[current] === i
                          ? "bg-brand text-white"
                          : "bg-ink/[0.05] text-ink-2"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-[0.92rem] font-medium text-ink">{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-5 font-display text-[0.82rem] font-bold text-ink-2 transition-all hover:bg-ink hover:text-ivory disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="font-mono text-[0.62rem] text-ink-3">
                {answeredCount}/{PLACEMENT_QUESTIONS.length} answered
              </span>
              {current < PLACEMENT_QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrent((c) => Math.min(PLACEMENT_QUESTIONS.length - 1, c + 1))}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-display text-[0.82rem] font-bold text-ivory transition-all hover:bg-brand-deep"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishQuiz}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-6 font-display text-[0.82rem] font-bold text-white shadow-[0_12px_30px_-12px_rgb(110_90_224/0.6)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  Submit <CheckCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Question grid */}
            <div className="mt-8 flex flex-wrap gap-2">
              {PLACEMENT_QUESTIONS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`grid h-8 w-8 place-items-center rounded-lg font-mono text-[0.62rem] font-bold transition-all ${
                    i === current
                      ? "bg-brand text-white scale-110"
                      : answers[i] !== null
                        ? "bg-brand/15 text-brand-deep"
                        : "bg-ink/[0.05] text-ink-3 hover:bg-ink/10"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "results" && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-col items-center"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-gold/15 text-gold-deep animate-success-pop">
              <Trophy className="h-10 w-10" strokeWidth={1.5} />
            </span>
            <h1 className="mt-6 font-display text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-[-0.02em] text-ink text-center">
              Your Results
            </h1>

            {/* Score card */}
            <div className="mt-6 w-full max-w-md rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-[0_20px_60px_-20px_rgb(15_23_42/0.12)]">
              <div className="relative mx-auto h-32 w-32">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e9f2" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={result.percentage >= 70 ? "#10b981" : result.percentage >= 40 ? "#f59e0b" : "#6366f1"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.percentage / 100) * 327} 327`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[2rem] font-extrabold text-ink">{result.percentage}%</span>
                  <span className="font-mono text-[0.58rem] uppercase tracking-widest text-ink-3">
                    {result.score}/{result.total}
                  </span>
                </div>
              </div>

              <p className="mt-4 font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-brand-deep">
                Your level
              </p>
              <p className="mt-1 font-display text-[1.5rem] font-extrabold capitalize text-ink">
                {result.level}
              </p>
            </div>

            {/* Category breakdown */}
            <div className="mt-6 w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6">
              <h3 className="font-display text-[0.9rem] font-extrabold text-ink">Category Breakdown</h3>
              <div className="mt-4 flex flex-col gap-3">
                {Object.entries(result.categoryBreakdown).map(([cat, data]) => {
                  const pct = Math.round((data.correct / data.total) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
                        <span>{cat.replace("-", " ")}</span>
                        <span className="text-ink-2">{data.correct}/{data.total}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/[0.07]">
                        <div
                          className="h-full rounded-full bg-brand transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-6 w-full max-w-md rounded-2xl border border-brand/20 bg-brand/[0.04] p-6">
              <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-brand-deep">
                Recommended for you
              </p>
              <h3 className="mt-2 font-display text-[1.2rem] font-extrabold text-ink">
                {result.recommendedCourse}
              </h3>
              <p className="mt-2 text-[0.88rem] text-ink-2">
                Based on your {result.percentage}% score, we recommend starting with this course to maximise your progress.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-7 font-display text-[0.82rem] font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  <BookOpen className="h-4 w-4" /> Apply now
                </Link>
                <Link
                  href={`/courses/${result.recommendedCourse.toLowerCase().replace(/\s+/g, "-")}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-7 font-display text-[0.82rem] font-bold text-ink transition-all hover:bg-ink hover:text-ivory"
                >
                  View course details
                </Link>
              </div>
            </div>

            {/* Email capture for leads */}
            {!emailSubmitted ? (
              <div className="mt-8 w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-brand-deep" />
                  <h3 className="font-display text-[0.9rem] font-extrabold text-ink">
                    Get your detailed results
                  </h3>
                </div>
                <p className="text-[0.82rem] text-ink-2 mb-4">
                  Enter your email and we&apos;ll send you a full breakdown with study tips.
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mb-3 w-full rounded-xl border border-ink/10 bg-[#faf8f4] px-4 py-3 text-[0.88rem] text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/[0.08]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mb-3 w-full rounded-xl border border-ink/10 bg-[#faf8f4] px-4 py-3 text-[0.88rem] text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/[0.08]"
                />
                <button
                  type="button"
                  onClick={submitEmail}
                  disabled={!email.trim()}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 font-display text-[0.82rem] font-bold text-ivory transition-all hover:bg-brand-deep disabled:opacity-40"
                >
                  Send my results
                </button>
              </div>
            ) : (
              <div className="mt-8 flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-display text-[0.85rem] font-bold">Results sent! Check your inbox.</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setPhase("welcome");
                setCurrent(0);
                setAnswers(new Array(PLACEMENT_QUESTIONS.length).fill(null));
                setTimeLeft(TOTAL_TIME);
                setResult(null);
                setEmailSubmitted(false);
                setEmail("");
                setName("");
              }}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-6 font-display text-[0.82rem] font-bold text-ink-2 transition-all hover:bg-ink hover:text-ivory"
            >
              Retake test
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
