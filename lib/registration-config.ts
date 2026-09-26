import { FALLBACK_COURSES, formatPKR } from "@/lib/course-data";

/** Registration lifecycle statuses tracked by the admin panel. */
export const REGISTRATION_STATUSES = ["NEW", "CONTACTED", "ENROLLED"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

/** Admin inbox that receives a generated PDF for every course registration. */
export const REGISTRATION_NOTIFY_EMAIL =
  process.env.REGISTRATION_NOTIFY_EMAIL ?? "huzaifa.ameer.2009@gmail.com";

/** Shared payment-method choices shown in the fee step of every course. */
export const PAYMENT_METHODS = ["Bank Account", "Easypaisa", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Institute accounts a student must pay into. Kept here (single source of
 * truth) so the wizard, the PDF and the admin panel always show the same,
 * correct numbers.
 */
export const PAYMENT_ACCOUNTS = {
  easypaisa: {
    label: "Easypaisa",
    rows: [
      { label: "Easypaisa account no.", value: "0317-9627809" },
      { label: "Account title", value: "Language Hub (Ms. Javaria Malik)" },
    ],
  },
  bank: {
    label: "Soneri Bank",
    rows: [
      { label: "Bank", value: "Soneri Bank Limited" },
      { label: "Account no.", value: "20013740071" },
      { label: "IBAN", value: "PK91SONE0042420013740071" },
      { label: "Account title", value: "Language Hub (Ms. Javaria Malik)" },
    ],
  },
} as const;

export interface RegistrationOption {
  value: string;
  label: string;
}

export interface RegistrationCourseConfig {
  /** Stable identifier used in URLs / the registrations collection. */
  key: string;
  /** Exact catalogue course name used for fee lookup (fallback catalog). */
  catalogName: string;
  /** Public display name of the programme. */
  name: string;
  /** Short label for chips and compact views. */
  shortName: string;
  tagline: string;
  description: string;
  /** Total programme fee incl. registration in PKR. */
  fee: number;
  duration: string;
  /** Premium gradient used across cards / the wizard header. */
  accent: { from: string; to: string };
  /** Course-specific "which module to enhance" question. */
  focusQuestion: string;
  focusOptions: RegistrationOption[];
  /** Optional single course-specific question shown in the study step. */
  extraQuestion?: { title: string; options: RegistrationOption[] } | null;
  preferredTimeOptions: RegistrationOption[];
  levelOptions: RegistrationOption[];
  hoursOptions: RegistrationOption[];
  heardOptions: RegistrationOption[];
}

const LEVEL_OPTIONS: RegistrationOption[] = [
  { value: "below-average", label: "Below than average" },
  { value: "average", label: "Average" },
  { value: "good-enough", label: "Good enough" },
  { value: "basic", label: "Basic" },
];

const HOURS_OPTIONS: RegistrationOption[] = [
  { value: "3-5", label: "3 – 5 hours" },
  { value: "6-10", label: "6 – 10 hours" },
  { value: "11-15", label: "11 – 15 hours" },
  { value: "16-plus", label: "16+ hours" },
];

const TIME_OPTIONS: RegistrationOption[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

const HEARD_OPTIONS: RegistrationOption[] = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "alumni", label: "Alumni of Language Hub" },
  { value: "friends", label: "Friends and colleagues" },
  { value: "other", label: "Other" },
];

function feeFor(catalogName: string, fallback: number): number {
  const info = FALLBACK_COURSES.find((c) => c.name === catalogName);
  return info?.fee ?? fallback;
}

export const REGISTRATION_COURSES: RegistrationCourseConfig[] = [
  {
    key: "ielts",
    catalogName: "IELTS General & Academic",
    name: "IELTS Exam Preparation",
    shortName: "IELTS",
    tagline: "A band score you can bank on.",
    description:
      "Structured prep for IELTS Academic and General Training across Listening, Reading, Writing and Speaking — with weekly mocks and examiner-style feedback.",
    fee: feeFor("IELTS General & Academic", 42000),
    duration: "2 months",
    accent: { from: "#2563EB", to: "#6D4AFF" },
    focusQuestion: "Which IELTS module do you want to enhance the most?",
    focusOptions: [
      { value: "listening", label: "Listening" },
      { value: "reading", label: "Reading" },
      { value: "writing", label: "Writing" },
      { value: "speaking", label: "Speaking" },
    ],
    extraQuestion: {
      title: "Which test are you preparing for?",
      options: [
        { value: "academic", label: "IELTS Academic" },
        { value: "general", label: "IELTS General Training" },
      ],
    },
    preferredTimeOptions: TIME_OPTIONS,
    levelOptions: LEVEL_OPTIONS,
    hoursOptions: HOURS_OPTIONS,
    heardOptions: HEARD_OPTIONS,
  },
  {
    key: "pte",
    catalogName: "PTE · GRE · Duolingo",
    name: "PTE · GRE · Duolingo Preparation",
    shortName: "PTE",
    tagline: "One training, three test paths.",
    description:
      "Computer-first training across PTE Academic, GRE and Duolingo: question-type mastery, time management and AI-scored practice for a confident test day.",
    fee: feeFor("PTE · GRE · Duolingo", 37000),
    duration: "1 month",
    accent: { from: "#0891B2", to: "#2563EB" },
    focusQuestion: "Which section do you want to enhance the most?",
    focusOptions: [
      { value: "speaking", label: "Speaking" },
      { value: "writing", label: "Writing" },
      { value: "reading", label: "Reading" },
      { value: "listening", label: "Listening" },
    ],
    extraQuestion: {
      title: "Which test are you preparing for?",
      options: [
        { value: "pte", label: "PTE Academic" },
        { value: "duolingo", label: "Duolingo English Test" },
        { value: "gre", label: "GRE" },
      ],
    },
    preferredTimeOptions: TIME_OPTIONS,
    levelOptions: LEVEL_OPTIONS,
    hoursOptions: HOURS_OPTIONS,
    heardOptions: HEARD_OPTIONS,
  },
  {
    key: "spoken-english",
    catalogName: "Spoken English",
    name: "Spoken English",
    shortName: "Spoken English",
    tagline: "Fluency that sounds like you.",
    description:
      "Guided conversation, pronunciation drills and roleplay that take you from hesitant first words to confident, flowing speech in real situations.",
    fee: feeFor("Spoken English", 22000),
    duration: "2 months",
    accent: { from: "#0EA5E9", to: "#14B8A6" },
    focusQuestion: "Which skill do you want to enhance the most?",
    focusOptions: [
      { value: "pronunciation", label: "Pronunciation" },
      { value: "fluency", label: "Fluency" },
      { value: "vocabulary", label: "Vocabulary" },
      { value: "grammar", label: "Grammar" },
      { value: "confidence", label: "Confidence" },
    ],
    extraQuestion: {
      title: "What is your main goal?",
      options: [
        { value: "conversation", label: "Everyday conversation" },
        { value: "interviews", label: "Job interviews" },
        { value: "public-speaking", label: "Public speaking" },
        { value: "study-travel", label: "Study & travel" },
      ],
    },
    preferredTimeOptions: TIME_OPTIONS,
    levelOptions: LEVEL_OPTIONS,
    hoursOptions: HOURS_OPTIONS,
    heardOptions: HEARD_OPTIONS,
  },
  {
    key: "creative-writing",
    catalogName: "Writing & Communication",
    name: "Creative Writing",
    shortName: "Creative Writing",
    tagline: "Write clearly. Sound professional.",
    description:
      "Creative writing, professional writing and communication skills in one programme — featuring stories, poetry, business writing and a portfolio you can share.",
    fee: feeFor("Writing & Communication", 27000),
    duration: "1 month",
    accent: { from: "#D63A8C", to: "#7C3AED" },
    focusQuestion: "Which form do you want to enhance the most?",
    focusOptions: [
      { value: "stories", label: "Short Stories" },
      { value: "poetry", label: "Poetry" },
      { value: "essays", label: "Essays" },
      { value: "scripts", label: "Script Writing" },
      { value: "blogging", label: "Blogging" },
    ],
    extraQuestion: {
      title: "Which genre or format excites you most?",
      options: [
        { value: "fiction", label: "Fiction" },
        { value: "non-fiction", label: "Non-fiction" },
        { value: "business", label: "Business / professional" },
        { value: "academic", label: "Academic writing" },
      ],
    },
    preferredTimeOptions: TIME_OPTIONS,
    levelOptions: LEVEL_OPTIONS,
    hoursOptions: HOURS_OPTIONS,
    heardOptions: HEARD_OPTIONS,
  },
];

export const REGISTRATION_COURSES_BY_KEY: Record<string, RegistrationCourseConfig> =
  Object.fromEntries(REGISTRATION_COURSES.map((c) => [c.key, c]));

export const REGISTRATION_COURSE_KEYS = REGISTRATION_COURSES.map((c) => c.key);

export function isRegistrationCourseKey(key: string): boolean {
  return key in REGISTRATION_COURSES_BY_KEY;
}

/** Map a catalogue course name (e.g. "IELTS General & Academic") to its
 *  registration key (e.g. "ielts"). Returns undefined for non-registrable
 *  programmes. */
export function registrationKeyForCatalogName(
  catalogName: string
): string | undefined {
  return REGISTRATION_COURSES.find((c) => c.catalogName === catalogName)?.key;
}

/** e.g. "Rs 42,000 · 2 months" compact label for cards. */
export function registrationFeeLabel(course: RegistrationCourseConfig): string {
  return `${formatPKR(course.fee)}`;
}

/** Full sentence the student sees next to the fee. */
export function registrationFeeNote(course: RegistrationCourseConfig): string {
  return `Total programme fee ${formatPKR(course.fee)} (includes Rs 2,000 one-time registration).`;
}

export function optionLabel(options: RegistrationOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function optionLabels(options: RegistrationOption[], values: string[]): string[] {
  return values.map((v) => optionLabel(options, v));
}

/**
 * Human-friendly, unique registration reference, e.g. LH-20260919-K2M9QX.
 * Collision-safe enough for display purposes; the DB enforces uniqueness.
 */
export function makeRegistrationRef(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LH-${ymd}-${rand}`;
}