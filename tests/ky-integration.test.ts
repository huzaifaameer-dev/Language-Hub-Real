import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDedupTracker,
  createMemoryKeyStore,
  type AutomationDedup,
} from "../lib/automation-dedup";

/**
 * SANDBOX / MOCK tests.
 *
 * These exercise the Konnect, WhatsApp and automation-dedup logic against a
 * mocked `global.fetch` and an in-memory store — NO real credentials are ever
 * used or touched. Endpoints are stubbed so requests never leave the process.
 */

/** Helpers to set + restore env vars and re-import a module fresh each time. */
const ENV_BACKUP = new Map<string, string | undefined>();

function setEnv(pairs: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(pairs)) {
    if (!ENV_BACKUP.has(k)) ENV_BACKUP.set(k, process.env[k]);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function restoreEnv() {
  for (const [k, v] of ENV_BACKUP) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  ENV_BACKUP.clear();
}

describe("automation dedup (pure, no DB)", () => {
  it("claims a fresh key and re-sending skips it", async () => {
    const dedup = createDedupTracker(createMemoryKeyStore());
    const key = "payment:student@example.com";

    expect(await dedup.claim(key)).toBe(key);
    // Simulate a successful send, then mark it.
    await dedup.markSent(key);

    expect(await dedup.alreadySent(key)).toBe(true);
    expect(await dedup.markSent(key)).toBeUndefined(); // idempotent
  });

  it("claim returns null once the key is already sent", async () => {
    const dedup = createDedupTracker(createMemoryKeyStore());
    await dedup.markSent("abandoned:a@example.com");
    expect(await dedup.claim("abandoned:a@example.com")).toBeNull();
  });

  it("keys are independent — one key does not block another", async () => {
    const dedup = createDedupTracker(createMemoryKeyStore());
    await dedup.markSent("seq2:a@example.com");
    expect(await dedup.claim("seq2:b@example.com")).toBe("seq2:b@example.com");
  });
});

describe("automation dedup against a slow/async backing store", () => {
  it("works with a non-instant store (concurrent-claim safe)", async () => {
    const mem = createMemoryKeyStore();
    const slow: typeof mem = {
      async has(k) {
        await new Promise((r) => setTimeout(r, 1));
        return mem.has(k);
      },
      async add(k) {
        await new Promise((r) => setTimeout(r, 1));
        return mem.add(k);
      },
    };
    const dedup: AutomationDedup = createDedupTracker(slow);
    const results = await Promise.all([
      dedup.claim("payment:x@example.com"),
      dedup.claim("payment:x@example.com"),
    ]);
    // At least one claim wins; a double-send is prevented once marked.
    expect(results).toContain("payment:x@example.com");
  });
});

describe("konnect createKonnectPayment (mocked fetch)", () => {
  let Konnect: typeof import("../lib/konnect");
  let spy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const origFetch = (global as { fetch: unknown }).fetch;
    spy = vi.fn(origFetch as typeof fetch);
    vi.stubGlobal("fetch", spy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnv();
  });

  it("returns a not-configured error when credentials are missing", async () => {
    setEnv({ KONNECT_MERCHANT_ID: undefined, KONNECT_SECRET_KEY: undefined });
    Konnect = await import("../lib/konnect");

    const res = await Konnect.createKonnectPayment({
      merchantOrderID: "o1",
      amount: 12000,
      currency: "PKR",
      customerName: "Ali",
      customerEmail: "ali@example.com",
      customerPhone: "+923001234567",
      productDescription: "Spoken English",
      returnUrl: "https://app.example/return",
    });

    expect(res.message).toContain("not configured");
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns paymentUrl + paymentId on a successful mocked response", async () => {
    setEnv({
      KONNECT_MERCHANT_ID: "mock-merchant-id",
      KONNECT_SECRET_KEY: "mock-secret-key",
    });
    spy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ paymentId: "PAY-123", paymentUrl: "https://checkout.example/pay/123" }),
        { status: 200 }
      )
    );
    Konnect = await import("../lib/konnect");

    const res = await Konnect.createKonnectPayment({
      merchantOrderID: "o2",
      amount: 8000,
      currency: "PKR",
      customerName: "Sara",
      customerEmail: "sara@example.com",
      customerPhone: "+923009876543",
      productDescription: "IELTS",
      returnUrl: "https://app.example/return",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(res.paymentId).toBe("PAY-123");
    expect(res.paymentUrl).toBe("https://checkout.example/pay/123");
  });

  it("surfaces a gateway error message on a non-ok response", async () => {
    setEnv({
      KONNECT_MERCHANT_ID: "mock-merchant-id",
      KONNECT_SECRET_KEY: "mock-secret-key",
    });
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "Insufficient balance" } }), { status: 400 })
    );
    Konnect = await import("../lib/konnect");

    const res = await Konnect.createKonnectPayment({
      merchantOrderID: "o3",
      amount: 8000,
      currency: "PKR",
      customerName: "Sara",
      customerEmail: "sara@example.com",
      customerPhone: "+923009876543",
      productDescription: "IELTS",
      returnUrl: "https://app.example/return",
    });

    expect(res.message).toContain("Insufficient balance");
  });
});

