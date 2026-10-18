import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client holding the service-role key.
 *
 * Used exclusively by the email dispatcher, which must read and update the notification
 * queue that is deliberately inaccessible to anon/authenticated roles. Never import this
 * into client components.
 */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
