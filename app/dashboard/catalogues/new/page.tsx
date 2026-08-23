import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAiEnabled } from "@/lib/ai/settings";
import NewPublicationForm from "@/components/NewPublicationForm";

export default async function NewCataloguePage() {
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

  const { data: artworksData } = await supabase
    .from("artwork")
    .select("id, title, artwork_image(public_url, role)")
    .eq("artist_profile_id", profile.id)
    .order("created_at", { ascending: false });

  type ArtworkImageRow = { public_url: string | null; role: string };
  const artworks = (artworksData ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    thumbUrl:
      (a.artwork_image as unknown as ArtworkImageRow[] | null)?.find(
        (img) => img.role === "thumbnail_300",
      )?.public_url ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/create" className="text-sm font-semibold text-artego-red-deep underline">
          ← Create
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">Artwork Catalogues</h1>
      </div>

      {artworks.length === 0 ? (
        <p className="text-base text-grey-600">
          You don&rsquo;t have any artworks yet.{" "}
          <Link href="/dashboard/artworks/new" className="font-semibold text-artego-red-deep underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <NewPublicationForm
          kind="catalogues"
          artworks={artworks}
          aiEnabled={await getAiEnabled(supabase, user.id)}
        />
      )}
    </div>
  );
}
