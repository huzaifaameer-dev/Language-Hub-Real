import { cn } from "@/lib/utils";
import { newsRoleLabel, type NewsRole } from "@/lib/news-roles";

/** Small editorial badge showing who authored a news post (role-based). */
export function NewsRoleBadge({
  role,
  author,
  className,
}: {
  role?: NewsRole | null;
  author?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.12em]",
        badgeFor(role),
        className
      )}
    >
      {newsRoleLabel(role)}
      {author ? <span className="font-normal normal-case tracking-normal opacity-70">· {author}</span> : null}
    </span>
  );
}

function badgeFor(role?: NewsRole | null): string {
  switch (role) {
    case "ceo":
      return "border-gold/40 bg-gold/[0.08] text-gold-deep";
    case "founder":
      return "border-brand-magenta/40 bg-brand-magenta/[0.08] text-brand-magenta";
    case "developer":
      return "border-brand-cyan/40 bg-brand-cyan/[0.08] text-brand-cyan";
    case "manager":
      return "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-700";
    case "ambassador":
      return "border-pink-500/40 bg-pink-500/[0.08] text-pink-600";
    case "teacher":
    default:
      return "border-brand/40 bg-brand/[0.08] text-brand-deep";
  }
}