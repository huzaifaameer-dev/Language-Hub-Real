export interface PlacementQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  category: "grammar" | "vocabulary" | "reading" | "sentence-structure";
  level: "beginner" | "intermediate" | "advanced";
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // Grammar — Beginner
  {
    id: 1,
    question: "Choose the correct form: She ___ to school every day.",
    options: ["go", "goes", "going", "gone"],
    correctIndex: 1,
    category: "grammar",
    level: "beginner",
  },
  {
    id: 2,
    question: "Which is correct? I ___ a book right now.",
    options: ["read", "reads", "am reading", "is reading"],
    correctIndex: 2,
    category: "grammar",
    level: "beginner",
  },
  {
    id: 3,
    question: "Complete: They ___ not at home yesterday.",
    options: ["is", "are", "was", "were"],
    correctIndex: 3,
    category: "grammar",
    level: "beginner",
  },
  // Grammar — Intermediate
  {
    id: 4,
    question: "Choose the correct tense: By next year, I ___ here for five years.",
    options: ["will work", "will have worked", "am working", "have worked"],
    correctIndex: 1,
    category: "grammar",
    level: "intermediate",
  },
  {
    id: 5,
    question: "Which is correct? The book ___ by the author last year.",
    options: ["wrote", "was written", "is written", "has written"],
    correctIndex: 1,
    category: "grammar",
    level: "intermediate",
  },
  {
    id: 6,
    question: "Choose: If I ___ you, I would accept the offer.",
    options: ["am", "was", "were", "be"],
    correctIndex: 2,
    category: "grammar",
    level: "intermediate",
  },
  // Grammar — Advanced
  {
    id: 7,
    question: "Choose the correct form: Not only ___ the project, but she also led the presentation.",
    options: ["she completed", "did she complete", "she did complete", "completing she"],
    correctIndex: 1,
    category: "grammar",
    level: "advanced",
  },
  {
    id: 8,
    question: "Which is correct? The manager, along with his team, ___ attending the meeting.",
    options: ["are", "were", "is", "have been"],
    correctIndex: 2,
    category: "grammar",
    level: "advanced",
  },
  // Vocabulary — Beginner
  {
    id: 9,
    question: "What does 'happy' mean?",
    options: ["Sad", "Angry", "Joyful", "Tired"],
    correctIndex: 2,
    category: "vocabulary",
    level: "beginner",
  },
  {
    id: 10,
    question: "Choose the synonym of 'big':",
    options: ["Small", "Large", "Short", "Thin"],
    correctIndex: 1,
    category: "vocabulary",
    level: "beginner",
  },
  // Vocabulary — Intermediate
  {
    id: 11,
    question: "What does 'ambiguous' mean?",
    options: ["Clear", "Uncertain or unclear", "Angry", "Beautiful"],
    correctIndex: 1,
    category: "vocabulary",
    level: "intermediate",
  },
  {
    id: 12,
    question: "Choose the antonym of 'generous':",
    options: ["Kind", "Selfish", "Wealthy", "Friendly"],
    correctIndex: 1,
    category: "vocabulary",
    level: "intermediate",
  },
  // Vocabulary — Advanced
  {
    id: 13,
    question: "What does 'ubiquitous' mean?",
    options: ["Rare", "Found everywhere", "Hidden", "Ancient"],
    correctIndex: 1,
    category: "vocabulary",
    level: "advanced",
  },
  {
    id: 14,
    question: "Choose the word closest in meaning to 'ephemeral':",
    options: ["Permanent", "Short-lived", "Powerful", "Visible"],
    correctIndex: 1,
    category: "vocabulary",
    level: "advanced",
  },
  // Reading — Beginner
  {
    id: 15,
    question: "\"The cat sat on the mat.\" Where did the cat sit?",
    options: ["On the chair", "On the mat", "Under the table", "On the bed"],
    correctIndex: 1,
    category: "reading",
    level: "beginner",
  },
  // Reading — Intermediate
  {
    id: 16,
    question: "\"Despite the rain, the team continued the match.\" What happened?",
    options: [
      "The match was cancelled",
      "The team stopped playing",
      "The team kept playing despite rain",
      "The rain helped the team",
    ],
    correctIndex: 2,
    category: "reading",
    level: "intermediate",
  },
  // Reading — Advanced
  {
    id: 17,
    question: "\"The administration's austerity measures, though unpopular, eventually stabilized the economy.\" What does this suggest?",
    options: [
      "The measures were immediately popular",
      "The economy worsened",
      "Difficult decisions led to economic improvement",
      "The administration was replaced",
    ],
    correctIndex: 2,
    category: "reading",
    level: "advanced",
  },
  // Sentence Structure — Beginner
  {
    id: 18,
    question: "Which sentence is correct?",
    options: [
      "He don't like coffee",
      "He doesn't likes coffee",
      "He doesn't like coffee",
      "He not like coffee",
    ],
    correctIndex: 2,
    category: "sentence-structure",
    level: "beginner",
  },
  // Sentence Structure — Intermediate
  {
    id: 19,
    question: "Rearrange: 'have / I / never / such a thing / seen'",
    options: [
      "I have never seen such a thing",
      "Never I have seen such a thing",
      "I never have seen a such thing",
      "Such a thing I have never seen",
    ],
    correctIndex: 0,
    category: "sentence-structure",
    level: "intermediate",
  },
  // Sentence Structure — Advanced
  {
    id: 20,
    question: "Which sentence uses the subjunctive mood correctly?",
    options: [
      "If I was rich, I would travel",
      "If I were rich, I would travel",
      "If I am rich, I would travel",
      "If I be rich, I would travel",
    ],
    correctIndex: 1,
    category: "sentence-structure",
    level: "advanced",
  },
];

export type PlacementLevel = "beginner" | "intermediate" | "advanced";

export interface PlacementResult {
  score: number;
  total: number;
  percentage: number;
  level: PlacementLevel;
  recommendedCourse: string;
  categoryBreakdown: Record<string, { correct: number; total: number }>;
}

export function calculatePlacement(answers: number[]): PlacementResult {
  let correct = 0;
  const breakdown: Record<string, { correct: number; total: number }> = {};

  for (let i = 0; i < PLACEMENT_QUESTIONS.length; i++) {
    const q = PLACEMENT_QUESTIONS[i];
    if (!breakdown[q.category]) {
      breakdown[q.category] = { correct: 0, total: 0 };
    }
    breakdown[q.category].total++;
    if (answers[i] === q.correctIndex) {
      correct++;
      breakdown[q.category].correct++;
    }
  }

  const percentage = Math.round((correct / PLACEMENT_QUESTIONS.length) * 100);

  let level: PlacementLevel;
  let recommendedCourse: string;

  if (percentage >= 70) {
    level = "advanced";
    recommendedCourse = "IELTS Preparation";
  } else if (percentage >= 40) {
    level = "intermediate";
    recommendedCourse = "PTE Preparation";
  } else {
    level = "beginner";
    recommendedCourse = "Spoken English";
  }

  return {
    score: correct,
    total: PLACEMENT_QUESTIONS.length,
    percentage,
    level,
    recommendedCourse,
    categoryBreakdown: breakdown,
  };
}
