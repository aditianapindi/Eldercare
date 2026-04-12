import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client with service-role key — bypasses RLS.
 * Lazy-initialized so builds don't fail when the key isn't set.
 * Server-only. Never import this on the client.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    _client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
  }
  return _client;
}
