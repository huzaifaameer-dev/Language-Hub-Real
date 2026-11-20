"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface OAuthButtonsProps {
  callbackUrl?: string;
}

// Parse a flag strictly: "false"/"0"/"" must disable the button (previously any
// non-empty string — including the string "false" — enabled it).
const flagOn = (v: string | undefined): boolean => {
  if (!v) return false;
  return !["false", "0", "no", "off"].includes(v.trim().toLowerCase());
};

const PROVIDERS: {
  id: string;
  name: string;
  enabled: boolean;
}[] = [
  {
    id: "google",
    name: "Google",
    enabled: flagOn(process.env.NEXT_PUBLIC_GOOGLE_ENABLED),
  },
  {
    id: "microsoft-entra-id",
    name: "Microsoft",
    enabled: flagOn(process.env.NEXT_PUBLIC_MICROSOFT_ENABLED),
  },
  {
    id: "github",
    name: "GitHub",
    enabled: flagOn(process.env.NEXT_PUBLIC_GITHUB_ENABLED),
  },
];

function ProviderIcon({ id }: { id: string }) {
  if (id === "google") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem]">
        <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.3 3.8l3.6 2.8c2.1-2 3.7-4.9 3.7-8.5z" />
        <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.6-2.8c-1 .7-2.3 1.2-4 1.2-3.1 0-5.7-2-6.6-4.9l-3.7 2.9C3.6 21.3 7.5 24 12 24z" />
        <path fill="#FBBC05" d="M5.4 14.7c-.2-.7-.4-1.5-.4-2.7s.1-1.9.4-2.7L1.7 6.4C.6 8.1 0 10 0 12s.6 3.9 1.7 5.6l3.7-2.9z" />
        <path fill="#EA4335" d="M12 4.8c2.2 0 3.7.9 4.6 1.7l3.2-3.1C17.7 1.6 15.1.5 12 .5 7.5.5 3.6 3.2 1.7 6.4l3.7 2.9C6.3 6.7 8.9 4.8 12 4.8z" />
      </svg>
    );
  }
  if (id === "github") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-[1.2rem] w-[1.2rem] fill-[#10231f]">
        <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem]">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

export function OAuthButtons({ callbackUrl = "/dashboard" }: OAuthButtonsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const configured = PROVIDERS.filter((p) => p.enabled);

  if (configured.length === 0) return null;

  return (
    <>
      <div className="my-1 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-[#e3ede9]" />
        <span className="font-sans text-[0.78rem] text-[#8ba19b]">or</span>
        <span className="h-px flex-1 bg-[#e3ede9]" />
      </div>
      <div
        className={
          configured.length === 1
            ? "grid gap-3"
            : "grid gap-3 sm:grid-cols-2"
        }
      >
        {configured.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!!busy}
            onClick={() => {
              setBusy(p.id);
              signIn(p.id, { callbackUrl });
            }}
            className="flex h-[3.1rem] items-center justify-center gap-2.5 rounded-xl border border-[#e3ede9] bg-white font-display text-[0.86rem] font-semibold text-[#10231f] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cfe3da] hover:shadow-[0_12px_24px_-20px_rgba(13,71,60,0.6)] disabled:opacity-50"
          >
            {busy === p.id ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d5c4d]/20 border-t-[#0d5c4d]" />
            ) : (
              <ProviderIcon id={p.id} />
            )}
            Continue with {p.name}
          </button>
        ))}
      </div>
    </>
  );
}
