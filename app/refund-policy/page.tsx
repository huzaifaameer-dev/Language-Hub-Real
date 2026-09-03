import type { Metadata } from "next";
import { CONTACT } from "@/lib/content";
import { appBaseUrl } from "@/lib/base-url";
import { LegalShell } from "@/components/legal/LegalShell";

const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  title: "Refund Policy | Language Hub",
  description:
    "Language Hub's policy on refunds and cancellations for course fees paid online or by bank transfer.",
  alternates: { canonical: `${baseUrl}/refund-policy` },
};

const email = CONTACT.email || "support@languagehub.example";

export default function RefundPolicyPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Refund & Cancellation Policy"
      updated="2 September 2026"
      intro="We want you to feel confident about enrolling. Here's how refunds and cancellations work."
      sections={[
        {
          heading: "Before your batch starts",
          body: (
            <p>
              If you cancel at least <b>7 days before</b> your batch&apos;s first class,
              you may request a <b>full refund</b> of fees paid. Requests made
              between 7 days and the start date are refunded <b>50%</b>.
            </p>
          ),
        },
        {
          heading: "After your batch starts",
          body: (
            <p>
              Once a batch has begun, fees are generally non-refundable. If you need
              to step away for a documented medical or family emergency, we&apos;ll work
              with you — you may pause and resume in a later batch at no extra cost,
              or receive a pro-rated refund at our discretion.
            </p>
          ),
        },
        {
          heading: "How to request a refund",
          body: (
            <ol className="ml-5 list-decimal space-y-1.5">
              <li>Email {email} with your name, enrolled batch, and reason.</li>
              <li>Include your payment reference (Stripe session / transaction ID / screenshot).</li>
              <li>We respond within 3 working days.</li>
            </ol>
          ),
        },
        {
          heading: "How refunds are paid",
          body: (
            <p>
              Online card payments are refunded back to the original card through
              Stripe (typically 5–10 working days). Manual payments are refunded by
              bank transfer or JazzCash/EasyPaisa, whichever you used, within 10
              working days of approval.
            </p>
          ),
        },
        {
          heading: "Non-refundable fees",
          body: (
            <p>
              Application/processing steps are free — you are never charged to
              apply. Exam bookings with external bodies are outside our control and
              follow that body&apos;s own refund rules.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Refund questions:{" "}
              <a className="text-brand-deep underline" href={`mailto:${email}`}>{email}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}