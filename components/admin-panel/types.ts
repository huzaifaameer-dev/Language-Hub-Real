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

export interface AdminEnrollment {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  batch: string;
  plan?: string;
  status: "PENDING" | "ENROLLED" | "REJECTED";
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
  today: number;
  thisWeek: number;
  thisMonth: number;
  users: number;
  courses: number;
  notifications: number;
  approvalRate: number;
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