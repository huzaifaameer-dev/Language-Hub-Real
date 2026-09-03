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
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  enrPending: number;
  enrEnrolled: number;
  enrRejected: number;
  paymentsTotal: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  users: number;
  courses: number;
  notifications: number;
  approvalRate: number;
}

/** Counts that cannot be derived reliably from the capped lists: full-table
 *  lifetime tallies (the queues are limited to 200 rows, so counting from them
 *  would undercount above 200). Read at page load and refreshed from the list
 *  APIs so the dashboard stays correct over time. */
export interface AdminCounts {
  users: number;
  courses: number;
  notifications: number;
  paymentsTotal: number;
  appsTotal: number;
  appsPending: number;
  appsApproved: number;
  appsRejected: number;
  enrsPending: number;
  enrsAwaiting: number;
  enrsProof: number;
  enrsEnrolled: number;
  enrsRejected: number;
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