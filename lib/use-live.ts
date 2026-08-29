"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveEvent } from "./realtime";

/**
 * Subscribes to the /api/events SSE stream and re-fires `onEvent` for each
 * signal. A `intervalMs` polling fallback keeps data moving even when the
 * stream drops (dev/proxy flakiness) and a visibility-change poke refreshes
 * on tab focus. Returns whether the stream is currently connected.
 */
export function useLiveSync(
  onEvent: (ev: LiveEvent) => void,
  intervalMs = 20000
): boolean {
  const [live, setLive] = useState(false);
  const handlerRef = useRef(onEvent);
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let closed = false;

    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/events");
    } catch {
      es = null;
    }

    if (es) {
      es.onopen = () => {
        if (!closed) setLive(true);
      };
      es.onerror = () => {
        if (!closed) setLive(false);
      };
      es.onmessage = (m) => {
        if (closed) return;
        try {
          handlerRef.current(JSON.parse(m.data) as LiveEvent);
        } catch {
          // ignore malformed frames
        }
      };
    }

    const poll = setInterval(() => {
      if (!closed) handlerRef.current({ table: "poll", at: Date.now() });
    }, intervalMs);

    const onVisible = () => {
      if (!document.hidden) handlerRef.current({ table: "poll", at: Date.now() });
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      closed = true;
      es?.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return live;
}