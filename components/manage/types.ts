export type MgRole = "ADMIN" | "TEACHER" | "STUDENT";

/** Shape of the `me` payload the management API returns — identical to the
 *  local `Me` interface in ManagementApp so views stay decoupled. */
export interface MgUserLite {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: MgRole;
}

export type MgTab =
  | "dashboard"
  | "students"
  | "teachers"
  | "groups"
  | "assignments"
  | "submissions"
  | "attendance"
  | "materials"
  | "communication"
  | "scheduled"
  | "templates"
  | "reports"
  | "notifications";

export interface GroupLite {
  id: string;
  name: string;
  studentCount: number;
  courseName?: string | null;
}

export interface CourseLite {
  id: string;
  name: string;
  fee?: number | null;
  duration?: string | null;
}