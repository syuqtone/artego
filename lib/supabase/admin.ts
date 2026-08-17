import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Never import this from a
// "use client" file or expose the key to the browser (CLAUDE.md rule 10).
// row_level_security.sql deliberately gives audit_log no INSERT policy for
// anon/authenticated, specifically so an audit entry can only be written
// this way, from trusted server code, never forgeable by a client request.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
