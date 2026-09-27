import { FALLBACK_COURSES, formatPKR, type CourseInfo } from "@/lib/course-data";

export const ACADEMY = {
  name: "Language Hub",
  tagline: "Hub of Language Excellence",
  founder: "Javaria Malik",
  foundedByLabel: "Founded by",
};

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

export const COURSE_ACCENTS = ["#6e5ae0", "#2bb3d8", "#d63a8c", "#2e9e6b"] as const;

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

export interface SuccessStory {
  slug: string;
  name: string;
  role: string;
  course: string;
  /** Short headline shown on the listing card */
  headline: string;
  /** Before / after scores or measurable outcomes */
  before: string;
  after: string;
  /** Video testimonial — direct mp4 URL or YouTube embed when available */
  videoUrl?: string;
  videoProvider: "youtube" | "mp4" | "none";
  /** Free-text progress narrative */
  story: string[];
  /** Individual results they'd like to highlight */
  highlights: string[];
  /** Their recommendation word */
  recommendation: string;
}

export const SUCCESS_STORIES: SuccessStory[] = [
  {
    slug: "hamza-khan-spoken-english",
    name: "Hamza Khan",
    role: "Student, Spoken English",
    course: "Spoken English",
    headline: "From being silent in class to leading group discussions",
    before: "Could only answer yes/no questions",
    after: "Holds 10-minute group conversations without a script",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    videoProvider: "youtube",
    story: [
      "Hamza joined Language Hub after years of studying English in school but never feeling able to speak it. He could read and write well, but the moment someone asked him a question in English, he froze.",
      "We started him in a small morning batch where every student has to speak every session. The first two weeks were about unlearning the habit of translating everything from Urdu to English in his head.",
      "Within a month he was holding short conversations. By month three, Hamza was the one leading the group discussion warm-ups — the same student who used to avoid eye contact and mumble an apology.",
    ],
    highlights: [
      "Speaks in full sentences without hesitation",
      "Leads group discussion warm-ups in class",
      "Reported 2× more speaking time per session",
    ],
    recommendation:
      "I never thought a class could change how I feel about speaking English. The small batch is everything — you have no choice but to talk.",
  },
  {
    slug: "ayesha-siddiqui-ielts",
    name: "Ayesha Siddiqui",
    role: "Student, IELTS",
    course: "IELTS Preparation",
    headline: "Reached her target band 7 after months of frustration",
    before: "Stuck at Band 6.0 for two attempts",
    after: "Band 7.0 on her third attempt",
    videoProvider: "none",
    story: [
      "Ayesha had taken IELTS twice and plateaued at Band 6.0. Her reading and listening were fine, but her writing and speaking scores wouldn't move.",
      "The difference at Language Hub was the structured 4-skill syllabus and the weekly one-on-one speaking reviews. Her teacher gave honest, specific feedback every single week — not generic 'good job' comments.",
      "She practised writing with real examiner-style marking criteria and learned exactly how the band descriptors worked. On attempt three, she hit 7.0 in writing and maintained her strength in the other sections.",
    ],
    highlights: [
      "+1.0 band improvement in Writing",
      "Weekly one-on-one speaking reviews",
      "Understood exactly how band descriptors are applied",
    ],
    recommendation:
      "The weekly speaking reviews were worth the entire fee alone. Nobody had ever given me feedback that specific before.",
  },
  {
    slug: "sana-malik-ielts-band-75",
    name: "Sana Malik",
    role: "Fresh graduate",
    course: "IELTS Preparation",
    headline: "Band 7.5 in just 8 weeks",
    before: "No-test baseline, method-less self-study",
    after: "Band 7.5 overall in 8 weeks",
    videoProvider: "none",
    story: [
      "Sana came in as a fresh graduate with a decent grasp of English but no test strategy at all. She had been self-studying for weeks and felt completely lost about how the exam was marked.",
      "Language Hub gave her a routine: daily vocabulary, structured mock tests every week, and clear feedback loops. She learned time management for each section — the thing that had been quietly costing her marks.",
      "Eight weeks later she sat the real exam and walked out with an overall Band 7.5, exceeding every university requirement she was applying for.",
    ],
    highlights: [
      "Band 7.5 overall in 8 weeks",
      "Weekly mock-test rhythm she could rely on",
      "Met every university requirement",
    ],
    recommendation:
      "The routine is what changed everything for me. I arrived method-less and left with a plan I could follow on my own.",
  },
  {
    slug: "fatima-noor-pte",
    name: "Fatima Noor",
    role: "Student, PTE",
    course: "PTE Preparation",
    headline: "Calm, confident, and under the clock",
    before: "Panicked during timed practice",
    after: "Scored 68 overall with time to spare",
    videoProvider: "none",
    story: [
      "Fatima's problem wasn't ability — it was panic under the strict time limits. On her own she'd rush and misread instructions.",
      "At Language Hub, the AI-scored mock tests and timed response drills made time pressure feel routine. She practised responding within the exact time windows over and over until it stopped feeling stressful.",
      "By test day, completing within the limits felt automatic. She scored 68 overall with several sections finished ahead of time.",
    ],
    highlights: [
      "PTE score of 68 overall",
      "Finished multiple sections ahead of time",
      "Timed drills removed test-day anxiety",
    ],
    recommendation:
      "I learned to keep my response clear and natural under pressure. It genuinely changed how I perform in every test.",
  },
  {
    slug: "zoya-imran-det",
    name: "Zoya Imran",
    role: "Student, DET",
    course: "Duolingo English Test",
    headline: "Pushed her DET score past 120",
    before: "Scored 95 on her first attempt",
    after: "Scored 125 — above target",
    videoProvider: "none",
    story: [
      "Zoya's first Duolingo English Test score was 95 — not enough for the programs she wanted. She needed to push past 120.",
      "The six-week DET sprint at Language Hub focused on pattern drills and short daily lessons she could fit around university. Her coach kept her streaks honest and gave instant feedback on the writing and speaking samples.",
      "The adaptive question-type practice meant she was never surprised by the format. Six weeks later she scored 125, clearing every application threshold.",
    ],
    highlights: [
      "Score jumped from 95 to 125",
      "Daily short lessons fit around university",
      "Adaptive practice removed format surprises",
    ],
    recommendation:
      "Six weeks, short daily lessons, and a coach who kept my streaks honest. That last feedback loop pushed my score way past what I expected.",
  },
];

