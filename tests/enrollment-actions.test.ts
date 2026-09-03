import { describe, expect, it } from "vitest";

import {
  actionToStatus,
  emailSubjectFor,
  notificationFor,
  requiresSeatCheck,
  type EnrollmentAction,
} from "../lib/enrollment-actions";

const ACTIONS: EnrollmentAction[] = ["REQUEST_PAYMENT", "CONFIRM", "REJECT"];

describe("enrollment action -> status transitions", () => {
  it("maps each decision to the correct settlement status", () => {
    expect(actionToStatus("REQUEST_PAYMENT")).toBe("AWAITING_PAYMENT");
    expect(actionToStatus("CONFIRM")).toBe("ENROLLED");
    expect(actionToStatus("REJECT")).toBe("REJECTED");
  });

  it("covers every action without throwing", () => {
    for (const a of ACTIONS) {
      expect(actionToStatus(a)).toBeTruthy();
    }
  });
});

describe("enrollment notification copy", () => {
  it("uses payment instructions in the request-payment body", () => {
    const copy = notificationFor("REQUEST_PAYMENT", "Send Rs 8000 via EasyPaisa");
    expect(copy.title).toContain("payment");
    expect(copy.body).toContain("EasyPaisa");
  });

  it("falls back to a default request-payment body", () => {
    const copy = notificationFor("REQUEST_PAYMENT", "", "");
    expect(copy.body).toContain("dashboard");
  });

  it("confirms enrollment with a locked-in message", () => {
    const copy = notificationFor("CONFIRM");
    expect(copy.title).toBe("Enrollment confirmed");
    expect(copy.body).toContain("locked in");
  });

  it("uses the admin message in a rejection body", () => {
    const copy = notificationFor("REJECT", undefined, "Incomplete documents");
    expect(copy.title).toContain("declined");
    expect(copy.body).toContain("Incomplete documents");
  });
});

describe("enrollment email subjects", () => {
  it("returns a distinct, sensible subject per action", () => {
    const subjects = ACTIONS.map((a) => emailSubjectFor(a));
    expect(new Set(subjects).size).toBe(3);
    expect(subjects[ACTIONS.indexOf("CONFIRM")]).toContain("confirmed");
  });
});

describe("enrollment seat-check gating", () => {
  it("only CONFIRM requires the batch seat check", () => {
    expect(requiresSeatCheck("CONFIRM")).toBe(true);
    expect(requiresSeatCheck("REQUEST_PAYMENT")).toBe(false);
    expect(requiresSeatCheck("REJECT")).toBe(false);
  });
});
