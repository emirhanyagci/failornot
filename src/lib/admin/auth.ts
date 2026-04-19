import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Basit tek-kullanıcı admin auth sistemi.
 * - Kredensiyaller env'den okunur (ADMIN_USERNAME / ADMIN_PASSWORD).
 * - Başarılı girişte HMAC imzalı cookie set edilir.
 * - Hiçbir DB/user tablosu yok; bilerek minimal tutuldu.
 *
 * Geliştirme default'ları: emirhan.yac / 12345679
 * (Prod için mutlaka .env.local'de override et.)
 */

const DEFAULT_USERNAME = "emirhan.yac";
const DEFAULT_PASSWORD = "12345679";

export const SESSION_COOKIE = "faulornot_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 gün

function getUsername(): string {
  return (process.env.ADMIN_USERNAME || DEFAULT_USERNAME).trim();
}

function getPassword(): string {
  return (process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD).trim();
}

function getSecret(): string {
  // Ayrı bir ADMIN_SESSION_SECRET tanımlanmadıysa parolayı kullan.
  // Parola değişirse tüm açık oturumlar otomatik geçersiz olur.
  return (
    process.env.ADMIN_SESSION_SECRET ||
    `${getUsername()}::${getPassword()}`
  );
}

function sign(message: string): string {
  return createHmac("sha256", getSecret()).update(message).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyCredentials(username: string, password: string): boolean {
  if (typeof username !== "string" || typeof password !== "string") return false;
  const expectedUser = getUsername();
  const expectedPass = getPassword();
  const u = username.trim();
  const p = password.trim();
  const ok = safeEqual(u, expectedUser) && safeEqual(p, expectedPass);
  if (!ok && process.env.NODE_ENV !== "production") {
    // Dev yardımı — üretime çıkmamalı (sadece dev sunucuda görürsün).
    console.warn(
      "[admin auth] reddedildi:",
      `user="${u}" (expected="${expectedUser}", uLen=${u.length}/${expectedUser.length})`,
      `passLen=${p.length}/${expectedPass.length}`,
    );
  }
  return ok;
}

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${getUsername()}:${exp}`;
  const sig = sign(payload);
  return `${payload}:${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [user, expStr, sig] = parts;
  if (user !== getUsername()) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(`${user}:${expStr}`);
  return safeEqual(expected, sig);
}

export async function isLoggedIn(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
  secure: process.env.NODE_ENV === "production",
};
