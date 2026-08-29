"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface OAuthButtonsProps {
  callbackUrl?: string;
}

const PROVIDERS: {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}[] = [
  {
    id: "google",
    name: "Google",
    icon: "G",
    enabled: !!process.env.NEXT_PUBLIC_GOOGLE_ENABLED || false,
  },
  {
    id: "microsoft-entra-id",
    name: "Microsoft",
    icon: "M",
    enabled: !!process.env.NEXT_PUBLIC_MICROSOFT_ENABLED || false,
  },
  {
    id: "github",
    name: "GitHub",
    icon: "GH",
    enabled: !!process.env.NEXT_PUBLIC_GITHUB_ENABLED || false,
  },
];

export function OAuthButtons({ callbackUrl = "/dashboard" }: OAuthButtonsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const configured = PROVIDERS.filter((p) => p.enabled);

  if (configured.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink-3">
          or continue with
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {configured.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!!busy}
            onClick={() => {
              setBusy(p.id);
              signIn(p.id, { callbackUrl });
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-white font-display text-[0.85rem] font-bold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-3/50 hover:shadow-card disabled:opacity-50"
          >
            {busy === p.id ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-brand" />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-ink font-black text-[0.62rem] text-ivory"
              >
                {p.icon}
              </span>
            )}
            <span className="hidden sm:inline">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}