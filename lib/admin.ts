import { redirect } from "next/navigation";
import type { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Mirrors public.is_admin(): 'artego_admin' in users.roles. RLS already
// enforces this at the database level for every mutation below — this is
// the app-level gate so a non-admin never sees the admin UI at all.
export async function requireAdmin(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase.from("users").select("roles").eq("id", user.id).maybeSingle();
  if (!me?.roles?.includes("artego_admin")) {
    redirect("/dashboard");
  }

  return user;
}

export async function isAdmin(supabase: SupabaseServerClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("users").select("roles").eq("id", userId).maybeSingle();
  return Boolean(data?.roles?.includes("artego_admin"));
}

// permissions.md: "Permanent delete | ... Restricted + audit" and
// data-model.md: audit_log is the "record of sensitive admin actions".
// row_level_security.sql gives audit_log no client-facing INSERT policy —
// only a service-role write can create a row, so every admin action must
// go through this helper rather than a plain insert on the session client.
export async function logAuditEvent(params: {
  actorId: string;
  action: string;
  targetTable?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    user_id: params.actorId,
    action: params.action,
    target_table: params.targetTable ?? null,
    target_id: params.targetId ?? null,
    details: params.details ?? null,
  });
}
