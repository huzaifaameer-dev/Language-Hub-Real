import { Logo } from "@/components/ui/Logo";

/* Rendered while the (database-driven) admin panel server component streams —
 * gives instant paint during the MongoDB round-trip instead of a blank page. */
export default function AdminPanelLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f4fb] px-6">
      <div className="w-full max-w-sm animate-pulse">
        <div className="flex items-center justify-center gap-3">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            <Logo size="xs" eager className="h-8 w-8 rounded-lg object-contain" />
          </span>
          <div>
            <p className="font-display text-[0.95rem] font-extrabold tracking-[0.04em] text-slate-900">
              LH<span className="indigo-text-shimmer">·OPS</span>
            </p>
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-slate-500">
              loading admin suite…
            </p>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-3.5 rounded-full bg-slate-200/90" />
          <div className="h-3.5 w-3/4 rounded-full bg-slate-200/90" />
          <div className="h-3.5 w-1/2 rounded-full bg-slate-200/70" />
        </div>
      </div>
    </div>
  );
}