export const SUCCESS_STORY_SLUGS = SUCCESS_STORIES.map((s) => s.slug);

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
  role: "CEO · Founder · Chairman",
  headline: "MS. JAVARIA MALIK",
  image: "/javeria-malik.jpg",
  quote:
    "Teaching is not only about giving knowledge. It is about helping someone discover what they are capable of becoming.",
  bio: [
    "Ms. Javaria Malik founded Language Hub on one belief: that English is a living skill, not a textbook subject.",
    "As CEO and Chairman of Language Hub, she leads every session with the conviction that learners are people with something real to say — because fluency lives where confidence and communication meet.",
  ],
  credentials: ["English Language Specialist", "IELTS · PTE · DET Coach", "Conversation-first method"],
};

export interface TeamMember {
  name: string;
  role: string;
  credentials: string[];
  bio: string;
  focus: string[];
  image?: string | null;
}

/** The teaching team behind Language Hub. Founder-led, conversation-first. */
export const TEAM: TeamMember[] = [
  {
    name: "Javaria Malik",
    role: "CEO · Founder · Chairman",
    credentials: [
      "English Language Specialist",
      "IELTS · PTE · DET Coach",
      "8+ years teaching",
    ],
    bio: "As CEO, Founder and Chairman of Language Hub, Javaria built the conversation-first method that runs through every Language Hub session. She leads the academy on one belief: English is a living skill, not a textbook subject.",
    focus: ["IELTS Speaking", "PTE Speaking", "Spoken English"],
image: "/ceo.jpg",
  },
  {
    name: "Aiman Raza",
    role: "IELTS & PTE Trainer",
    credentials: ["IELTS Band 8.0", "PTE Academic Specialist", "5+ years training"],
    bio: "Aiman specialises in the writing and speaking sections where students most often plateau. Her weekly one-on-one reviews give honest, actionable feedback that moves scores.",
    focus: ["IELTS Writing", "PTE Reading", "Mock test feedback"],
  },
  {
    name: "Sameer Qureshi",
    role: "Conversation Coach",
    credentials: ["Applied Linguistics Graduate", "Speech & Accent Coach"],
    bio: "Sameer runs the conversation practice sessions that build the confidence to actually speak. He focuses on pronunciation, natural phrasing, and reducing that urge to translate before you talk.",
    focus: ["Spoken English", "Pronunciation", "Fluency"],
  },
  {
    name: "Mahnoor Siddiqui",
    role: "Duolingo & General English",
    credentials: ["DET Specialist", "TEYL English Pedagogy"],
    bio: "Mahnoor designs the short daily lessons and adaptive practice that make the Duolingo English Test approachable — turning a fast-paced format into a manageable daily habit.",
    focus: ["Duolingo English Test", "Vocabulary", "Fast-track learning"],
  },
];

export const ACADEMY_STATS = [
  { value: "8+", label: "Years teaching" },
  { value: "600+", label: "Students guided" },
  { value: "4", label: "Programmes" },
  { value: "2", label: "Daily batches" },
] as const;

export const HERO_WORDS = ["Spoken English", "IELTS", "PTE · GRE · Duolingo", "Writing & Communication"];

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