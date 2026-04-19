import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/**
 * Server-side Supabase client with service role key.
 * RLS'i bypass eder; sadece API route'ları ve script'ler içinde kullan.
 * Asla client bundle'a sızmamalı.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    cached = null;
    return cached;
  }
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function requireSupabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error(
      "Supabase admin client yapılandırılmamış. `.env.local` içinde SUPABASE_SERVICE_ROLE_KEY ve NEXT_PUBLIC_SUPABASE_URL tanımlı olmalı.",
    );
  }
  return client;
}
