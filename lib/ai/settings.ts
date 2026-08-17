import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// ai-engine.md rule 6: read the per-user AI switch wherever a "Draft with
// AI" button might render, so it can be hidden entirely when off.
export async function getAiEnabled(supabase: SupabaseServerClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("users").select("ai_enabled").eq("id", userId).maybeSingle();
  return data?.ai_enabled ?? true;
}
