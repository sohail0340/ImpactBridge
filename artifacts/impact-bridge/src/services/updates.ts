import { apiRequest } from "./api";

export interface ProblemUpdate {
  id: number;
  problemId: number;
  content: string;
  author: string;
  authorAvatar?: string;
  imageUrl?: string;
  verifiedCount: number;
  verifiedByMe?: boolean;
  createdAt: string;
}

export async function getUpdates(problemId: number) {
  return apiRequest<ProblemUpdate[]>(`/problems/${problemId}/updates`);
}

export async function addUpdate(problemId: number, content: string, imageUrl?: string) {
  return apiRequest<ProblemUpdate>(`/problems/${problemId}/updates`, {
    method: "POST",
    body: { content, imageUrl },
  });
}

export async function verifyUpdate(problemId: number, updateId: number) {
  return apiRequest<{ verifiedCount: number; verifiedByMe: boolean }>(
    `/problems/${problemId}/updates/${updateId}/verify`,
    { method: "POST" },
  );
}
