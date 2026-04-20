import { apiRequest, setToken } from "./api";

export interface AuthUser {
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

interface AuthResponse {
  token: string;
  user: AuthUser;
}

import type { NgoSignupFields } from "./domain";

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role?: "user" | "ngo";
  ngo?: NgoSignupFields;
}

export async function signup(input: SignupInput) {
  const res = await apiRequest<AuthResponse>("/auth/signup", { method: "POST", body: input, auth: false });
  setToken(res.token);
  return res.user;
}

export async function login(input: { email: string; password: string }) {
  const res = await apiRequest<AuthResponse>("/auth/login", { method: "POST", body: input, auth: false });
  setToken(res.token);
  return res.user;
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await apiRequest<{ user: AuthUser }>("/auth/me");
    return res.user;
  } catch {
    return null;
  }
}

export function logout() {
  setToken(null);
}
