import { apiRequest } from "./api";

// ---- User stats ----
export interface MeStats {
  activeCommunities: number;
  problemsJoined: number;
  totalContributed: number;
  problemsCreated: number;
  problemsSolved: number;
  reputationScore: number;
  role: string;
  ngoStatus: "pending" | "approved" | "rejected" | null;
}
export const fetchMyStats = () => apiRequest<MeStats>("/users/me/stats");

// ---- Problems the user has joined ----
export interface JoinedProblem {
  id: number;
  title: string;
  category: string;
  location: string;
  status: string;
  progressPercent: number;
  imageUrl?: string;
}
export const fetchMyJoinedProblems = () => apiRequest<JoinedProblem[]>("/problems/me/joined");

export const joinProblem = (id: number) =>
  apiRequest<{ joined: boolean; alreadyMember: boolean }>(`/problems/${id}/join`, { method: "POST" });
export const leaveProblem = (id: number) =>
  apiRequest<{ left: boolean; wasMember: boolean }>(`/problems/${id}/join`, { method: "DELETE" });
export interface SolveAsNgoPlan {
  planDescription?: string;
  estimatedCost?: number;
  timelineValue?: number;
  timelineUnit?: "days" | "months";
  requiredResources?: string;
}
export const solveAsNgo = (id: number, plan?: SolveAsNgoPlan) =>
  apiRequest<{ success: boolean; message: string }>(`/problems/${id}/solve-as-ngo`, { method: "POST", body: plan });

// ---- Contributions ----
export type PaymentMethod = "jazzcash" | "easypaisa" | "bank" | "other";

export interface ContributionInput {
  problemId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentMethodOther?: string;
  transactionId: string;
  proofImageUrl?: string;
  anonymous?: boolean;
}
export interface Contribution {
  id: number;
  problemId: number;
  problemTitle: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  paymentMethod: string;
  paymentMethodOther?: string;
  transactionId: string;
  proofImageUrl?: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}
export const submitContribution = (input: ContributionInput) =>
  apiRequest<Contribution>("/contributions", { method: "POST", body: input });
export const fetchMyContributions = () => apiRequest<Contribution[]>("/contributions");

// ---- Admin ----
export interface AdminContribution extends Contribution {
  userId: number;
  userName: string;
  userEmail: string;
}
export interface AdminNgo {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  organization: string;
  contactNumber: string;
  planDescription: string;
  estimatedCost: number;
  timelineValue: number;
  timelineUnit: "days" | "months";
  requiredResources: string;
  previousWorkUrl?: string;
  certificateUrl?: string;
  agreedToProvideUpdates: boolean;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
}

export const adminListContributions = (status = "pending") =>
  apiRequest<AdminContribution[]>(`/admin/contributions?status=${status}`);
export const adminApproveContribution = (id: number) =>
  apiRequest<{ success: boolean }>(`/admin/contributions/${id}/approve`, { method: "POST" });
export const adminRejectContribution = (id: number, reason: string) =>
  apiRequest<{ success: boolean }>(`/admin/contributions/${id}/reject`, { method: "POST", body: { reason } });

export interface AdminNgoApplication {
  id: number;
  problemId: number;
  problemTitle: string | null;
  problemCategory: string | null;
  ngoUserId: number;
  ngoName: string | null;
  planDescription: string;
  estimatedCost: number;
  timelineValue: number;
  timelineUnit: string;
  requiredResources: string;
  status: "pending" | "accepted" | "rejected";
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}
export const adminListNgoApplications = () =>
  apiRequest<{ applications: AdminNgoApplication[] }>("/admin/ngo-applications");
export const adminAcceptNgoApplication = (id: number) =>
  apiRequest<{ success: boolean }>(`/admin/ngo-applications/${id}/accept`, { method: "POST" });
export const adminRejectNgoApplication = (id: number, reason?: string) =>
  apiRequest<{ success: boolean }>(`/admin/ngo-applications/${id}/reject`, { method: "POST", body: { reason } });

export const adminListNgos = (status = "pending") =>
  apiRequest<AdminNgo[]>(`/admin/ngos?status=${status}`);
export const adminApproveNgo = (id: number) =>
  apiRequest<{ success: boolean }>(`/admin/ngos/${id}/approve`, { method: "POST" });
export const adminRejectNgo = (id: number, reason: string) =>
  apiRequest<{ success: boolean }>(`/admin/ngos/${id}/reject`, { method: "POST", body: { reason } });

export interface AdminStats {
  totalUsers: number;
  totalNgos: number;
  totalProblems: number;
  totalCommunities: number;
  totalApprovedContributions: number;
  totalFundsRaised: number;
  pendingNgoApplications: number;
  pendingContributions: number;
  activeProblems: number;
}
export const adminGetStats = () => apiRequest<AdminStats>("/admin/stats");

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  reputationScore: number;
  problemsCreated: number;
  problemsSolved: number;
  totalContributed: number;
  joinedAt: string;
}
export const adminListUsers = (params?: { search?: string; role?: string }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.role) q.set("role", params.role);
  return apiRequest<AdminUser[]>(`/admin/users${q.toString() ? `?${q}` : ""}`);
};
export const adminChangeUserRole = (id: number, role: string) =>
  apiRequest<{ success: boolean }>(`/admin/users/${id}/role`, { method: "PATCH", body: { role } });
export const adminDeleteUser = (id: number) =>
  apiRequest<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" });

