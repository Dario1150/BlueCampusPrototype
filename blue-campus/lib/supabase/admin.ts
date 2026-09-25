import { createClient } from "@supabase/supabase-js";

/**
 * Elevated Supabase client for server-only admin operations (creating auth
 * users, sending invites). Uses the service role key, which bypasses RLS —
 * NEVER expose this client or the key to the browser. Only call from Server
 * Actions/Components that have already checked the caller's role.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
