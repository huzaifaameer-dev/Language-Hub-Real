import { NextResponse } from "next/server";

import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { botGuardError } from "@/lib/bot-check";
import { calculatePlacement } from "@/lib/placement-test-data";
import {
  analyzePlacement,
  type PlacementInput,
} from "@/lib/ai/placements";
import type { PlacementCategory } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORIES: PlacementCategory[] = [
  "grammar",
  "vocabulary",
  "reading",
  "sentence-structure",
];

/**
 * POST — AI analysis of a placement-test result. Accepts the raw answer array,
 * recomputes the deterministic score server-side (never trusts the client),
 * then produces a personalized level + study plan via structured LLM output.
 * Falls back to a deterministic analysis when no AI key is configured.
 */
export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "placement-analyze"), 6, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many requests. Please try again in a while." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const bot = botGuardError(body);
  if (bot) return NextResponse.json({ message: bot }, { status: 400 });

  const {
    answers,
    name,
    email,
  } = (body ?? {}) as {
    answers?: unknown;
    name?: string | null;
    email?: string | null;
  };

  if (!Array.isArray(answers) || answers.some((a) => typeof a !== "number")) {
    return NextResponse.json({ message: "Answers array of numbers is required." }, { status: 400 });
  }

  const result = calculatePlacement(answers as number[]);
  const breakdown = result.categoryBreakdown as Record<PlacementCategory, { correct: number; total: number }>;

  const input: PlacementInput = {
    name: typeof name === "string" ? name : null,
    email: typeof email === "string" ? email : null,
    score: result.score,
    total: result.total,
    percentage: result.percentage,
    level: result.level,
    recommendedCourse: result.recommendedCourse,
    categoryBreakdown: {
      grammar: breakdown.grammar,
      vocabulary: breakdown.vocabulary,
      reading: breakdown.reading,
      "sentence-structure": breakdown["sentence-structure"],
    },
  };

  // Ensure the required schema keys exist even if the DB has other categories.
  for (const c of CATEGORIES) {
    if (!input.categoryBreakdown[c]) input.categoryBreakdown[c] = { correct: 0, total: 0 };
  }

  try {
    const { analysis, offline } = await analyzePlacement(input);
    return NextResponse.json({ analysis, offline });
  } catch {
    return NextResponse.json(
      { message: "Could not analyze the result. Please try again." },
      { status: 500 }
    );
  }
}