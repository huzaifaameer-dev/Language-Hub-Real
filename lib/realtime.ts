export type LiveEvent = {
  table: "applications" | "enrollments" | "poll";
  userId?: string;
  at: number;
};

type Listener = (ev: LiveEvent) => void;

const MAX_LISTENERS = 256;

// Holds the subscriber set on globalThis so the hub survives webpack dev
// hot-reloads that re-evaluate this module — otherwise producers and SSE
// consumers could end up on different listener sets.
const g = globalThis as unknown as { __lhLive?: { listeners: Set<Listener> } };
const state = g.__lhLive ?? (g.__lhLive = { listeners: new Set() });

export function publishEvent(ev: LiveEvent): void {
  for (const listener of state.listeners) {
    try {
      listener(ev);
    } catch {
      // a single broken consumer never blocks the rest
    }
  }
}

export function subscribe(listener: Listener): () => void {
  if (state.listeners.size >= MAX_LISTENERS) {
    return () => {};
  }
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

export function listenerCount(): number {
  return state.listeners.size;
}