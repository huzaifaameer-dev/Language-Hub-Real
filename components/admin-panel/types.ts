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
  approvalRate: number;
}