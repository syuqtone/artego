import type { createClient } from "@/lib/supabase/server";

// quota.md / ai-engine.md: "50 generations per user per month" (academic
// phase) and "10 per user per hour". Each ai_job row is one generation
// attempt, so counting rows is the source of truth — no separate counter
// table to keep in sync.
const MONTHLY_LIMIT = 50;
const HOURLY_LIMIT = 10;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function checkAiQuota(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  const { count: monthCount } = await supabase
    .from("ai_job")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart);

  if ((monthCount ?? 0) >= MONTHLY_LIMIT) {
    return {
      ok: false,
      message: `You've used your ${MONTHLY_LIMIT} AI drafts for this month. The allowance resets next month.`,
    };
  }

  const { count: hourCount } = await supabase
    .from("ai_job")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", hourAgo);

  if ((hourCount ?? 0) >= HOURLY_LIMIT) {
    return {
      ok: false,
      message: `Too many AI requests in the last hour (limit ${HOURLY_LIMIT}). Please try again later.`,
    };
  }

  return { ok: true };
}
