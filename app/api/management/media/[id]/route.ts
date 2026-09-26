import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { currentMgUser, scopedGroupIds } from "@/lib/management/core";
import { getMgAssignmentsCollection, getSubmissionsCollection, getMaterialsCollection } from "@/lib/db";
import { readPrivateFile } from "@/lib/registration-storage";

export const dynamic = "force-dynamic";

/** Serve a management attachment (assignment / submission / image material)
 *  only to an authorized viewer — admin, the assigning teacher, or the student
 *  who submitted/owns it. Files live under private/, never in the public dir. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentMgUser();
  if (!user) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "assignment";
  const idx = Math.max(0, Number(url.searchParams.get("idx")) || 0);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const scope = await scopedGroupIds(user);
  let rel: string | null = null;
  let mime = "application/octet-stream";

  if (kind === "assignment") {
    const doc = await (await getMgAssignmentsCollection()).findOne({ _id: new ObjectId(id) });
    if (!doc) return NextResponse.json({ message: "Not found." }, { status: 404 });
    if (scope && !doc.groupIds.some((g) => scope.includes(g))) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    rel = doc.attachments?.[idx]?.rel ?? null;
    mime = doc.attachments?.[idx]?.mime ?? mime;
  } else if (kind === "submission") {
    const doc = await (await getSubmissionsCollection()).findOne({ _id: new ObjectId(id) });
    if (!doc) return NextResponse.json({ message: "Not found." }, { status: 404 });
    const owner = doc.studentId === user.id;
    let teacherOk = user.role === "ADMIN";
    if (user.role === "TEACHER") {
      const a = await (await getMgAssignmentsCollection()).findOne({ _id: new ObjectId(doc.assignmentId) });
      const myGroups = await scopedGroupIds(user);
      teacherOk = !!a && !!myGroups && a.groupIds.some((g) => myGroups.includes(g));
    }
    if (!owner && !teacherOk) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    rel = doc.attachments?.[idx]?.rel ?? null;
    mime = doc.attachments?.[idx]?.mime ?? mime;
  } else {
    const doc = await (await getMaterialsCollection()).findOne({ _id: new ObjectId(id) });
    if (!doc) return NextResponse.json({ message: "Not found." }, { status: 404 });
    if (scope && doc.groupId && !scope.includes(doc.groupId)) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    if (doc.url?.startsWith("registrations/") || doc.url?.startsWith("management/")) {
      rel = doc.url;
    }
  }

  if (!rel) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const file = await readPrivateFile(rel);
  if (!file) return NextResponse.json({ message: "Not found." }, { status: 404 });

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mime || mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}