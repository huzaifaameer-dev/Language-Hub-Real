/**
 * Pure business logic for the enrollment decision endpoints.
 *
 * Extracted from `app/api/admin/enrollments/route.ts` so the status
 * transitions, notification copy and email subjects are unit-testable without
 * a database or network. The API route composes these functions with its DB
 * work.
 */

export type EnrollmentAction = "REQUEST_PAYMENT" | "CONFIRM" | "REJECT";

export type EnrollmentStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PROOF_SUBMITTED"
  | "ENROLLED"
  | "REJECTED";

/** Map a decision action to the target enrollment status. */
export function actionToStatus(action: EnrollmentAction): EnrollmentStatus {
  switch (action) {
    case "REQUEST_PAYMENT":
      return "AWAITING_PAYMENT";
    case "CONFIRM":
      return "ENROLLED";
    case "REJECT":
      return "REJECTED";
  }
}

export interface NotifyCopy {
  title: string;
  body: string;
}

/** User-facing notification copy for each decision action. */
export function notificationFor(
  action: EnrollmentAction,
  paymentInstructions?: string,
  message?: string
): NotifyCopy {
  switch (action) {
    case "REQUEST_PAYMENT":
      return {
        title: "Complete your payment to enroll",
        body:
          paymentInstructions ||
          "We asked you to complete your payment. Check your dashboard for details.",
      };
    case "CONFIRM":
      return {
        title: "Enrollment confirmed",
        body: "Your seat is locked in. Your bookshelf is ready.",
      };
    case "REJECT":
      return {
        title: "Enrollment request declined",
        body: message || "Your enrollment request was declined.",
      };
  }
}

/** Email subject line for a decision email. */
export function emailSubjectFor(action: EnrollmentAction): string {
  switch (action) {
    case "CONFIRM":
      return "Your enrollment is confirmed";
    case "REQUEST_PAYMENT":
      return "Action needed: complete your payment";
    case "REJECT":
      return "Your enrollment request was declined";
  }
}

/** Whether a decision requires the batch seat-check gate. */
export function requiresSeatCheck(action: EnrollmentAction): boolean {
  return action === "CONFIRM";
}