export interface AdminProblem {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  imageUrl?: string;
  fundingGoal: number;
  fundingRaised: number;
  progressPercent: number;
  workProgressPercent: number;
  joinedCount: number;
  urgency: string;
  verifiedCount: number;
  postedByName: string;
  postedByEmail: string;
  postedById?: number;
  createdAt: string;
}
export const adminListProblems = (params?: { search?: string; status?: string }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.status) q.set("status", params.status);
  return apiRequest<AdminProblem[]>(`/admin/problems${q.toString() ? `?${q}` : ""}`);
};
export const adminApproveProblem = (id: number) =>
  apiRequest<{ success: boolean }>(`/admin/problems/${id}/approve`, { method: "POST" });
export const adminRejectProblem = (id: number) =>
  apiRequest<{ success: boolean }>(`/admin/problems/${id}/reject`, { method: "POST" });
export const adminUpdateWorkProgress = (id: number, workProgressPercent: number) =>
  apiRequest<{ success: boolean }>(`/admin/problems/${id}/work-progress`, { method: "PUT", body: { workProgressPercent } });
export const adminDeleteProblem = (id: number) =>
  apiRequest<{ success: boolean }>(`/admin/problems/${id}`, { method: "DELETE" });

export interface AdminCreateProblemInput {
  title: string;
  description: string;
  category: string;
  location: string;
  urgency: string;
  fundingGoal: number;
  imageUrl?: string;
  status?: string;
}
export const adminCreateProblem = (input: AdminCreateProblemInput) =>
  apiRequest<{ id: number }>("/admin/problems", { method: "POST", body: input });

export interface AdminCommunityTask {
  id: number;
  communityId?: number;
  title: string;
  description: string;
  assignedTo?: string;
  status: string;
  dueDate?: string;
  createdAt: string;
}

export interface AdminCommunity {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  problemCount: number;
  category: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  recentMembers: { userId: number; userName: string; userAvatar?: string; joinedAt: string }[];
  tasks: AdminCommunityTask[];
}
export const adminListCommunities = () => apiRequest<AdminCommunity[]>("/admin/communities");

export interface AdminCommunityInput {
  name: string;
  description: string;
  category: string;
  memberCount?: number;
  problemCount?: number;
  imageUrl?: string;
  active?: boolean;
}
export const adminCreateCommunity = (input: AdminCommunityInput) =>
  apiRequest<AdminCommunity>("/admin/communities", { method: "POST", body: input });
export const adminUpdateCommunity = (id: number, input: Partial<AdminCommunityInput>) =>
  apiRequest<AdminCommunity>(`/admin/communities/${id}`, { method: "PUT", body: input });
export const adminDeleteCommunity = (id: number) =>
  apiRequest<{ success: boolean }>(`/admin/communities/${id}`, { method: "DELETE" });

export interface AdminTaskInput {
  title: string;
  description: string;
  assignedTo?: string;
  status?: string;
  dueDate?: string;
}
export const adminCreateTask = (communityId: number, input: AdminTaskInput) =>
  apiRequest<AdminCommunityTask>(`/admin/communities/${communityId}/tasks`, { method: "POST", body: input });
export const adminUpdateTask = (communityId: number, taskId: number, input: Partial<AdminTaskInput>) =>
  apiRequest<AdminCommunityTask>(`/admin/communities/${communityId}/tasks/${taskId}`, { method: "PUT", body: input });
export const adminDeleteTask = (communityId: number, taskId: number) =>
  apiRequest<{ success: boolean }>(`/admin/communities/${communityId}/tasks/${taskId}`, { method: "DELETE" });

// ---- NGO signup payload ----
export interface NgoSignupFields {
  organization: string;
  contactNumber: string;
  planDescription?: string;
  estimatedCost?: number;
  timelineValue?: number;
  timelineUnit?: "days" | "months";
  requiredResources?: string;
  previousWorkUrl?: string;
  certificateUrl?: string;
  agreedToProvideUpdates: boolean;
}

// ---- NGO Join Applications ----
export interface NgoJoinApplication {
  id: number;
  problemId: number;
  problemTitle?: string | null;
  problemCategory?: string | null;
  ngoUserId: number;
  planDescription: string;
  estimatedCost: number;
  timelineValue: number;
  timelineUnit: string;
  requiredResources: string;
  status: "pending" | "accepted" | "rejected";
  rejectionReason?: string | null;
  createdAt: string;
}
export interface SubmitNgoApplicationBody {
  planDescription: string;
  estimatedCost?: number;
  timelineValue?: number;
  timelineUnit?: "days" | "months";
  requiredResources?: string;
}
export const submitNgoApplication = (problemId: number, body: SubmitNgoApplicationBody) =>
  apiRequest<{ success: boolean; application: NgoJoinApplication }>(`/problems/${problemId}/ngo-application`, { method: "POST", body });
export const getMyNgoApplication = (problemId: number) =>
  apiRequest<{ application: NgoJoinApplication | null }>(`/problems/${problemId}/ngo-application/mine`);
export const getMyAllNgoApplications = () =>
  apiRequest<{ applications: NgoJoinApplication[] }>("/ngo/my-ngo-applications");

// ---- Image upload ----
export async function uploadImage(file: File): Promise<string> {
  const { getToken } = await import("./api");
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const base = `${import.meta.env.BASE_URL}api`.replace(/\/+$/, "").replace(/\/api\/api$/, "/api");
  const res = await fetch(`${base}/uploads/image`, {
    method: "POST",
    body: fd,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const data = (await res.json()) as { url: string };
  return data.url;
}
