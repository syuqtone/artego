import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollectionManager from "./CollectionManager";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: collection } = await supabase
    .from("collection")
    .select("id, title, description, visibility, artist_profile_id")
    .eq("id", id)
    .maybeSingle();

  if (!collection || collection.artist_profile_id !== profile.id) {
    notFound();
  }

  const { data: itemRows } = await supabase
    .from("collection_item")
    .select("id, artwork_id, artwork(id, title, artwork_image(public_url, role))")
    .eq("collection_id", id)
    .order("sort_order", { ascending: true });

  type ArtworkImageRow = { public_url: string | null; role: string };
  type ArtworkRel = { id: string; title: string; artwork_image: ArtworkImageRow[] | null };

  const items = (itemRows ?? []).map((row) => {
    const artwork = row.artwork as unknown as ArtworkRel;
    return {
      id: row.id,
      artworkId: row.artwork_id,
      title: artwork?.title ?? "Untitled",
      thumbUrl: artwork?.artwork_image?.find((img) => img.role === "thumbnail_300")?.public_url ?? null,
    };
  });

  const inCollectionIds = new Set(items.map((i) => i.artworkId));

  const { data: allArtworks } = await supabase
    .from("artwork")
    .select("id, title, artwork_image(public_url, role)")
    .eq("artist_profile_id", profile.id)
    .order("created_at", { ascending: false });

  const available = (allArtworks ?? [])
    .filter((a) => !inCollectionIds.has(a.id))
    .map((a) => ({
      id: a.id,
      title: a.title,
      thumbUrl: a.artwork_image?.find((img) => img.role === "thumbnail_300")?.public_url ?? null,
    }));

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/collections" className="text-sm font-semibold text-artego-red-deep underline">
          ← Collections
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">{collection.title}</h1>
        {collection.description && (
          <p className="mt-1 text-sm text-grey-600">{collection.description}</p>
        )}
      </div>

      <CollectionManager collectionId={id} items={items} available={available} />
    </div>
  );
}
