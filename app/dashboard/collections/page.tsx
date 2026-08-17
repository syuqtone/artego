import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("artist_profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    redirect("/dashboard/profile");
  }

  const { data: collections } = await supabase
    .from("collection")
    .select("id, title, visibility, collection_item(count)")
    .eq("artist_profile_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-artego-black">Collections</h1>
        </div>
        <Link
          href="/dashboard/collections/new"
          className="flex min-h-11 items-center rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white"
        >
          + New
        </Link>
      </div>

      {!collections || collections.length === 0 ? (
        <p className="text-base text-grey-600">
          No collections yet. Group artworks together with &ldquo;+ New&rdquo;.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/collections/${c.id}`}
                className="flex items-center justify-between rounded border border-grey-200 p-3"
              >
                <span className="text-[15px] font-semibold text-artego-black">{c.title}</span>
                <span className="text-sm text-grey-600">
                  {c.collection_item?.[0]?.count ?? 0} artworks
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
