export interface CourseBatch {
  name: string;
  time: string;
  seatsTotal: number;
  /** Live seat usage, set by the API response (absent in static seed data). */
  seatsUsed?: number;
  seatsLeft?: number;
  full?: boolean;
}

export interface CourseInfo {
  name: string;
  tagline: string;
  description: string;
  /** Monthly fee in PKR. */
  fee: number;
  currency: "PKR";
  duration: string;
  teacher: string;
  schedule: string;
  batches: CourseBatch[];
  order: number;
  active: boolean;
  /** Aggregate seat counts, set by the API response. */
  seatsTotal?: number;
  seatsUsed?: number;
  seatsLeft?: number;
}

export function formatPKR(n: number): string {
  const v = Math.max(0, Math.round(n));
  return `Rs\u00A0${v.toLocaleString("en-PK")}`;
}

/**
 * Seed / offline fallback catalog. The DB (`courses` collection) is the source
 * of truth once seeded; the UI falls back to this list when the API is down so
 * forms never render empty.
 */
export const FALLBACK_COURSES: CourseInfo[] = [
  {
    name: "Spoken English",
    tagline: "Fluency that sounds like you.",
    description:
      "Build everyday speaking confidence through guided conversation, pronunciation drills and roleplay — from first words to fluent flow.",
    fee: 8000,
    currency: "PKR",
    duration: "4 months",
    teacher: "Javeria Malik",
    schedule: "Mon · Wed · Fri",
    batches: [
      { name: "Morning", time: "9:00 AM – 11:00 AM", seatsTotal: 16 },
      { name: "Evening", time: "6:00 PM – 8:00 PM", seatsTotal: 20 },
    ],
    order: 1,
    active: true,
  },
  {
    name: "IELTS Preparation",
    tagline: "A band score you can bank on.",
    description:
      "Structured prep across Listening, Reading, Writing and Speaking with mock tests, examiner-style feedback and score-review sessions.",
    fee: 12000,
    currency: "PKR",
    duration: "3 months",
    teacher: "Javeria Malik",
    schedule: "Tue · Thu · Sat",
    batches: [
      { name: "Morning", time: "10:00 AM – 12:00 PM", seatsTotal: 12 },
      { name: "Weekend", time: "2:00 PM – 5:00 PM", seatsTotal: 14 },
    ],
    order: 2,
    active: true,
  },
  {
    name: "PTE Preparation",
    tagline: "Same score, less stress.",
    description:
      "Computer-first PTE Academic training: question-type mastery, time management and AI-scored practice so test day feels routine.",
    fee: 12000,
    currency: "PKR",
    duration: "3 months",
    teacher: "Javeria Malik",
    schedule: "Tue · Thu · Sat",
    batches: [
      { name: "Evening", time: "7:00 PM – 9:00 PM", seatsTotal: 12 },
      { name: "Weekend", time: "5:00 PM – 8:00 PM", seatsTotal: 14 },
    ],
    order: 3,
    active: true,
  },
  {
    name: "Duolingo English Test",
    tagline: "Online-first. Fast-tracked.",
    description:
      "A focused sprint for the DET: pattern drills, adaptive mock tests and writing/speaking feedback to lift your score fast.",
    fee: 6000,
    currency: "PKR",
    duration: "6 weeks",
    teacher: "Javeria Malik",
    schedule: "Mon · Wed · Fri",
    batches: [
      { name: "Afternoon", time: "1:00 PM – 3:00 PM", seatsTotal: 10 },
      { name: "Evening", time: "8:00 PM – 10:00 PM", seatsTotal: 24 },
    ],
    order: 4,
    active: true,
  },
];

export const FALLBACK_COURSE_NAMES = FALLBACK_COURSES.map((c) => c.name);

export const FALLBACK_BATCHES = Array.from(
  new Set(FALLBACK_COURSES.flatMap((c) => c.batches.map((b) => b.name)))
);