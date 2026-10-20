import { FALLBACK_COURSES, formatPKR, type CourseInfo } from "@/lib/course-data";

export const ACADEMY = {
  name: "Language Hub",
  tagline: "Hub of Language Excellence",
  founder: "Javaria Malik",
  foundedByLabel: "Founded by",
};

/**
 * Single source of truth for the headline learner count. The hero trust badge,
 * the numbers section and the proof bar all read from here, so the site can
 * never advertise two different figures at the same time.
 */
export const LEARNERS_GUIDED = 1000;

export const OPENING_HOURS = {
  from: "9:00",
  to: "6:00",
  label: "9:00 AM — 6:00 PM",
  daysLabel: "Monday to Saturday",
  isoFrom: "09:00",
  isoTo: "18:00",
  daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  openFromHour: 9,
  openToHour: 18,
  note: "Sessions run in this window, every working day.",
} as const;

export interface AcademyContact {
  whatsapp: string;
  whatsappHref: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  mapUrl: string;
}

const DIGITS_ONLY = (v: string) => v.replace(/[^\d]/g, "");

export const CONTACT: AcademyContact = {
  whatsapp: DIGITS_ONLY(process.env.NEXT_PUBLIC_ACADEMY_WHATSAPP ?? ""),
  whatsappHref: `https://wa.me/${DIGITS_ONLY(process.env.NEXT_PUBLIC_ACADEMY_WHATSAPP ?? "")}`,
  phone: (process.env.NEXT_PUBLIC_ACADEMY_PHONE ?? "").trim(),
  email: (process.env.NEXT_PUBLIC_ACADEMY_EMAIL ?? process.env.ACADEMY_EMAIL ?? "").trim(),
  address: (process.env.NEXT_PUBLIC_ACADEMY_ADDRESS ?? "").trim(),
  city: (process.env.NEXT_PUBLIC_ACADEMY_CITY ?? "Islamabad").trim(),
  mapUrl: (process.env.NEXT_PUBLIC_ACADEMY_MAP ?? "").trim(),
};

export const COURSE_ACCENTS = ["#2E5BFF", "#6D4AFF", "#0E9384", "#D98A0B"] as const;

export interface CourseCard {
  info: CourseInfo;
  accent: string;
  feeLabel: string;
  href: string;
  batchSummary: string;
}

export const COURSE_CARDS: CourseCard[] = FALLBACK_COURSES.map((info, i) => ({
  info,
  accent: COURSE_ACCENTS[i % COURSE_ACCENTS.length],
  feeLabel: formatPKR(info.fee),
  href: "/signup",
  batchSummary: info.batches.map((b) => b.name).join(" · "),
}));

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  outcome: string;
  course: string;
  /** Optional student avatar (auto-shown in the homepage avatar strip). */
  image?: string | null;
}

// Default testimonials removed — reviews now come exclusively from the
// database (admin panel), so admin deletions are permanent and the site only
// shows real student feedback. Keep empty to avoid any fallback seeding.
export const TESTIMONIALS: Testimonial[] = [];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "Do sessions run online or on-campus?",
    a: "Language Hub is an online institute — classes run live over video with real conversation practice, so you can join from anywhere.",
  },
  {
    q: "Is there a demo class before joining?",
    a: "Yes. You can book a free demo call to meet your teacher, see how a session runs, and decide if it fits before enrolling.",
  },
  {
    q: "Which courses and batches are available?",
    a: "Spoken English, IELTS, PTE and Duolingo English Test. Each course lists its own weeks, schedule and batch timings (morning / evening / weekend).",
  },
  {
    q: "How do fees and payment work?",
    a: "Every course shows its monthly fee in the pricing section. Enrollment is confirmed through the online application, then our team follows up with you personally.",
  },
  {
    q: "How fast is the application reviewed?",
    a: "Applications are reviewed within 12 hours and you can track the status live in your dashboard once you sign in.",
  },
  {
    q: "Are books and material included?",
    a: "Yes — enrolled students are assigned the books for their subjects in the dashboard, core first.",
  },
];

