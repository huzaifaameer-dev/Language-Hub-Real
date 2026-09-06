/** Spoken practice persona for "Practice with Aina" — short conversational
 * turns tuned for reading aloud, plus a transcript-grading helper. */

export type PracticeLang = "en" | "ur";

export const PRACTICE_TOPICS = [
  "introduce-yourself",
  "daily-routine",
  "favourite-food",
  "travel-plan",
  "job-interview",
] as const;
export type PracticeTopic = (typeof PRACTICE_TOPICS)[number];

/** System prompt for the voice-coach stream. Kept short and conversational. */
export function practiceSystemPrompt(
  topic: PracticeTopic,
  lang: PracticeLang,
  turn: number
): string {
  const langRule =
    lang === "ur"
      ? "The learner may reply partly in Urdu. Reply in simple English, gently restate their idea in better English, then keep the conversation going with one short question."
      : "Reply in simple, natural English.";
  return `You are Aina, the friendly spoken-English coach at Language Hub. You are mid-way through a casual conversation practice (${turn}/3 rounds).

${langRule}

RULES
- Keep each reply to 1–2 short sentences — it is read aloud.
- Correct ONE mistake gently by restating the learner's sentence correctly ("Good one — you can also say: …").
- End with a single short question to continue.
- Topic: ${topic}. No markdown, no bullets, no emoji.`;

  // Never exceed 120 words per reply, even for the last turn.
}

/** Starter line for a practice topic. */
export function practiceOpener(topic: PracticeTopic, name?: string): string {
  const first = name?.split(" ")[0] ?? "there";
  switch (topic) {
    case "introduce-yourself":
      return `Hi ${first}, let's practise introductions. Tell me about yourself in two or three sentences — where you're from and what you do.`;
    case "daily-routine":
      return `${first}, let's talk about your day. Walk me through your morning routine from waking up to having breakfast.`;
    case "favourite-food":
      return `${first}, everybody has a comfort food. What's yours, and how is it made? Try to describe it step by step.`;
    case "travel-plan":
      return `${first}, if you could travel anywhere next month, where would you go? Tell me the plan and one thing you'd do there.`;
    case "job-interview":
      return `${first}, imagine you're in a job interview. Tell me about your strengths and one thing you bring to a team.`;
  }
}

/** Deterministic offline coach reply (no AI key). */
export function offlinePracticeReply(text: string, turn: number): string {
  const clean = text.trim().replace(/[.!?]+$/, "");
  const words = clean.split(/\s+/).filter(Boolean);
  const one = words.slice(0, 4).join(" ") || "that";
  if (turn >= 3) {
    return `Brilliant finish! You said "${clean.slice(0, 90)}". Nice and clear. Try again tomorrow with a new topic — consistency builds fluency.`;
  }
  return `Nice, you mentioned "${one}" — I love that. You can also say: "${one}" is really important to me. Tell me more, do you usually do this every day?`;
}

/** Band-ish fluency label for a short practice transcript (heuristic). */
export function practiceFluencyLabel(wordCount: number, sentences: number): string {
  const avg = sentences > 0 ? wordCount / sentences : 0;
  if (wordCount < 20) return "Warm-up";
  if (avg < 4) return "Broken";
  if (avg < 7) return "Developing";
  if (avg < 12) return "Flowing";
  return "Fluent";
}