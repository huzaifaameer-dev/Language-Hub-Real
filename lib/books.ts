import type { Course } from "@/lib/db";

export interface Book {
  title: string;
  author: string;
  tag: "Core" | "Practice" | "Advanced";
  from: string;
  to: string;
}

export const COURSE_BOOKS: Record<Course, Book[]> = {
  "Spoken English": [
    { title: "Fluent English", author: "Barbara Raifsnider", tag: "Core", from: "#c2a05c", to: "#6e5ae0" },
    { title: "English Conversation Practice", author: "Grant Taylor", tag: "Practice", from: "#2bb3d8", to: "#6e5ae0" },
    { title: "Speak English Around Town", author: "Amy Gillett", tag: "Advanced", from: "#d63a8c", to: "#6e5ae0" },
  ],
  "IELTS Preparation": [
    { title: "The Official Cambridge Guide to IELTS", author: "Pauline Cullen", tag: "Core", from: "#c2a05c", to: "#2e9e6b" },
    { title: "Barron's IELTS Superpack", author: "Dr. Lin Lougheed", tag: "Practice", from: "#2bb3d8", to: "#2e9e6b" },
    { title: "Grammar for IELTS", author: "D. Hopkins & P. Cullen", tag: "Advanced", from: "#d63a8c", to: "#2e9e6b" },
  ],
  "PTE Preparation": [
    { title: "The Official Guide to PTE Academic", author: "Pearson", tag: "Core", from: "#c2a05c", to: "#2bb3d8" },
    { title: "PTE Academic Practice Tests Plus", author: "Pearson Education", tag: "Practice", from: "#2e9e6b", to: "#2bb3d8" },
    { title: "McGraw-Hill's PTE Academic", author: "Connie Oxford", tag: "Advanced", from: "#d63a8c", to: "#2bb3d8" },
  ],
  "Duolingo English Test": [
    { title: "DET: The Ultimate Strategy Guide", author: "DET Prep Team", tag: "Core", from: "#c2a05c", to: "#49d672" },
    { title: "Ace the Duolingo English Test", author: "Test Prep Guides", tag: "Practice", from: "#2bb3d8", to: "#49d672" },
    { title: "Complete Study Guide for the DET", author: "EduPro", tag: "Advanced", from: "#d63a8c", to: "#49d672" },
  ],
};

export function booksFor(subjects: Course[]): Book[] {
  const map = new Map<string, Book>();
  for (const s of subjects) {
    for (const b of COURSE_BOOKS[s] ?? []) {
      if (!map.has(b.title)) map.set(b.title, b);
    }
  }
  return [...map.values()];
}