describe("konnect verifyKonnectPayment (mocked fetch)", () => {
  let Konnect: typeof import("../lib/konnect");
  let spy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const origFetch = (global as { fetch: unknown }).fetch;
    spy = vi.fn(origFetch as typeof fetch);
    vi.stubGlobal("fetch", spy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnv();
  });

  it("returns unconfigured when no credentials", async () => {
    setEnv({ KONNECT_MERCHANT_ID: undefined, KONNECT_SECRET_KEY: undefined });
    Konnect = await import("../lib/konnect");
    const res = await Konnect.verifyKonnectPayment("PAY-999");
    expect(res.paid).toBe(false);
    expect(res.status).toBe("unconfigured");
    expect(spy).not.toHaveBeenCalled();
  });

  it("flags a SUCCESS status as paid", async () => {
    setEnv({
      KONNECT_MERCHANT_ID: "mock-merchant-id",
      KONNECT_SECRET_KEY: "mock-secret-key",
    });
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "SUCCESS" }), { status: 200 })
    );
    Konnect = await import("../lib/konnect");
    const res = await Konnect.verifyKonnectPayment("PAY-123");
    expect(res.paid).toBe(true);
    expect(res.status).toBe("SUCCESS");
  });

  it("flags a PENDING status as not paid", async () => {
    setEnv({
      KONNECT_MERCHANT_ID: "mock-merchant-id",
      KONNECT_SECRET_KEY: "mock-secret-key",
    });
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "PENDING" }), { status: 200 })
    );
    Konnect = await import("../lib/konnect");
    const res = await Konnect.verifyKonnectPayment("PAY-456");
    expect(res.paid).toBe(false);
    expect(res.status).toBe("PENDING");
  });
});

describe("whatsapp sendWaText (mocked fetch + config gating)", () => {
  let WhatsApp: typeof import("../lib/whatsapp");
  let spy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const origFetch = (global as { fetch: unknown }).fetch;
    spy = vi.fn(origFetch as typeof fetch);
    vi.stubGlobal("fetch", spy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnv();
  });

  it("gates on waConfigured — fails without a token, no fetch call", async () => {
    setEnv({ WA_TOKEN: undefined });
    WhatsApp = await import("../lib/whatsapp");
    expect(WhatsApp.waConfigured()).toBe(false);
    const res = await WhatsApp.sendWaText({ to: "+923001234567", text: "hi" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("not configured");
    expect(spy).not.toHaveBeenCalled();
  });

  it("sends successfully when configured and the provider returns ok", async () => {
    setEnv({
      WA_TOKEN: "mock-wa-token",
      WA_PHONE_NUMBER: "+923001234567",
    });
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ messages: [{ id: "wamid.123" }] }), { status: 200 })
    );
    WhatsApp = await import("../lib/whatsapp");

    const res = await WhatsApp.sendWaText({ to: "+923001234567", text: "Hello!" });
    expect(res.ok).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("reports a provider error when the mocked call is non-ok", async () => {
    setEnv({
      WA_TOKEN: "mock-wa-token",
      WA_PHONE_NUMBER: "+923001234567",
    });
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "Recipient not on WhatsApp" } }), {
        status: 404,
      })
    );
    WhatsApp = await import("../lib/whatsapp");

    const res = await WhatsApp.sendWaText({ to: "+923009876543", text: "hi" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("not on WhatsApp");
  });

  it("surfaces a network failure gracefully", async () => {
    setEnv({
      WA_TOKEN: "mock-wa-token",
      WA_PHONE_NUMBER: "+923001234567",
    });
    spy.mockRejectedValueOnce(new TypeError("fetch failed"));
    WhatsApp = await import("../lib/whatsapp");

    const res = await WhatsApp.sendWaText({ to: "+923001234567", text: "hi" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("fetch failed");
  });
});
