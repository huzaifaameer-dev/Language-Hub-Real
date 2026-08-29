import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import {
  ensureIndexesAndAdmin,
  getApplicationsCollection,
  getEnrollmentsCollection,
  getUsersCollection,
  getCoursesCollection,
  getNotificationsCollection,
} from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  await ensureIndexesAndAdmin();
  const [applications, enrollments, users, courses, notifications] = await Promise.all([
    getApplicationsCollection(),
    getEnrollmentsCollection(),
    getUsersCollection(),
    getCoursesCollection(),
    getNotificationsCollection(),
  ]);

  const [
    total,
    pending,
    approved,
    rejected,
    today,
    thisWeek,
    thisMonth,
    enrPending,
    enrEnrolled,
    enrRejected,
    userCount,
    courseCount,
    notificationCount,
  ] = await Promise.all([
    applications.countDocuments({}),
    applications.countDocuments({ status: "PENDING" }),
    applications.countDocuments({ status: "APPROVED" }),
    applications.countDocuments({ status: "REJECTED" }),
    applications.countDocuments({ createdAt: { $gte: startOfDay(new Date()) } }),
    applications.countDocuments({ createdAt: { $gte: startOfWeek(new Date()) } }),
    applications.countDocuments({ createdAt: { $gte: startOfMonth(new Date()) } }),
    enrollments.countDocuments({ status: "PENDING" }),
    enrollments.countDocuments({ status: "ENROLLED" }),
    enrollments.countDocuments({ status: "REJECTED" }),
    users.countDocuments({ role: { $ne: "ADMIN" } }),
    courses.countDocuments({ active: true }),
    notifications.countDocuments({}),
  ]);

  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return NextResponse.json({
    total,
    pending,
    approved,
    rejected,
    today,
    thisWeek,
    thisMonth,
    enrPending,
    enrEnrolled,
    enrRejected,
    users: userCount,
    courses: courseCount,
    notifications: notificationCount,
    approvalRate,
  });
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}