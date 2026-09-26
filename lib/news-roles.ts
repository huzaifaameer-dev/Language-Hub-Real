/** Author roles shown across the Daily News platform. */
export type NewsRole = "ceo" | "founder" | "teacher" | "developer" | "manager" | "ambassador";

export interface NewsRoleMeta {
  label: string;
  /** Tailwind badge classes (public surface). */
  badge: string;
  /** Accent hex used for inline chip styling. */
  tone: string;
}

export const NEWS_ROLES: Record<NewsRole, NewsRoleMeta> = {
  ceo: {
    label: "CEO",
    badge: "border-gold/40 bg-gold/[0.08] text-gold-deep",
    tone: "#d97706",
  },
  founder: {
    label: "Founder",
    badge: "border-brand-magenta/40 bg-brand-magenta/[0.08] text-brand-magenta",
    tone: "#8b5cf6",
  },
  teacher: {
    label: "Teacher",
    badge: "border-brand/40 bg-brand/[0.08] text-brand-deep",
    tone: "#4f46e5",
  },
  developer: {
    label: "Developer",
    badge: "border-brand-cyan/40 bg-brand-cyan/[0.08] text-brand-cyan",
    tone: "#0ea5e9",
  },
  manager: {
    label: "Manager",
    badge: "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-700",
    tone: "#059669",
  },
  ambassador: {
    label: "Ambassador",
    badge: "border-pink-500/40 bg-pink-500/[0.08] text-pink-600",
    tone: "#db2777",
  },
};

export const NEWS_ROLE_LIST = Object.keys(NEWS_ROLES) as NewsRole[];

export function newsRoleLabel(role?: NewsRole | null): string {
  if (!role) return "Teacher";
  return NEWS_ROLES[role]?.label ?? "Teacher";
}

export function newsRoleTone(role?: NewsRole | null): string {
  if (!role) return NEWS_ROLES.teacher.tone;
  return NEWS_ROLES[role]?.tone ?? NEWS_ROLES.teacher.tone;
}