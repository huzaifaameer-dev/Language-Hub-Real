"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  WandSparkles,
  Wallet,
  X,
} from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { guideScripts } from "@/lib/guide/guide";
import { useSpeech } from "@/components/guide/useSpeech";
import { useRecognition } from "@/components/guide/useRecognition";
import { GuideBubble } from "@/components/guide/GuideBubble";
import type { GuidePose } from "@/components/guide/GuideScene";

const GuideScene = dynamic(() => import("@/components/guide/GuideScene").then((m) => m.GuideScene), {
  ssr: false,
});

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SEEN_KEY = "lh:guide-seen";
const SESSION_KEY = "lh:guide-session";

let seq = 0;
const nextId = () => `g-${++seq}`;

export function GuideCompanion() {
  const { dict, lang } = useLang();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [welcomeChip, setWelcomeChip] = useState(false);

  const mutedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const speechLang = lang === "ur" ? "ur-PK" : "en-PK";
  const speech = useSpeech({ lang: speechLang });

  const rec = useRecognition({
    lang: speechLang,
    onResult: (t) => void send(t),
    onEnd: () => {},
  });

  // speech()/rec() return fresh objects every render — keep the latest ones in
  // refs (updated in an effect, which React Compiler rules allow) so callbacks
  // and cleanups can always reach the current implementation.
  const speechRef = useRef(speech);
  const speakRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  useEffect(() => {
    speakRef.current = (text: string) => {
      if (mutedRef.current) return;
      speechRef.current.speak(text, "female");
    };
  });

  const queueVoice = useCallback((text: string) => speakRef.current(text), []);

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || streaming) return;
      setError(null);
      setInput("");

      const history = messages
        .slice(-8)
        .filter((m) => m.text)
        .map((m) => ({ role: m.role, content: m.text }));

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "user", text: content },
        { id: nextId(), role: "assistant", text: "" },
      ]);
      setStreaming(true);

      try {
        const res = await fetch("/api/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...history, { role: "user", content }], lang }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setError((data as { message?: string }).message ?? dict["guide.error"]);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";
        const append = (delta: string) => {
          full += delta;
          setMessages((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === "assistant") {
                copy[i] = { ...copy[i], text: copy[i].text + delta };
                return copy;
              }
            }
            return copy;
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const lines = frame.split("\n");
            let event = "message";
            let data = "";
            for (const l of lines) {
              if (l.startsWith("event:")) event = l.slice(6).trim();
              else if (l.startsWith("data:")) data += l.slice(5).trim();
            }
            if (!data) continue;
            try {
              const payload = JSON.parse(data) as { text?: string; message?: string };
              if (event === "delta" && typeof payload.text === "string") append(payload.text);
              else if (event === "error") setError(payload.message ?? dict["guide.error"]);
            } catch {
              // ignore malformed frames
            }
          }
        }

        if (full.trim()) queueVoice(full.trim());
      } catch {
        setError(dict["guide.error"]);
      } finally {
        setStreaming(false);
      }
    },
    [streaming, messages, lang, queueVoice, dict]
  );

  const triggerGreeting = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setOpen(true);
    const script = guideScripts(lang).greeting;
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: script }]);
    queueVoice(script);
  }, [lang, queueVoice]);

  // Auto-greet: wait until the brand intro is done, then open and say hello.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}

    if (seen) {
      // Subsequent session: non-intrusive welcome chip, no auto-speech.
      try {
        if (!sessionStorage.getItem(SESSION_KEY)) {
          sessionStorage.setItem(SESSION_KEY, "1");
          const t = window.setTimeout(() => setWelcomeChip(true), 2500);
          const hide = window.setTimeout(() => setWelcomeChip(false), 9500);
          return () => {
            window.clearTimeout(t);
            window.clearTimeout(hide);
          };
        }
      } catch {}
      return;
    }

    let tries = 0;
    const timer = window.setInterval(() => {
      let introDone = true;
      try {
        introDone = localStorage.getItem("lh:intro-seen") === "1";
      } catch {}
      if (introDone || ++tries > 48) {
        window.clearInterval(timer);
        // Small delay so the page has settled behind us.
        window.setTimeout(() => triggerGreeting(), 350);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [triggerGreeting]);

  // Cancel speech when the widget closes / unmounts.
  useEffect(() => {
    if (!open) speechRef.current.cancel();
  }, [open]);

  useEffect(() => () => speechRef.current.cancel(), []);

  // Pose derives purely from the current voice/listening/streaming state.
  const pose: GuidePose = rec.listening
    ? "listening"
    : streaming
      ? "thinking"
      : speech.status === "speaking"
        ? "speaking"
        : "idle";

  // Auto-scroll the transcript as new lines arrive.
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }, [messages, streaming]);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      speechRef.current.setMuted(next);
      return next;
    });
  };

  const toggleMic = () => {
    if (rec.listening) rec.stop();
    else rec.start();
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.text ?? null;
  const lastAssistantEmpty = lastAssistant === "";
  const statusChip = streaming
    ? dict["guide.thinking"]
    : rec.listening
      ? dict["guide.listening"]
      : speech.status === "speaking"
        ? dict["guide.speaking"]
        : null;

  const userCount = messages.filter((m) => m.role === "user").length;
  const showChips = !streaming && !rec.listening && userCount === 0;

  const entry = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: 0.88, y: 24 },
        animate: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { type: "spring" as const, stiffness: 320, damping: 27 },
        },
        exit: {
          opacity: 0,
          scale: 0.9,
          y: 16,
          transition: { duration: 0.16, ease: "easeIn" as const },
        },
      };

  return (
    <div className="fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="panel"
            role="dialog"
            aria-label={dict["guide.name"]}
            {...entry}
            style={{ transformOrigin: "bottom right" }}
            className="w-[min(22.5rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_50px_120px_-32px_rgb(15_23_42/0.55)]"
          >
            {/* Branded header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#312e81] via-brand-deep to-brand">
              <div aria-hidden="true" className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-brand-cyan/40 blur-2xl" />
              <div aria-hidden="true" className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-brand-magenta/50 blur-2xl" />
              <div aria-hidden="true" className="absolute right-1/2 top-0 h-px w-2/3 translate-x-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="relative flex items-center justify-between gap-3 px-5 pt-4">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/30 bg-white/15 text-white shadow-[0_10px_30px_-10px_rgb(0_0_0/0.45)] backdrop-blur-md">
                    <WandSparkles className="h-5 w-5" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-deep bg-emerald-400" />
                  </span>
                  <div>
                    <p className="font-display text-[1.05rem] font-extrabold leading-tight tracking-[-0.01em] text-white">
                      {dict["guide.name"]}
                    </p>
                    <p className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.22em] text-white/70">
                      {dict["guide.role"]}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={dict["guide.close"]}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-white/10 text-white/90 backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative flex items-center gap-2 px-5 pb-6 pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  {dict["guide.online"]}
                </span>
                <span className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white/60">
                  {dict["guide.repliesFast"]}
                </span>
              </div>
            </div>

            {/* 3D scene + speech bubble (overlaps the header) */}
            <div className="relative mx-3 -mt-6 h-44 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-[#eef1ff] via-[#f7f8ff] to-white shadow-[0_18px_44px_-22px_rgb(15_23_42/0.35)]">
              <div aria-hidden="true" className="aurora-blob left-[-3.5rem] top-[-2rem] h-40 w-40 bg-brand/30" />
              <div aria-hidden="true" className="aurora-blob bottom-[-4rem] right-[-4rem] h-52 w-52 bg-brand-magenta/25" />
              <div aria-hidden="true" className="absolute inset-x-8 bottom-0 h-16 rounded-[100%] bg-brand/10 blur-xl" />
              <GuideBubble
                text={statusChip ? lastAssistant : null}
                speaking={speech.status === "speaking"}
                name={dict["guide.name"]}
              />
              <GuideScene pose={pose} className="h-full w-full" />
            </div>

            {/* Status pill */}
            <div className="mt-2 flex h-6 items-center justify-center px-4">
              {statusChip ? (
                <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] px-3 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.18em] text-brand-deep">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-deep" />
                  {statusChip}
                </p>
              ) : null}
            </div>

            {/* Transcript */}
            <div
              ref={scrollRef}
              className="no-scrollbar max-h-36 space-y-2.5 overflow-y-auto px-4 pb-1"
            >
              {messages.length === 0 && !streaming ? (
                <p className="pt-2 text-center font-mono text-[0.56rem] font-bold uppercase tracking-[0.18em] text-ink-3">
                  ···
                </p>
              ) : null}
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-magenta text-white shadow-[0_8px_18px_-8px_rgb(110_90_224/0.8)]">
                      <WandSparkles className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <p
                    className={`max-w-[80%] whitespace-pre-wrap px-3.5 py-2.5 text-[0.82rem] leading-relaxed ${
                      m.role === "user"
                        ? "rounded-2xl rounded-br-md bg-gradient-to-br from-ink to-[#1e293b] text-ivory"
                        : "rounded-2xl rounded-bl-md border border-ink/[0.07] bg-[#f7f8fc] text-ink-2"
                    }`}
                  >
                    {m.text}
                  </p>
                </motion.div>
              ))}
              {streaming && lastAssistantEmpty ? (
                <div className="flex items-end gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-magenta text-white shadow-[0_8px_18px_-8px_rgb(110_90_224/0.8)]">
                    <WandSparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-ink/[0.07] bg-[#f7f8fc] px-4 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-magenta" style={{ animationDelay: "120ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-cyan" style={{ animationDelay: "240ms" }} />
                  </span>
                </div>
              ) : null}
            </div>

            {/* Quick chips */}
            {showChips && (
              <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-1.5">
                <span className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                  Try:
                </span>
                <button
                  type="button"
                  onClick={() => void send(dict["guide.chipTour"])}
                  className="group/chip inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-gradient-to-r from-brand/[0.07] to-brand-magenta/[0.07] px-3 py-1.5 text-[0.72rem] font-bold text-brand-deep transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_10px_22px_-12px_rgb(99_102_241/0.7)]"
                >
                  <Compass className="h-3.5 w-3.5 transition-transform duration-300 group-hover/chip:rotate-45" />
                  {dict["guide.chipTour"]}
                </button>
                <button
                  type="button"
                  onClick={() => void send(dict["guide.chipFees"])}
                  className="group/chip inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-gradient-to-r from-brand/[0.07] to-brand-magenta/[0.07] px-3 py-1.5 text-[0.72rem] font-bold text-brand-deep transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_10px_22px_-12px_rgb(99_102_241/0.7)]"
                >
                  <Wallet className="h-3.5 w-3.5 transition-transform duration-300 group-hover/chip:-rotate-12" />
                  {dict["guide.chipFees"]}
                </button>
              </div>
            )}

            {error ? (
              <p className="px-4 pb-2 text-[0.72rem] font-semibold text-rose-600">{error}</p>
            ) : null}

            {/* Composer */}
            <div className="border-t border-ink/[0.06] bg-gradient-to-b from-white to-[#fafbfe] px-4 py-3.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="flex items-center gap-1.5 rounded-2xl border border-ink/[0.1] bg-white p-1.5 shadow-[0_6px_22px_-14px_rgb(15_23_42/0.35)] transition-all focus-within:border-brand/60 focus-within:ring-4 focus-within:ring-brand/[0.08]"
              >
                {rec.supported && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    aria-label={rec.listening ? dict["guide.micStop"] : dict["guide.mic"]}
                    className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all ${
                      rec.listening
                        ? "bg-rose-50 text-rose-600"
                        : "text-ink-2 hover:bg-ink/[0.04] hover:text-brand-deep"
                    }`}
                  >
                    {rec.listening && (
                      <span className="absolute inset-0 animate-ping rounded-xl bg-rose-200/60" />
                    )}
                    <span className="relative">
                      {rec.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </span>
                  </button>
                )}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={dict["guide.placeholder"]}
                  aria-label={dict["guide.placeholder"]}
                  className="h-10 min-w-0 flex-1 bg-transparent px-1.5 text-[0.84rem] text-ink outline-none placeholder:text-ink-3/70"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  aria-label={dict["guide.send"]}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-deep to-brand-magenta text-white shadow-[0_10px_24px_-10px_rgb(110_90_224/0.9)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="mt-2.5 flex items-center justify-between px-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="inline-flex items-center gap-1.5 font-mono text-[0.56rem] font-bold uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-brand-deep"
                >
                  {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {muted ? dict["guide.unmute"] : dict["guide.mute"]}
                </button>
                <span className="inline-flex items-center gap-1.5 font-mono text-[0.54rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                  <Sparkles className="h-3 w-3 text-brand" />
                  {dict["guide.powered"]}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="launcher"
            {...entry}
            className="flex flex-col items-end gap-3"
          >
            {/* Welcome-back chip (non-first visits) */}
            {welcomeChip && (
              <button
                type="button"
                onClick={() => {
                  setWelcomeChip(false);
                  setOpen(true);
                }}
                className="max-w-[15rem] rounded-2xl rounded-br-md border border-white/70 bg-white/95 px-4 py-2.5 text-start text-[0.8rem] leading-snug text-ink shadow-[0_20px_48px_-20px_rgb(15_23_42/0.45)] backdrop-blur-xl"
              >
                <span className="mb-0.5 flex items-center gap-1.5 font-display text-[0.7rem] font-extrabold text-brand-deep">
                  <WandSparkles className="h-3.5 w-3.5" />
                  {dict["guide.name"]}
                </span>
                {guideScripts(lang).welcomeBack}
              </button>
            )}

            <div className="flex items-center gap-3">
              <span
                className="hidden rounded-full border border-white/70 bg-white/90 px-3.5 py-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink shadow-[0_10px_28px_-14px_rgb(15_23_42/0.5)] backdrop-blur-xl sm:block"
              >
                {dict["guide.role"]}
              </span>
              <button
                type="button"
                onClick={() => {
                  setWelcomeChip(false);
                  if (!messages.length) triggerGreeting();
                  else setOpen(true);
                }}
                aria-label={dict["guide.open"]}
                className="group relative grid h-14 w-14 place-items-center"
              >
                <span
                  aria-hidden="true"
                  className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-brand via-brand-magenta to-brand-cyan opacity-50 blur-md transition-opacity duration-300 group-hover:opacity-80"
                />
                <span
                  aria-hidden="true"
                  className="absolute -inset-[3px] animate-spin rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 [animation-duration:6s]"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 85%, rgb(255 255 255 / 0.95) 100%)",
                  }}
                />
                <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-magenta text-white shadow-[0_20px_48px_-16px_rgb(110_90_224/0.95)] transition-transform duration-300 group-hover:scale-[1.05]">
                  <WandSparkles className="h-6 w-6 transition-transform duration-300 group-hover:-rotate-12" />
                  <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}