import { generateText } from "ai";
import { aiConfigured, getChatModel } from "@/lib/ai/config";

/** AI pre-call brief for a demo booking — what the lead wants, how to sell. */

export interface DemoBriefInput {
  name: string;
  course: string;
  preferredDate: string;
  preferredTime: string;
  message?: string | null;
  whatsappHistory: string[];
  placement?: { level: string; overallScore: number; recommendedCourse: string } | null;
}

export interface DemoBrief {
  leadSummary: string;
  recommendedCourse: string;
  talkingPoints: string[];
  nextStep: string;
  offline: boolean;
}

export function offlineDemoBrief(input: DemoBriefInput): DemoBrief {
  const rec = input.placement?.recommendedCourse ?? input.course;
  return {
    leadSummary: `${input.name.trim()} requested a ${input.course} demo for ${input.preferredDate} at ${input.preferredTime}.${input.message ? ` Note: ${input.message.slice(0, 140)}` : ""}`,
    recommendedCourse: rec,
    talkingPoints: [
      `Welcome ${input.name.split(" ")[0]}, thank them for booking.`,
      `Confirm their goal: is it fluency, a test target, or work/university?`,
      "Show the relevant batch time + monthly fee honestly.",
      "Book the follow-up decision call before ending.",
    ],
    nextStep: "Send the meeting link 2h before + confirm attendance.",
    offline: true,
  };
}

export async function generateDemoBrief(input: DemoBriefInput): Promise<DemoBrief> {
  if (!aiConfigured()) {
    return { ...offlineDemoBrief(input), offline: true };
  }
  const history = input.whatsappHistory.length
    ? `\nWhatsApp history:\n${input.whatsappHistory.join("\n")}`
    : "";
  const placement = input.placement
    ? `\nPlacement: ${input.placement.level} at ${input.placement.overallScore}%, recommended ${input.placement.recommendedCourse}.`
    : "";
  try {
    const { text } = await generateText({
      model: getChatModel(),
      system:
        "You are the admissions coach at Language Hub. From the demo-booking context, produce a concise brief: leadSummary (1–2 sentences), recommendedCourse, talkingPoints (3–4 short bullets for the call), nextStep (1 line). Plain text, no markdown headers other than a leading label per line. Mention real fees/schedules only if present.",
      prompt: `${input.name} booked ${input.course} on ${input.preferredDate} at ${input.preferredTime}.${input.message ? ` Message: ${input.message}` : ""}${history}${placement}`,
      temperature: 0.3,
    });
    const [summary = "", rec = input.course, points = "", next = ""] = text.split(/\n{2,}/);
    return {
      leadSummary: summary.replace(/^.*summary[:\s]*/i, "").trim() || input.name,
      recommendedCourse: rec.replace(/^.*course[:\s]*/i, "").trim() || input.course,
      talkingPoints: points
        .split(/\n|•|-\s*/)
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 4),
      nextStep: next.trim() || "Confirm the meeting link 2h before.",
      offline: false,
    };
  } catch {
    return { ...offlineDemoBrief(input), offline: true };
  }
}