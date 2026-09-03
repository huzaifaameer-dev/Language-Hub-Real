import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { LiveEvent } from "../lib/realtime";

describe("realtime pub/sub", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    const g = globalThis as unknown as { __lhLive?: { listeners: Set<unknown> } };
    if (g.__lhLive) g.__lhLive.listeners.clear();
  });

  it("delivers published events to subscribers", async () => {
    const { subscribe, publishEvent } = await import("../lib/realtime");
    const seen: LiveEvent[] = [];
    const unsub = subscribe((ev) => seen.push(ev));
    publishEvent({ table: "applications", userId: "u1", at: 1 });
    publishEvent({ table: "courses", at: 2 });
    unsub();
    publishEvent({ table: "poll", at: 3 });
    expect(seen.map((e) => e.table)).toEqual(["applications", "courses"]);
  });

  it("keeps dispatching to other listeners when one throws", async () => {
    const { subscribe, publishEvent, listenerCount } = await import("../lib/realtime");
    const seen: LiveEvent[] = [];
    subscribe(() => {
      throw new Error("boom");
    });
    subscribe((ev) => seen.push(ev));
    publishEvent({ table: "notifications", userId: "u2", at: 9 });
    expect(seen.map((e) => e.table)).toEqual(["notifications"]);
    expect(listenerCount()).toBe(2);
  });

  it("unsubscribe removes only that listener", async () => {
    const { subscribe, publishEvent } = await import("../lib/realtime");
    let a = 0;
    let b = 0;
    const unsub = subscribe(() => {
      a += 1;
    });
    subscribe(() => {
      b += 1;
    });
    unsub();
    publishEvent({ table: "poll", at: 0 });
    expect(a).toBe(0);
    expect(b).toBe(1);
  });

  it("caps the listener set", async () => {
    const { subscribe, listenerCount } = await import("../lib/realtime");
    for (let i = 0; i < 300; i += 1) {
      subscribe(() => {});
    }
    expect(listenerCount()).toBeLessThanOrEqual(256);
  });
});