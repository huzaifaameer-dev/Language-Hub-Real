import type { Metadata } from "next";
import { CONTACT } from "@/lib/content";
import { appBaseUrl } from "@/lib/base-url";
import { LegalShell } from "@/components/legal/LegalShell";

const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  title: "Privacy Policy | Language Hub",
  description:
    "How Language Hub collects, uses, and protects your personal data — including contact details, account records and payment information.",
  alternates: { canonical: `${baseUrl}/privacy` },
};

const email = CONTACT.email || "support@languagehub.example";
const city = CONTACT.city || "Islamabad";

export default function PrivacyPage() {
  return (
    <LegalShell
      kicker="Legal"
      title="Privacy Policy"
      updated="2 September 2026"
      intro={`This policy explains what data Language Hub collects when you use our website, student dashboard, and services, how it is used, and the choices you have.`}
      sections={[
        {
          heading: "What we collect",
          body: (
            <>
              <p>
                <b>When you sign up or apply</b> — name, email address, city, a short
                bio, and any message you include with your application.
              </p>
              <p>
                <b>When you enroll and pay</b> — chosen subjects, batch, payment
                method, and a payment receipt screenshot if you pay manually. If you
                pay online, your card details are handled by our payment processor
                (Stripe) and never touch our servers.
              </p>
              <p>
                <b>When you book a demo</b> — name, email, phone number and preferred
                date/time.
              </p>
              <p>
                <b>Automatically</b> — basic technical data such as anonymized client
                identity tokens used to keep rate limits fair (no personal
                identifiers are stored).
              </p>
            </>
          ),
        },
        {
          heading: "How we use your data",
          body: (
            <ul className="ml-5 list-disc space-y-1.5">
              <li>To process applications, enrollments and payments</li>
              <li>To contact you about your enrollment, batches or payment status</li>
              <li>To send you notifications about decisions on your application</li>
              <li>To keep the platform secure and abuse-free (rate limiting, abuse handling)</li>
              <li>To improve our courses — never to sell your data</li>
            </ul>
          ),
        },
        {
          heading: "Who we share it with",
          body: (
            <p>
              We only share data with the providers needed to run the service — our
              payment processor (Stripe) for online payments, and our email provider
              when we notify you. We never sell or rent personal data to anyone, and
              we never expose your payment proof or contact details publicly.
            </p>
          ),
        },
        {
          heading: "Storage & security",
          body: (
            <p>
              Data is stored in a password-protected database. Passwords are hashed
              with bcrypt (cost 12), admin sessions use signed cookies, payment
              screenshots live in a private directory that only you and the admin can
              view, and all API access is rate-limited and audited. Payment
              card data is never stored by us.
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can export everything we hold about you from your dashboard, change
              your profile and password at any time, and you may delete your account
              (which removes your personal records). Email us at {email} for any
              access, correction or deletion request.
            </p>
          ),
        },
        {
          heading: "Cookies",
          body: (
            <p>
              We use strictly necessary cookies for sign-in sessions and security
              (rate limiting). We do not use advertising or cross-site tracking
              cookies.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Data controller: Language Hub, {city}. Questions:{" "}
              <a className="text-brand-deep underline" href={`mailto:${email}`}>{email}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}