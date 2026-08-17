import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

const LOG_LIMIT = 100;

const ACTION_LABEL: Record<string, string> = {
  verify_artist: "Verified artist",
  reset_artist_verification: "Reset artist verification",
  suspend_user: "Suspended user",
  reactivate_user: "Reactivated user",
  unpublish_content: "Unpublished content",
};

export default async function AdminAuditLogPage() {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { data: entries } = await supabase
    .from("audit_log")
    .select("id, action, target_table, target_id, details, created_at, users(email)")
    .order("created_at", { ascending: false })
    .limit(LOG_LIMIT);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-artego-red-deep underline">
          ← Admin: Users
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Audit Log</h1>
      </div>

      {!entries || entries.length === 0 ? (
        <p className="text-base text-grey-600">No admin actions recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const actor = (entry.users as unknown as { email: string } | null)?.email ?? "Unknown";
            return (
              <li key={entry.id} className="rounded border border-grey-200 p-3">
                <p className="text-[15px] font-semibold text-artego-black">
                  {ACTION_LABEL[entry.action] ?? entry.action}
                </p>
                <p className="text-sm text-grey-600">
                  {actor} · {new Date(entry.created_at).toLocaleString()}
                </p>
                {entry.target_table && (
                  <p className="text-sm text-grey-600">
                    Target: {entry.target_table}
                    {entry.target_id ? ` (${entry.target_id})` : ""}
                  </p>
                )}
                {entry.details && (
                  <p className="text-sm text-grey-600">{JSON.stringify(entry.details)}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
