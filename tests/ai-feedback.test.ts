import { describe, expect, it } from "vitest";

import { offlineFeedback, parseGrade } from "../lib/ai/feedback";

const SAMPLE_ESSAY =
  "In my opinion, technology has changed the way people communicate. Some people think this is a problem, but I believe it is mostly positive because we can stay in touch with family who live far away and share information quickly.";

const SAMPLE_SPEECH =
  "Well, I would like to talk about my favourite teacher. She was kind and patient and always explained things clearly. I remember she encouraged me to read every day, which helped me a lot with my vocabulary.";

describe("offlineFeedback", () => {
  it("returns a band and structured markdown for an essay", () => {
    const { feedback, grade } = offlineFeedback(SAMPLE_ESSAY, "essay");
    expect(grade).toMatch(/Band \d(\.\d)?/);
    expect(feedback).toContain("### Overall grade");
    expect(feedback).toContain("### Criteria scores");
    expect(feedback).toContain("Task Response");
    expect(feedback).toContain("### Next 3 steps");
  });

  it("uses the speaking rubric for a speaking transcript", () => {
    const { feedback } = offlineFeedback(SAMPLE_SPEECH, "speaking");
    expect(feedback).toContain("Pronunciation");
  });

  it("is deterministic", () => {
    const a = offlineFeedback(SAMPLE_ESSAY, "essay");
    const b = offlineFeedback(SAMPLE_ESSAY, "essay");
    expect(a).toEqual(b);
  });

  it("flags a very short submission", () => {
    const { feedback } = offlineFeedback("Hello", "essay");
    expect(feedback.length).toBeGreaterThan(50);
  });
});

describe("parseGrade", () => {
  it("parses IELTS-style bands", () => {
    expect(parseGrade("Your overall is Band 6.5 today.")).toBe("Band 6.5 (IELTS-style)");
    expect(parseGrade("Overall grade: Band 7")).toBe("Band 7 (IELTS-style)");
  });

  it("parses 9-scale scores", () => {
    expect(parseGrade("Score 6/9 for writing")).toBe("Score 6/9 (IELTS-style)");
  });

  it("parses CEFR levels", () => {
    expect(parseGrade("At a CEFR level B2, your English is…")).toBe("Level B2 (CEFR)");
  });

  it("returns null when no grade is present", () => {
    expect(parseGrade("Great effort, keep practising!")).toBeNull();
  });
});