/** Per-course FAQ (highlighted by name) — used for FAQPage schema on course pages. */
export const COURSE_FAQS: Record<string, Faq[]> = {
  "Spoken English": [
    { q: "How long does it take to become fluent in speaking?", a: "Most students feel a real difference within 4–8 weeks of regular conversation practice. The 2-month course takes you from first words to fluent, flowing speech." },
    { q: "I can read and write English but freeze when speaking — can this course help?", a: "Yes. Spoken English at Language Hub is built specifically to break that freeze — you practise speaking in every single session in a small batch where nobody can hide." },
    { q: "Are the classes live?", a: "Yes, all classes are live over video with real conversation, roleplay and pronunciation practice. All classes are live — nothing is pre-recorded." },
    { q: "How big are the batches?", a: "Batches are small (10–20 students) so everyone gets speaking time and personal attention every session." },
  ],
  "IELTS General & Academic": [
    { q: "What score can I realistically aim for?", a: "With consistent practice most students improve by 0.5–1.0 bands. We focus on understanding exactly how the band descriptors are applied so you can target the highest achievable bands." },
    { q: "How are mock tests done?", a: "You get weekly full mock tests with examiner-style feedback, especially one-on-one speaking reviews that many students say are the most valuable part." },
    { q: "How long is the IELTS course?", a: "The structured prep runs for 2 months across Listening, Reading, Writing and Speaking with mock tests and score-review sessions." },
    { q: "Do you help with both Academic and General Training?", a: "Yes, the syllabus covers both IELTS General and Academic so you can prepare for whichever test you need." },
  ],
  "PTE · GRE · Duolingo": [
    { q: "What makes PTE different from IELTS?", a: "PTE is a fully computer-based, AI-scored test. At Language Hub we train you to master the exact question types and time limits so test day feels routine." },
    { q: "Can I prepare for GRE and Duolingo in the same course?", a: "Yes — this 1-month programme covers PTE Academic, GRE and the Duolingo English Test with question-type mastery and AI-scored mocks across all three." },
    { q: "How are scores tracked?", a: "You get AI-scored practice mocks with detailed breakdowns, so you always know which question types to focus on next." },
    { q: "How long do I need to prepare?", a: "The 1-month intensive is designed to take you from your baseline to a confident target score, with timed drills and mock tests throughout." },
  ],
  "Writing & Communication": [
    { q: "Who is this course for?", a: "Anyone who writes at work — professionals, students and creatives. It covers business emails, reports, professional writing and creative storytelling." },
    { q: "Will I get feedback on my writing?", a: "Yes. Peer review workshops and direct feedback on emails, reports and creative pieces are core parts of the 1-month programme." },
    { q: "What will I be able to write at the end?", a: "Clear professional emails and reports, persuasive business messages, and a personal creative writing portfolio you can share." },
  ],
};

export const FOUNDER = {
  name: ACADEMY.founder,
  role: "Head of Language Hub",
  headline: "Javaria Malik",
  image: "/ceo.jpg?v=4",
  quote:
    "Teaching is not only about giving knowledge. It is about helping someone discover what they are capable of becoming.",
  bio: [
    "Javaria Malik founded Language Hub on one belief: that English is a living skill, not a textbook subject.",
    "As Head of Language Hub, she leads every session with the conviction that learners are people with something real to say — because fluency lives where confidence and communication meet.",
  ],
  credentials: ["English Language Specialist", "IELTS · PTE Coach", "Conversation-first method"],
};

export const COURSE_FEATURES: Record<string, string[]> = {
  "Spoken English": ["Live speaking sessions", "Pronunciation drills", "Daily practice prompts", "Weekly progress check"],
  "IELTS General & Academic": ["Structured 4-skill syllabus", "Weekly mock tests", "Band-score tracking", "Speaking one-on-ones"],
  "PTE · GRE · Duolingo": ["Multi-test question practice", "AI-scored mock tests", "Timed response drills", "Score-boost strategy"],
  "Writing & Communication": ["Business writing basics", "Creative storytelling", "Portfolio building", "Peer review workshops"],
};

export function isOpenNow(): boolean {
  const h = new Date().getHours();
  return h >= OPENING_HOURS.openFromHour && h < OPENING_HOURS.openToHour;
}

/** WhatsApp deep link with a prefilled message. Empty string when unconfigured. */
export function whatsappLink(message?: string): string {
  if (!CONTACT.whatsapp) return "";
  const bare = `https://wa.me/${CONTACT.whatsapp}`;
  return message ? `${bare}?text=${encodeURIComponent(message)}` : bare;
}

/**
 * The address legal pages should actually publish.
 *
 * These pages are public and indexable, so printing an invented fallback
 * ("support@example.com") would advertise an address that can never receive
 * mail. When no address is configured we return null and the caller links to the
 * support section instead of publishing something undeliverable.
 */
export function legalContactEmail(): string | null {
  return CONTACT.email.length > 0 ? CONTACT.email : null;
}