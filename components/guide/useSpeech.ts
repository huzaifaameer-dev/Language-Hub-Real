"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeakStatus = "idle" | "speaking" | "stopped";

interface UseSpeechOptions {
  /** Preferred language tag for voice selection (e.g. "en-PK", "ur-PK"). */
  lang: string;
  /** Called on every TTS chunk boundary — drives the mascot's lip-sync. */
  onBoundary?: () => void;
  /** Called once the utterance finishes (returns to a non-talking pose). */
  onEnd?: () => void;
}

/**
 * Thin wrapper over the browser's SpeechSynthesis (TTS). Exposes speak/stop and
 * fires `onBoundary` for jaw animation. Returns a no-group flag so it also
 * degrades cleanly on devices without voice support.
 */
export function useSpeech({ lang, onBoundary, onEnd }: UseSpeechOptions) {
  const [supported] = useState(() =>
    typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [status, setStatus] = useState<SpeakStatus>("idle");
  const mutedRef = useRef(false);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus("stopped");
  }, [supported]);

  const setMuted = useCallback(
    (value: boolean) => {
      mutedRef.current = value;
      if (value) cancel();
    },
    [cancel]
  );

  const speak = useCallback(
    (text: string, voicePref?: "female" | "male") => {
      if (!supported) return;
      if (!text.trim()) return;
      window.speechSynthesis.cancel();
      utterancesRef.current = [];

      const pickVoice = (): SpeechSynthesisVoice | null => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;
        const norm = lang.toLowerCase().replace("_", "-");
        const pref = voices.find((v) => v.lang.toLowerCase().startsWith(norm));
        if (pref) return pref;
        const female = voices.find(
          (v) =>
            /female|woman|samantha|zira|hazel/i.test(v.name) &&
            (v.lang.toLowerCase().startsWith("en") || v.lang.toLowerCase().startsWith("ur"))
        );
        if (voicePref === "male") {
          return (
            voices.find((v) => /male|david|mark|george/i.test(v.name)) ??
            voices.find((v) => v.lang.toLowerCase().startsWith("en") || v.lang.toLowerCase().startsWith("ur")) ??
            voices[0]
          );
        }
        return female ?? voices.find((v) => v.lang.toLowerCase().startsWith("en")) ?? voices[0];
      };

      const utter = new SpeechSynthesisUtterance(text);
      if (voicePref === "female" || voicePref === "male") {
        const voice = pickVoice();
        if (voice) utter.voice = voice;
      }
      utter.lang = lang;
      utter.rate = lang.startsWith("ur") ? 0.95 : 1.02;
      utter.pitch = 1.05;
      // Strip any residual markdown flourishes so the spoken voice stays clean.
      utter.text = text.replace(/[*_#`]/g, "").replace(/\s+/g, " ");
      utter.onstart = () => {
        utterancesRef.current.push(utter);
        setStatus("speaking");
      };
      utter.onboundary = (e) => {
        // word boundaries give natural lip movement; ignore the character ones.
        if (e.name === "word" || e.name === "sentence") onBoundary?.();
      };
      utter.onend = () => {
        utterancesRef.current = utterancesRef.current.filter((u) => u !== utter);
        if (utterancesRef.current.length === 0) setStatus("idle");
        onEnd?.();
      };

      try {
        window.speechSynthesis.speak(utter);
      } catch {
        setStatus("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supported, lang]
  );

  // Some browsers pause speech after a long idle; poke the queue to resume.
  useEffect(() => {
    if (!supported) return;
    const id = window.setInterval(() => {
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => window.clearInterval(id);
  }, [supported]);

  return { supported, status, speak, cancel, setMuted };
}