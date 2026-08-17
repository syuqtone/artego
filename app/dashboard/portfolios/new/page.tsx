import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewPortfolioForm from "./NewPortfolioForm";

export default async function NewPortfolioPage() {
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

  const { data: collectionsData } = await supabase
    .from("collection")
    .select("id, title, collection_item(count)")
    .eq("artist_profile_id", profile.id)
    .order("created_at", { ascending: false });

  const collections = (collectionsData ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    artworkCount: c.collection_item?.[0]?.count ?? 0,
  }));

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/portfolios" className="text-sm font-semibold text-artego-red-deep underline">
          ← Portfolios
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">New Portfolio</h1>
      </div>

      {collections.length === 0 ? (
        <p className="text-base text-grey-600">
          You need a collection first.{" "}
          <Link href="/dashboard/collections/new" className="font-semibold text-artego-red-deep underline">
            Create one
          </Link>{" "}
          and add some artworks to it.
        </p>
      ) : (
        <NewPortfolioForm collections={collections} />
      )}
    </div>
  );
}
