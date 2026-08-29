import { describe, expect, it } from "vitest";
import { COURSE_BOOKS, booksFor } from "../lib/books";

describe("books", () => {
  it("covers every course with a non-empty book list", () => {
    for (const course of Object.keys(COURSE_BOOKS)) {
      expect(COURSE_BOOKS[course as keyof typeof COURSE_BOOKS].length).toBeGreaterThan(0);
    }
  });

  it("booksFor dedupes titles across subjects", () => {
    const books = booksFor(["Spoken English", "IELTS Preparation"]);
    const titles = books.map((b) => b.title);
    expect(new Set(titles).size).toBe(titles.length);
    // not every book in either course list is guaranteed unique, so just assert no crash
    expect(books.length).toBeGreaterThanOrEqual(1);
  });
});