import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { currentMgUser, scopedGroupIds } from "@/lib/management/core";
import { getGroupsCollection, getCoursesCollection, getUsersCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Seed payload for the management shell: identity + role-scoped groups + courses. */
export async function GET() {
  const user = await currentMgUser();
  if (!user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

  const groups = await getGroupsCollection();
  const myGroups = await scopedGroupIds(user);
  const groupDocs = await groups
    .find(myGroups ? { _id: { $in: myGroups.map((g) => new ObjectId(g)) } } : {})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  const [courses, userDoc] = await Promise.all([
    getCoursesCollection().then((c) => c.find({ active: true }).sort({ order: 1 }).toArray()),
    getUsersCollection().then((u) => u.findOne({ _id: new ObjectId(user.id) })),
  ]);

  return NextResponse.json({
    me: {
      ...user,
      image: userDoc?.image ?? user.image ?? null,
      phone: (userDoc?.phone as string) ?? (userDoc?.whatsapp as string) ?? user.phone,
    },
    role: user.role,
    groupFilter: myGroups ? "scoped" : "all",
    groups: groupDocs.map((d) => ({
      id: String(d._id),
      name: d.name,
      courseName: d.courseName ?? null,
      teacherIds: d.teacherIds,
      studentCount: (d.studentIds ?? []).length,
      schedule: d.schedule ?? null,
      status: d.status,
    })),
    courses: courses.map((c) => ({
      id: String(c._id),
      name: c.name,
      fee: c.fee,
      duration: c.duration,
      active: c.active,
    })),
  });
}