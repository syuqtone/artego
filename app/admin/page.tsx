import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

const USER_LIMIT = 50;

const VERIFICATION_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  verified: "Verified",
  suspended: "Suspended",
};

type ArtistProfileRel = { id: string; display_name: string; verification_status: string };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const supabase = await createClient();
  await requireAdmin(supabase);

  let userIds: string[] | null = null;
  if (q) {
    const [{ data: byEmail }, { data: byName }] = await Promise.all([
      supabase.from("users").select("id").ilike("email", `%${q}%`),
      supabase.from("artist_profile").select("user_id").ilike("display_name", `%${q}%`),
    ]);
    const ids = new Set<string>();
    byEmail?.forEach((u) => ids.add(u.id));
    byName?.forEach((p) => ids.add(p.user_id));
    userIds = Array.from(ids);
  }

  let usersQuery = supabase
    .from("users")
    .select("id, email, roles, status, artist_profile(id, display_name, verification_status)")
    .order("created_at", { ascending: false })
    .limit(USER_LIMIT);

  if (userIds !== null) {
    usersQuery = usersQuery.in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: users } = await usersQuery;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-artego-black">Admin: Users</h1>
        </div>
        <Link
          href="/admin/audit-log"
          className="flex min-h-11 items-center rounded border border-artego-black px-3 text-[15px] font-semibold text-artego-black"
        >
          Audit Log
        </Link>
      </div>

      <form action="/admin" method="get" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search users by email or artist name
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search by email or artist name"
          className="min-h-11 flex-1 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
        />
        <button
          type="submit"
          className="min-h-11 rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white"
        >
          Search
        </button>
      </form>

      {!users || users.length === 0 ? (
        <p className="text-base text-grey-600">
          {q ? `No users match "${q}".` : "No users found."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u) => {
            const profile = (
              Array.isArray(u.artist_profile) ? u.artist_profile[0] : u.artist_profile
            ) as ArtistProfileRel | null;
            return (
              <li key={u.id}>
                <Link
                  href={`/admin/users/${u.id}`}
                  className="flex flex-col gap-1 rounded border border-grey-200 p-3"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-artego-black">
                      {profile?.display_name ?? u.email}
                    </span>
                    {u.status === "suspended" && (
                      <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-artego-white">
                        Suspended
                      </span>
                    )}
                    {u.roles.includes("artego_admin") && (
                      <span className="rounded-full bg-artego-blue px-2 py-0.5 text-xs font-semibold text-artego-white">
                        Admin
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-grey-600">{u.email}</span>
                  {profile && (
                    <span className="text-sm text-grey-600">
                      Artist profile: {VERIFICATION_LABEL[profile.verification_status] ?? profile.verification_status}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
