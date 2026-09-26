export interface AdminApplication {
  id: string;
  name: string;
  email: string;
  place: string;
  bio: string;
  course: string;
  message?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminMessage?: string | null;
  createdAt: string;
}

export type AdminEnrollmentStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PROOF_SUBMITTED"
  | "ENROLLED"
  | "REJECTED";

export type AdminPaymentMethod = "easypaisa" | "jazzcash" | "bank" | "other" | "card";

export interface AdminEnrollment {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  batch: string;
  plan?: string;
  paymentMethod?: AdminPaymentMethod | null;
  paymentInstructions?: string | null;
  paymentProof?: string | null;
  status: AdminEnrollmentStatus;
  adminMessage?: string | null;
  createdAt: string;
}

export interface AdminStats {
  /** Course registrations seen lifetime. */
  total: number;
  newCount: number;
  contacted: number;
  enrolled: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  users: number;
  courses: number;
  notifications: number;
  /** Enrolled / total — how many registrations converted. */
  responseRate: number;
}

/** Counts that cannot be derived reliably from the capped lists: full-table
 *  lifetime tallies (the queues are limited to 200 rows, so counting from them
 *  would undercount above 200). Read at page load and refreshed from the list
 *  APIs so the dashboard stays correct over time. */
export interface AdminCounts {
  users: number;
  courses: number;
  notifications: number;
  regTotal: number;
  regNew: number;
  regContacted: number;
  regEnrolled: number;
}

export type AdminRegistrationStatus = "NEW" | "CONTACTED" | "ENROLLED";

export interface AdminRegistration {
  id: string;
  ref: string;
  userId: string;
  name: string;
  email: string;
  course: string;
  courseKey: string;
  phone: string;
  address: string;
  dob: string;
  education: {
    qualification: string;
    institution: string;
    yearOfPassing: string;
  };
  study: {
    preferredTime: string;
    focusModules: string[];
    level: string;
    hoursPerWeek: string;
    heardAbout: string;
    extras?: string | null;
  };
  payment: {
    method: string;
    note?: string | null;
    receipt?: string | null;
    receiptName?: string | null;
  };
  status: AdminRegistrationStatus;
  adminMessage?: string | null;
  pdfAttached: boolean;
  createdAt: string;
}

/** Lightweight student-directory entry (password never leaves the server). */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: string | null;
  role: string;
  createdAt: string;
}

/** Staff directory entry (admins + teachers). Password never leaves the server. */
export interface AdminTeacher {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER";
  disabled: boolean;
  createdAt: string;
}

export interface AdminBatch {
  name: string;
  time: string;
  seatsTotal: number;
  seatsUsed?: number;
  seatsLeft?: number;
  full?: boolean;
}

export interface AdminCourse {
  id: string;
  name: string;
  tagline: string;
  description: string;
  fee: number;
  currency: string;
  duration: string;
  teacher: string;
  schedule: string;
  order: number;
  active: boolean;
  batches: AdminBatch[];
  seatsTotal?: number;
  seatsUsed?: number;
  seatsLeft?: number;
}