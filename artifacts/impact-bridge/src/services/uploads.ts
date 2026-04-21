import { getToken } from "./api";

const VITE_API_URL = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE = VITE_API_URL
  ? `${VITE_API_URL.replace(/\/+$/, "")}/api`
  : `${import.meta.env.BASE_URL}api`.replace(/\/+$/, "").replace(/\/api\/api$/, "/api");

export async function uploadImage(file: File): Promise<{ url: string; filename: string; size: number }> {
  const token = getToken();
  if (!token) throw new Error("You must be signed in to upload images.");

  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE}/uploads/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Upload failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}
