"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Loads the browser's speech-recognition constructor, if present. */
function recognitionCtor(): { new (): RecognitionLike } | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: { new (): RecognitionLike };
    webkitSpeechRecognition?: { new (): RecognitionLike };
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

/** High-level microphone availability: idle, actively listening, or browser blocked. */
type RecapStatus = "idle" | "listening" | "error" | "unsupported";

interface UseRecognitionOptions {
  onResult: (text: string) => void;
  onEnd?: () => void;
  /** Preferred BCP-47 language tag for the recognizer (e.g. "en-PK", "ur-PK"). */
  lang: string;
}

/**
 * Hybrid input: Web Speech API for listening on Chromium (Chrome/Edge), and a
 * clean "unsupported" signal on Firefox/Safari so the caller falls back to a
 * text box. Two-way implemented for the speechRecognizer typing model.
 */
export function useRecognition({ onResult, onEnd, lang }: UseRecognitionOptions) {
  // Hydration-safe battery check: SSR snapshot is false, then the real value is
  // served after mount without any setState-in-effect.
  const supported = useSyncExternalStore(
    () => () => {},
    () => recognitionCtor() !== null,
    () => false
  );
  const [status, setStatus] = useState<RecapStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);

  const start = useCallback(() => {
    if (!supported) return;
    try {
      const Ctor = recognitionCtor();
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e) => {
        const last = e.results.length ? e.results[e.results.length - 1] : null;
        const transcript = last?.[0]?.transcript ?? "";
        if (transcript.trim()) onResult(transcript.trim());
      };
      rec.onend = () => {
        setStatus("idle");
        onEnd?.();
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setStatus("error");
          setErrorMessage("Microphone permission was not granted.");
        } else if (e.error === "no-speech") {
          setStatus("error");
          setErrorMessage("I did not hear anything. Try again, or type your question.");
        } else {
          setStatus("error");
          setErrorMessage("Microphone could not start. You can still type below.");
        }
      };
      recRef.current = rec;
      rec.start();
      setStatus("listening");
    } catch {
      setStatus("error");
      setErrorMessage("Speech input is not available here. You can still type below.");
    }
  }, [supported, lang, onResult, onEnd]);

  const stop = useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {}
    }
    setStatus("idle");
  }, []);

  // Guards against losing the listener when this unmounts mid-hearing.
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {}
    };
  }, []);

  return { supported, status, listening: status === "listening", errorMessage, start, stop };
}