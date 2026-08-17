import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Uses the public anon key only — safe to
// expose. Row Level Security on every table enforces what it can access.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
