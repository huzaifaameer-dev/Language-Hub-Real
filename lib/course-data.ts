export interface CourseBatch {
  name: string;
  time: string;
  seatsTotal: number;
  /** Live seat usage, set by the API response (absent in static seed data). */
  seatsUsed?: number;
  seatsLeft?: number;
  full?: boolean;
}

export interface CourseModule {
  title: string;
  weeks: string;
  topics: string[];
  /** Optional lesson description for the sample lesson */
  sampleLesson?: string;
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
  /** Syllabus module breakdown */
  modules?: CourseModule[];
  /** YouTube embed URL for demo video */
  demoVideoUrl?: string;
  /** What students will learn — key outcomes */
  outcomes?: string[];
}

export function formatPKR(n: number): string {
  const v = Math.max(0, Math.round(n));
  return `Rs\u00A0${v.toLocaleString("en-PK")}`;
}

/** URL slug for a course name — /courses/:slug resolves through this. */
export function courseSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
    fee: 22000,
    currency: "PKR",
    duration: "2 months",
    teacher: "Javaria Malik",
    schedule: "Mon – Sat",
    batches: [
      { name: "Afternoon", time: "3:00 PM – 6:00 PM", seatsTotal: 16 },
      { name: "Evening", time: "6:00 PM – 9:00 PM", seatsTotal: 20 },
      { name: "Night", time: "9:00 PM – 12:00 AM", seatsTotal: 18 },
    ],
    order: 1,
    active: true,
    demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    outcomes: [
      "Hold everyday conversations without hesitation",
      "Pronounce words clearly and naturally",
      "Understand and use common idioms and phrases",
      "Express opinions confidently in group discussions",
    ],
    modules: [
      {
        title: "Foundations of Fluency",
        weeks: "Weeks 1–2",
        topics: [
          "Greeting & introductions",
          "Everyday vocabulary building",
          "Basic sentence structures",
          "Pronunciation fundamentals",
        ],
        sampleLesson: "In this opening module, you will learn to introduce yourself naturally, build your core vocabulary, and develop confident pronunciation habits.",
      },
      {
        title: "Building Confidence",
        weeks: "Weeks 3–4",
        topics: [
          "Describing routines and habits",
          "Asking and answering questions",
          "Common conversation scenarios",
          "Reducing translation habits",
        ],
      },
      {
        title: "Conversational Flow",
        weeks: "Weeks 5–6",
        topics: [
          "Expressing opinions and preferences",
          "Telling stories and anecdotes",
          "Handling disagreements politely",
          "Idiomatic expressions",
        ],
      },
      {
        title: "Advanced Speaking",
        weeks: "Weeks 7–8",
        topics: [
          "Group discussion skills",
          "Public speaking basics",
          "Formal vs informal registers",
          "Fluency under pressure",
        ],
      },
    ],
  },
  {
    name: "IELTS General & Academic",
    tagline: "A band score you can bank on.",
    description:
      "Structured prep for both IELTS General and Academic across Listening, Reading, Writing and Speaking with mock tests, examiner-style feedback and score-review sessions.",
    fee: 42000,
    currency: "PKR",
    duration: "2 months",
    teacher: "Javaria Malik",
    schedule: "Mon – Sat",
    batches: [
      { name: "Afternoon", time: "3:00 PM – 6:00 PM", seatsTotal: 12 },
      { name: "Evening", time: "6:00 PM – 9:00 PM", seatsTotal: 14 },
      { name: "Night", time: "9:00 PM – 12:00 AM", seatsTotal: 12 },
    ],
    order: 2,
    active: true,
    demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    outcomes: [
      "Understand all four IELTS modules inside out",
      "Score Band 6.5+ with consistent practice",
      "Manage time effectively under exam pressure",
      "Write structured essays and reports",
    ],
    modules: [
      {
        title: "IELTS Listening Mastery",
        weeks: "Weeks 1–2",
        topics: [
          "Section 1–2: Social conversations",
          "Section 3–4: Academic discussions",
          "Note-taking strategies",
          "Prediction and skimming techniques",
        ],
        sampleLesson: "Start with listening strategies that work for every section. Learn to predict answers before you hear them and take notes without losing context.",
      },
      {
        title: "Reading Strategies",
        weeks: "Weeks 3–4",
        topics: [
          "Skimming and scanning techniques",
          "True/False/Not Given questions",
          "Matching and summary completion",
          "Time management per passage",
        ],
      },
      {
        title: "Writing Task 1 & 2",
        weeks: "Weeks 5–6",
        topics: [
          "Graph and chart description",
          "Essay structure and coherence",
          "Academic vocabulary range",
          "Peer review and feedback sessions",
        ],
      },
      {
        title: "Speaking Test Prep",
        weeks: "Weeks 7–8",
        topics: [
          "Part 1: Introduction and interview",
          "Part 2: Long turn with cue card",
          "Part 3: Discussion and analysis",
          "Mock speaking tests with feedback",
        ],
      },
    ],
  },
  {
    name: "PTE · GRE · Duolingo",
    tagline: "One training, three test paths.",
    description:
      "Computer-first training covering PTE Academic, GRE and the Duolingo English Test: question-type mastery, time management and AI-scored practice so test day feels routine.",
    fee: 37000,
    currency: "PKR",
    duration: "1 month",
    teacher: "Javaria Malik",
    schedule: "Mon – Sat",
    batches: [
      { name: "Afternoon", time: "3:00 PM – 6:00 PM", seatsTotal: 12 },
      { name: "Evening", time: "6:00 PM – 9:00 PM", seatsTotal: 14 },
    ],
    order: 3,
    active: true,
    demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    outcomes: [
      "Master every question type across PTE, GRE and DET",
      "Score 65+ / 110+ with AI-scored practice",
      "Complete tasks within strict time limits",
      "Build academic vocabulary fast",
    ],
    modules: [
      {
        title: "Test Formats & Quick Wins",
        weeks: "Week 1",
        topics: [
          "Understanding PTE, GRE and DET formats",
          "Read Aloud and Repeat Sentence",
          "Describe Image and Retell Lecture",
          "Summarize Written Text",
        ],
        sampleLesson: "Begin with the speaking question types that contribute to multiple scores. Learn templates that work for every Describe Image task.",
      },
      {
        title: "Reading & Listening Mastery",
        weeks: "Week 2",
        topics: [
          "Reorder Paragraphs",
          "Fill in the Blanks (Reading & Writing)",
          "Summarize Spoken Text",
          "Write from Dictation",
        ],
      },
      {
        title: "Writing & Vocabulary",
        weeks: "Week 3",
        topics: [
          "Essay writing strategies",
          "Academic vocabulary range",
          "Time management per section",
          "Common grammar fixes",
        ],
      },
      {
        title: "Mock Tests & Strategy",
        weeks: "Week 4",
        topics: [
          "Full-length scored mock tests",
          "Weak area targeted drills",
          "Score analysis and improvement plan",
          "Test day strategy and checklist",
        ],
      },
    ],
  },
  {
    name: "Writing & Communication",
    tagline: "Write clearly. Sound professional.",
    description:
      "Creative writing, business communication and professional writing in one intensive programme: emails, reports, storytelling and polished workplace language.",
    fee: 27000,
    currency: "PKR",
    duration: "1 month",
    teacher: "Javaria Malik",
    schedule: "Mon – Sat",
    batches: [
      { name: "Afternoon", time: "3:00 PM – 6:00 PM", seatsTotal: 10 },
      { name: "Evening", time: "6:00 PM – 9:00 PM", seatsTotal: 24 },
    ],
    order: 4,
    active: true,
    demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    outcomes: [
      "Write clear, professional emails and reports",
      "Craft persuasive business messages",
      "Develop a creative writing style",
      "Communicate confidently in the workplace",
    ],
    modules: [
      {
        title: "Business Communication",
        weeks: "Week 1",
        topics: [
          "Professional email writing",
          "Report and memo structure",
          "Meeting and presentation language",
          "Tone and politeness in the workplace",
        ],
        sampleLesson: "Start with the emails you actually send. Learn structures that make you sound clear, confident and professional in writing.",
      },
      {
        title: "Professional Writing",
        weeks: "Week 2",
        topics: [
          "Resumes and cover letters",
          "Persuasive proposals",
          "Editing and proofreading",
          "Clarity and conciseness",
        ],
      },
      {
        title: "Creative Writing",
        weeks: "Week 3",
        topics: [
          "Story structure and hooks",
          "Descriptive and narrative voice",
          "Dialogue and pacing",
          "Feedback and revision",
        ],
      },
      {
        title: "Portfolio & Polish",
        weeks: "Week 4",
        topics: [
          "Building a writing portfolio",
          "Peer review workshops",
          "Final project",
          "Publishing and sharing your work",
        ],
      },
    ],
  },
];

export const FALLBACK_COURSE_NAMES = FALLBACK_COURSES.map((c) => c.name);

export const FALLBACK_BATCHES = Array.from(
  new Set(FALLBACK_COURSES.flatMap((c) => c.batches.map((b) => b.name)))
);