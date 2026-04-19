import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function generateLobbyCode(length = 5): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateSecret(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function cls(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const AVATAR_IDS: string[] = Array.from({ length: 20 }, (_, i) =>
  `avatar-${(i + 1).toString().padStart(2, "0")}`,
);
