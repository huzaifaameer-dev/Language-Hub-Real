"use client";

/* Aggregator — every management view is exported here so the ManagementApp
 * shell can import them from a single module. Views live in focused files
 * below (~≤200 lines each); this file only re-exports. */

export { DashboardsView, ReportsView } from "./views-dashboard";
export { StudentsView } from "./views-students";
export { TeachersView } from "./views-teachers";
export { GroupsView } from "./views-groups";
export { CoursesView } from "./views-courses";
export { AssignmentsView } from "./views-assignments";
export { SubmissionsView } from "./views-submissions";
export { AttendanceView } from "./views-attendance";
export { MaterialsView } from "./views-materials";
export { CommunicationView } from "./views-communication";
export { TemplatesView } from "./views-templates";
export { ScheduledView } from "./views-scheduled";
export { NotificationsView } from "./views-notifications";

export type { MgTab, MgUserLite, MgRole, GroupLite, CourseLite } from "./types";