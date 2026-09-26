"use client";

import { useEffect, useState } from "react";
import { BookOpen, FolderKanban, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { EmptyState, SkeletonRows } from "./ui";
import type { CourseLite, GroupLite } from "./types";

interface CourseView extends CourseLite {
  groups: GroupLite[];
  students: number;
  teachers: number;
  active: boolean;
}

async function loadCourses() {
  const [meRes, groupRes] = await Promise.all([
    fetch("/api/management/me"),
    fetch("/api/management/groups"),
  ]);
  const me = meRes.ok ? await meRes.json() : { courses: [] };
  const groups = (groupRes.ok ? await groupRes.json() : { groups: [] }).groups as GroupLite[];
  const courses: CourseView[] = (me.courses as (CourseLite & { active?: boolean })[]).map((c) => {
    const gs = groups.filter((g) => g.courseName === c.name);
    return {
      ...c,
      active: c.active === true,
      groups: gs,
      students: gs.reduce((n, g) => n + (g.studentCount ?? 0), 0),
      teachers: new Set(gs.flatMap((g) => (g as unknown as { teacherIds?: string[] }).teacherIds ?? [])).size,
    };
  });
  return courses;
}

export function CoursesView() {
  const [rows, setRows] = useState<CourseView[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    loadCourses()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Programmes</p>
        <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Courses</h2>
        <p className="mt-0.5 text-[0.9rem] text-slate-500">
          Course catalog is managed in the{" "}
          <Link href="/admin-panel" className="font-bold text-[#1647C7] underline-offset-2 hover:underline">Admin panel</Link> — this is the live view of groups per course.
        </p>
      </header>

      {busy ? (
        <SkeletonRows rows={3} cols={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No courses found" hint="Courses live in the Admin panel — create one there and assign groups below." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur transition-all hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6D4AFF] text-white">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-[1.02rem] font-extrabold text-slate-900">{c.name}</p>
                    <p className="font-mono text-[0.6rem] text-slate-400">
                      {c.duration ? `${c.duration} · ` : ""}{c.fee ? `Rs ${Number(c.fee).toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[0.6rem] font-bold text-emerald-700">
                  {c.active === false ? "archived" : "active"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                <Mini icon={<FolderKanban className="h-3.5 w-3.5" />} label="Groups" value={c.groups.length} />
                <Mini icon={<Users className="h-3.5 w-3.5" />} label="Students" value={c.students} />
                <Mini icon={<GraduationCap className="h-3.5 w-3.5" />} label="Teachers" value={c.teachers} />
              </div>

              {c.groups.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.groups.map((g) => (
                    <span key={g.id} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-slate-600">
                      {g.name} · {g.studentCount}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 font-mono text-[0.62rem] text-slate-400">No group uses this course yet — create one in Groups and pick a course name.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2.5 py-2 text-center">
      <p className="mx-auto grid h-6 w-6 place-items-center rounded-lg bg-white text-[#1647C7] shadow-sm">{icon}</p>
      <p className="mt-1.5 font-display text-[1.05rem] font-extrabold leading-none text-slate-900">{value}</p>
      <p className="mt-1 font-mono text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </div>
  );
}