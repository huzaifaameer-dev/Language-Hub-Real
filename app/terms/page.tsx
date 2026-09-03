import type { Metadata } from "next";
import { CONTACT } from "@/lib/content";
import { appBaseUrl } from "@/lib/base-url";
import { LegalShell } from "@/components/legal/LegalShell";

const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  title: "Terms of Service | Language Hub",
  description:
    "The terms governing your use of the Language Hub website, application process, classes, and payments.",
  alternates: { canonical: `${baseUrl}/terms` },
};

const email = CONTACT.email || "support@languagehub.example";

export default function TermsPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Terms of Service"
      updated="2 September 2026"
      intro="By using Language Hub's website, applying for a programme, or enrolling in a class, you agree to these terms."
      sections={[
        {
          heading: "The service",
          body: (
            <p>
              Language Hub provides English communication and test-preparation
              programmes (Spoken English, IELTS, PTE and Duolingo English Test).
              Programmes are delivered live in batches, with materials provided
              through your student dashboard.
            </p>
          ),
        },
        {
          heading: "Applications & enrollment",
          body: (
            <p>
              Submitting an application does not guarantee a seat. Seats are
              confirmed only once the academy approves your enrollment and your fee
              is received (online payment confirmed or manual payment proof
              verified). Batch availability is displayed live where shown.
            </p>
          ),
        },
        {
          heading: "Fees & payments",
          body: (
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Programme fees are displayed per month and payable in PKR.</li>
              <li>Online payments are processed securely by Stripe.</li>
              <li>Manual payments (EasyPaisa, JazzCash, bank transfer) require a receipt screenshot for confirmation.</li>
              <li>Your seat is locked only after payment is confirmed.</li>
            </ul>
          ),
        },
        {
          heading: "Your account",
          body: (
            <p>
              You are responsible for keeping your login safe and for the accuracy
              of the information you provide. One account belongs to one student.
            </p>
          ),
        },
        {
          heading: "Conduct",
          body: (
            <p>
              Be respectful in classes and group chats. Recording classes without
              permission, sharing materials commercially, or disrupting sessions may
              result in removal from a batch without refund.
            </p>
          ),
        },
        {
          heading: "No guarantees",
          body: (
            <p>
              We provide coaching and practice; results such as test scores depend on
              your own effort and assessment conditions. We do not guarantee specific
              scores or outcomes, and we never facilitate exam malpractice.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              For questions about these terms, email{" "}
              <a className="text-brand-deep underline" href={`mailto:${email}`}>{email}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}