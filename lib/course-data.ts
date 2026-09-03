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
        weeks: "Weeks 1–4",
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
        weeks: "Weeks 5–8",
        topics: [
          "Describing routines and habits",
          "Asking and answering questions",
          "Common conversation scenarios",
          "Reducing translation habits",
        ],
      },
      {
        title: "Conversational Flow",
        weeks: "Weeks 9–12",
        topics: [
          "Expressing opinions and preferences",
          "Telling stories and anecdotes",
          "Handling disagreements politely",
          "Idiomatic expressions",
        ],
      },
      {
        title: "Advanced Speaking",
        weeks: "Weeks 13–16",
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
        weeks: "Weeks 1–3",
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
        weeks: "Weeks 4–6",
        topics: [
          "Skimming and scanning techniques",
          "True/False/Not Given questions",
          "Matching and summary completion",
          "Time management per passage",
        ],
      },
      {
        title: "Writing Task 1 & 2",
        weeks: "Weeks 7–9",
        topics: [
          "Graph and chart description",
          "Essay structure and coherence",
          "Academic vocabulary range",
          "Peer review and feedback sessions",
        ],
      },
      {
        title: "Speaking Test Prep",
        weeks: "Weeks 10–12",
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
    demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    outcomes: [
      "Master every PTE question type",
      "Score 65+ with AI-scored practice",
      "Complete tasks within strict time limits",
      "Build academic vocabulary fast",
    ],
    modules: [
      {
        title: "Speaking & Writing Foundations",
        weeks: "Weeks 1–3",
        topics: [
          "Read Aloud and Repeat Sentence",
          "Describe Image and Retell Lecture",
          "Summarize Written Text",
          "Essay writing strategies",
        ],
        sampleLesson: "Begin with the speaking question types that contribute to both speaking and writing scores. Learn templates that work for every Describe Image task.",
      },
      {
        title: "Reading Mastery",
        weeks: "Weeks 4–6",
        topics: [
          "Reorder Paragraphs",
          "Fill in the Blanks (Reading & Writing)",
          "Multiple Choice questions",
          "Reading time management",
        ],
      },
      {
        title: "Listening Skills",
        weeks: "Weeks 7–9",
        topics: [
          "Summarize Spoken Text",
          "Fill in the Blanks (Listening)",
          "Highlight Correct Summary",
          "Write from Dictation",
        ],
      },
      {
        title: "Mock Tests & Strategy",
        weeks: "Weeks 10–12",
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
    demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    outcomes: [
      "Score 110+ on the Duolingo English Test",
      "Master adaptive question patterns",
      "Write and speak confidently under time",
      "Complete the test in one sitting",
    ],
    modules: [
      {
        title: "Test Format & Quick Wins",
        weeks: "Weeks 1–2",
        topics: [
          "Understanding the adaptive format",
          "Read Aloud and Write About the Image",
          "Listening and Speaking samples",
          "Quick vocabulary boost",
        ],
        sampleLesson: "Get familiar with the unique DET format. Learn the question types that appear most often and start with quick score improvements.",
      },
      {
        title: "Reading & Listening Deep Dive",
        weeks: "Weeks 3–4",
        topics: [
          "Fill in the Blanks strategies",
          "Comprehension questions",
          "Interactive Listening practice",
          "Context clue techniques",
        ],
      },
      {
        title: "Writing & Speaking Polish",
        weeks: "Weeks 5–6",
        topics: [
          "Writing samples with scoring criteria",
          "Speaking prompts practice",
          "Video essay strategies",
          "Final mock test and review",
        ],
      },
    ],
  },
];

export const FALLBACK_COURSE_NAMES = FALLBACK_COURSES.map((c) => c.name);

export const FALLBACK_BATCHES = Array.from(
  new Set(FALLBACK_COURSES.flatMap((c) => c.batches.map((b) => b.name)))
);